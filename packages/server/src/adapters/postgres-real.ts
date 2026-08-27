import postgres, { Sql } from "postgres";
import { LedgerTransaction } from "@platform/shared";
import { validateDoubleEntryTransaction } from "@platform/core";
import { LedgerDatabase, ReservationRecord, WalletRecord } from "./database";

export interface PostgresDatabaseOptions {
  url: string;
  max?: number;
}

/**
 * Production Postgres adapter (Supabase-compatible connection string).
 *
 * Interim strategy: the in-process maps remain the working state — services
 * read/mutate them synchronously — and every `runInTransaction` commits a
 * snapshot (wallets, ledger transactions, reservations, action runs) to
 * PostgreSQL with upserts. `init()` hydrates the maps from the database, so a
 * gateway restart keeps all balances, reservations and audit records.
 *
 * This gives real persistence with keys-only configuration. The SQL-first
 * refactor (single SQL transactions with `SELECT ... FOR UPDATE` row locks,
 * `UNIQUE(idempotency_key)` as the sole concurrency guard) is Task 1 of the
 * production-integrations implementation plan.
 */
export class PostgresDatabase implements LedgerDatabase {
  public wallets = new Map<string, WalletRecord>();
  public transactions = new Map<string, LedgerTransaction>();
  public reservations = new Map<string, ReservationRecord>();
  public processedIdempotencyKeys = new Set<string>();
  public actionRuns = new Map<string, any>();

  private sql: Sql;
  private mutex = Promise.resolve();
  private initialized = false;
  private knownReservationRunIds = new Set<string>();
  private persistedTransactionKeys = new Set<string>();

  constructor(private options: PostgresDatabaseOptions) {
    this.sql = postgres(options.url, { max: options.max ?? 10 });
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const wallets = await this.sql`SELECT user_id, available_credits, reserved_credits FROM wallets`;
    for (const w of wallets) {
      this.wallets.set(w.user_id, {
        userId: w.user_id,
        availableCredits: Number(w.available_credits),
        reservedCredits: Number(w.reserved_credits)
      });
    }

    const txs = await this.sql`SELECT idempotency_key FROM ledger_transactions`;
    for (const t of txs) {
      this.processedIdempotencyKeys.add(t.idempotency_key);
      this.persistedTransactionKeys.add(t.idempotency_key);
    }

    const reservations = await this.sql`SELECT run_id, user_id, amount FROM reservations`;
    for (const r of reservations) {
      this.knownReservationRunIds.add(r.run_id);
      this.reservations.set(r.run_id, { userId: r.user_id, amount: Number(r.amount) });
    }

    const runs = await this.sql`
      SELECT id, project_id, user_id, action_name, action_version, idempotency_key,
             status, model, reserved_credits, consumed_credits, input_hash,
             prompt_hash, cost_cents, created_at, completed_at
      FROM action_runs
    `;
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

    this.initialized = true;
  }

  seedWallet(userId: string, credits: number): void {
    this.wallets.set(userId, { userId, availableCredits: credits, reservedCredits: 0 });
  }

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const nextMutex = new Promise<void>(resolve => {
      release = resolve;
    });
    const currentMutex = this.mutex;
    this.mutex = currentMutex.then(() => nextMutex, () => nextMutex);

    await currentMutex.catch(() => {});
    try {
      const result = await fn();
      await this.persist();
      return result;
    } finally {
      release!();
    }
  }

  async lockWalletRow(_userId: string): Promise<() => void> {
    // The process-local mutex in runInTransaction already serializes wallet
    // access; real row locking arrives with the SQL-first refactor.
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

  async close(): Promise<void> {
    await this.sql.end();
  }

  private async persist(): Promise<void> {
    for (const w of this.wallets.values()) {
      await this.sql`
        INSERT INTO wallets (user_id, available_credits, reserved_credits, updated_at)
        VALUES (${w.userId}, ${w.availableCredits}, ${w.reservedCredits}, now())
        ON CONFLICT (user_id) DO UPDATE SET
          available_credits = EXCLUDED.available_credits,
          reserved_credits = EXCLUDED.reserved_credits,
          updated_at = now()
      `;
    }

    for (const tx of this.transactions.values()) {
      if (this.persistedTransactionKeys.has(tx.idempotencyKey)) continue;
      const [header] = await this.sql`
        INSERT INTO ledger_transactions (idempotency_key, transaction_type, reference_id, metadata)
        VALUES (${tx.idempotencyKey}, ${tx.transactionType}, ${tx.referenceId ?? null}, ${this.sql.json((tx.metadata ?? {}) as any)})
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id
      `;
      if (header) {
        for (const entry of tx.entries) {
          await this.sql`
            INSERT INTO ledger_entries (transaction_id, account_identifier, amount_credits)
            VALUES (${header.id}, ${entry.accountIdentifier}, ${entry.amountCredits})
          `;
        }
      }
      this.persistedTransactionKeys.add(tx.idempotencyKey);
    }

    for (const runId of this.knownReservationRunIds) {
      if (!this.reservations.has(runId)) {
        await this.sql`DELETE FROM reservations WHERE run_id = ${runId}`;
        this.knownReservationRunIds.delete(runId);
      }
    }
    for (const [runId, r] of this.reservations) {
      await this.sql`
        INSERT INTO reservations (run_id, user_id, amount)
        VALUES (${runId}, ${r.userId}, ${r.amount})
        ON CONFLICT (run_id) DO UPDATE SET user_id = EXCLUDED.user_id, amount = EXCLUDED.amount
      `;
      this.knownReservationRunIds.add(runId);
    }

    for (const run of this.actionRuns.values()) {
      await this.sql`
        INSERT INTO action_runs (
          id, project_id, user_id, action_name, action_version, idempotency_key,
          status, model, reserved_credits, consumed_credits, input_hash,
          prompt_hash, cost_cents, created_at, completed_at
        )
        VALUES (
          ${run.id}, ${run.projectId}, ${run.userId}, ${run.actionName}, ${run.actionVersion},
          ${run.idempotencyKey}, ${run.status}, ${run.model}, ${run.reservedCredits ?? 0},
          ${run.consumedCredits ?? 0}, ${run.inputHash ?? ""}, ${run.promptHash ?? ""},
          ${run.costCents ?? null}, ${run.createdAt ? new Date(run.createdAt) : new Date()},
          ${run.completedAt ? new Date(run.completedAt) : null}
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          consumed_credits = EXCLUDED.consumed_credits,
          cost_cents = EXCLUDED.cost_cents,
          completed_at = EXCLUDED.completed_at
      `;
    }
  }
}
