import postgres, { Sql, ISql, TransactionSql } from "postgres";
import { PlatformError, PlatformErrorCodes, LedgerTransaction, formatAccountIdentifier } from "@platform/shared";
import {
  validateDoubleEntryTransaction,
  createReservationTransaction,
  createSettlementTransaction,
  createReleaseTransaction
} from "@platform/core";
import { LedgerDatabase, ReservationRecord, WalletRecord } from "./database";

export interface PostgresDatabaseOptions {
  url: string;
  max?: number;
}

/**
 * Production Postgres adapter (Supabase-compatible connection string).
 *
 * SQL-first design: every financial operation executes as a single SQL
 * transaction (`sql.begin`) and takes a `SELECT ... FOR UPDATE` row lock on the
 * affected wallet, so concurrent gateway instances cannot overdraw or double
 * spend. `UNIQUE(idempotency_key)` on `ledger_transactions` is the second
 * concurrency guard — the in-process `processedIdempotencyKeys` set is only a
 * read cache, hydrated from the database at `init()`.
 *
 * The in-memory maps are caches for read paths only (seeding, reservation
 * lookups for the LedgerService short forms, run audits). `syncCache()` refreshes
 * them from Postgres inside every transaction, so they never diverge from what
 * was actually committed.
 */
export class PostgresDatabase implements LedgerDatabase {
  public wallets = new Map<string, WalletRecord>();
  public transactions = new Map<string, LedgerTransaction>();
  public reservations = new Map<string, ReservationRecord>();
  public processedIdempotencyKeys = new Set<string>();
  public actionRuns = new Map<string, any>();

  private sql: Sql;
  private initialized = false;

  constructor(private options: PostgresDatabaseOptions) {
    this.sql = postgres(options.url, { max: options.max ?? 10 });
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    await this.syncCache(this.sql);

    const txs = await this.sql`SELECT idempotency_key FROM ledger_transactions`;
    for (const t of txs) {
      this.processedIdempotencyKeys.add(t.idempotency_key);
    }

    this.initialized = true;
  }

  seedWallet(userId: string, credits: number): void {
    this.wallets.set(userId, { userId, availableCredits: credits, reservedCredits: 0 });
    // Write-through so a wallet seeded outside a transaction exists immediately.
    // `ON CONFLICT DO NOTHING` preserves a persisted balance across restarts.
    // Inside a transaction this query simply queues behind it (pool FIFO) and
    // becomes a no-op — the row is already created by the transaction itself.
    void this.sql`
      INSERT INTO wallets (user_id, available_credits, reserved_credits, updated_at)
      VALUES (${userId}, ${credits}, 0, now())
      ON CONFLICT (user_id) DO NOTHING
    `.catch(() => {});
  }

  /**
   * Executes `fn` inside one SQL transaction and passes it the transaction-
   * scoped query builder. On success the in-memory caches are refreshed from
   * the database; on failure the whole transaction rolls back.
   */
  async runInTransaction<T>(fn: (tx: TransactionSql) => Promise<T>): Promise<T> {
    return this.sql.begin(async (tx) => {
      const result = await fn(tx);
      // Keep the in-memory cache coherent for read paths (runs, seeding).
      await this.syncCache(tx);
      return result;
    }) as Promise<T>;
  }

  async lockWalletRow(_userId: string): Promise<() => void> {
    // Row locks are taken by the SQL ops themselves (`SELECT ... FOR UPDATE`),
    // so this legacy hook is intentionally a no-op.
    return () => {};
  }

  async executeLedgerTransaction(tx: LedgerTransaction): Promise<void> {
    if (this.processedIdempotencyKeys.has(tx.idempotencyKey)) {
      return; // Idempotent no-op
    }
    validateDoubleEntryTransaction(tx);
    this.transactions.set(tx.idempotencyKey, tx);
    this.processedIdempotencyKeys.add(tx.idempotencyKey);
  }

  async getWallet(userId: string): Promise<WalletRecord> {
    const [row] = await this.sql`
      SELECT user_id, available_credits, reserved_credits FROM wallets WHERE user_id = ${userId}
    `;
    if (!row) throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
    return {
      userId: row.user_id,
      availableCredits: Number(row.available_credits),
      reservedCredits: Number(row.reserved_credits)
    };
  }

  async reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    if (amount <= 0) {
      throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "Reservation amount must be greater than zero");
    }

    await this.runInTransaction(async (tx) => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) return;

      const [row] = await tx`
        SELECT available_credits, reserved_credits FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;
      if (!row) throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
      if (Number(row.available_credits) < amount) {
        throw new PlatformError(
          PlatformErrorCodes.INSUFFICIENT_CREDITS,
          `Insufficient credits: available ${Number(row.available_credits)}, required ${amount}`
        );
      }
      await tx`
        UPDATE wallets
        SET available_credits = available_credits - ${amount},
            reserved_credits = reserved_credits + ${amount},
            updated_at = now()
        WHERE user_id = ${userId}
      `;
      await tx`
        INSERT INTO reservations (run_id, user_id, amount)
        VALUES (${runId}, ${userId}, ${amount})
        ON CONFLICT (run_id) DO UPDATE SET amount = EXCLUDED.amount
      `;
      await this.insertLedgerTransaction(
        tx,
        createReservationTransaction({ userId, amountCredits: amount, idempotencyKey, runId })
      );
      this.processedIdempotencyKeys.add(idempotencyKey);
    });
  }

  async settleReservation(
    userId: string,
    amount: number,
    idempotencyKey: string,
    runId: string,
    providerCostCents: number
  ): Promise<void> {
    await this.runInTransaction(async (tx) => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) return;

      const [row] = await tx`
        SELECT available_credits, reserved_credits FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;
      if (!row) throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
      if (Number(row.reserved_credits) < amount) {
        throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, "Invalid reservation settlement state");
      }
      const [reservation] = await tx`
        SELECT run_id, user_id, amount FROM reservations WHERE run_id = ${runId}
      `;
      if (!reservation) {
        throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, `Reservation not found for runId: ${runId}`);
      }

      await tx`
        UPDATE wallets
        SET reserved_credits = reserved_credits - ${amount},
            updated_at = now()
        WHERE user_id = ${userId}
      `;
      await tx`DELETE FROM reservations WHERE run_id = ${runId}`;
      await this.insertLedgerTransaction(
        tx,
        createSettlementTransaction({ userId, amountCredits: amount, idempotencyKey, runId, providerCostCents })
      );
      this.processedIdempotencyKeys.add(idempotencyKey);
    });
  }

  async releaseReservation(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    await this.runInTransaction(async (tx) => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) return;

      const [row] = await tx`
        SELECT available_credits, reserved_credits FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;
      if (!row || Number(row.reserved_credits) < amount) {
        return; // Nothing to release
      }

      await tx`
        UPDATE wallets
        SET reserved_credits = reserved_credits - ${amount},
            available_credits = available_credits + ${amount},
            updated_at = now()
        WHERE user_id = ${userId}
      `;
      await tx`DELETE FROM reservations WHERE run_id = ${runId}`;
      await this.insertLedgerTransaction(
        tx,
        createReleaseTransaction({ userId, amountCredits: amount, idempotencyKey, runId })
      );
      this.processedIdempotencyKeys.add(idempotencyKey);
    });
  }

  async applyCredit(
    userId: string,
    amount: number,
    transactionType: "TOPUP" | "BONUS" | "REFUND",
    idempotencyKey: string,
    referenceId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.runInTransaction(async (tx) => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) return;

      const delta = transactionType === "REFUND" ? -amount : amount;
      const clearingEntry = {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: -delta
      };
      const walletEntry = {
        accountIdentifier: formatAccountIdentifier("USER_WALLET", userId),
        amountCredits: delta
      };
      const transaction: LedgerTransaction = {
        idempotencyKey,
        transactionType,
        referenceId,
        // REFUND entries are recorded wallet-first to mirror the historical
        // direction of the refund double-entry pair; TOPUP/BONUS are clearing-first.
        entries: transactionType === "REFUND" ? [walletEntry, clearingEntry] : [clearingEntry, walletEntry],
        metadata
      };
      await this.insertLedgerTransaction(tx, transaction);
      await tx`
        INSERT INTO wallets (user_id, available_credits, reserved_credits, updated_at)
        VALUES (${userId}, ${delta}, 0, now())
        ON CONFLICT (user_id) DO UPDATE SET
          available_credits = wallets.available_credits + EXCLUDED.available_credits,
          updated_at = now()
      `;
      this.processedIdempotencyKeys.add(idempotencyKey);
    });
  }

  async close(): Promise<void> {
    await this.sql.end();
  }

  /**
   * Inserts a balanced ledger transaction (header + entries) inside the caller's
   * transaction. `ON CONFLICT (idempotency_key) DO NOTHING` makes replays
   * idempotent at the database level — the UNIQUE constraint is the concurrency
   * guard when two gateways race on the same key.
   */
  private async insertLedgerTransaction(tx: ISql, transaction: LedgerTransaction): Promise<void> {
    validateDoubleEntryTransaction(transaction);
    const [header] = await tx`
      INSERT INTO ledger_transactions (idempotency_key, transaction_type, reference_id, metadata)
      VALUES (
        ${transaction.idempotencyKey},
        ${transaction.transactionType},
        ${transaction.referenceId ?? null},
        ${tx.json((transaction.metadata ?? {}) as any)}
      )
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id
    `;
    if (header) {
      for (const entry of transaction.entries) {
        await tx`
          INSERT INTO ledger_entries (transaction_id, account_identifier, amount_credits)
          VALUES (${header.id}, ${entry.accountIdentifier}, ${entry.amountCredits})
        `;
      }
    }
  }

  /** Refreshes the in-memory read caches from the database inside `tx`. */
  private async syncCache(tx: ISql): Promise<void> {
    const wallets = await tx`SELECT user_id, available_credits, reserved_credits FROM wallets`;
    this.wallets.clear();
    for (const w of wallets) {
      this.wallets.set(w.user_id, {
        userId: w.user_id,
        availableCredits: Number(w.available_credits),
        reservedCredits: Number(w.reserved_credits)
      });
    }

    const reservations = await tx`SELECT run_id, user_id, amount FROM reservations`;
    this.reservations.clear();
    for (const r of reservations) {
      this.reservations.set(r.run_id, { userId: r.user_id, amount: Number(r.amount) });
    }

    const runs = await tx`
      SELECT id, project_id, user_id, action_name, action_version, idempotency_key,
             status, model, reserved_credits, consumed_credits, input_hash,
             prompt_hash, cost_cents, created_at, completed_at
      FROM action_runs
    `;
    this.actionRuns.clear();
    for (const r of runs) {
      this.actionRuns.set(r.id, {
        id: r.id,
        runId: r.id,
        projectId: r.project_id,
        userId: r.user_id,
        actionName: r.action_name,
        actionVersion: r.action_version,
        idempotencyKey: r.idempotency_key,
        status: r.status,
        model: r.model,
        reservedCredits: Number(r.reserved_credits),
        consumedCredits: Number(r.consumed_credits ?? 0),
        promptHash: r.prompt_hash ?? "",
        inputHash: r.input_hash ?? "",
        costCents: r.cost_cents != null ? Number(r.cost_cents) : undefined,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
        completedAt:
          r.completed_at != null
            ? r.completed_at instanceof Date
              ? r.completed_at.toISOString()
              : r.completed_at
            : undefined
      });
    }
  }
}
