import { InMemoryDatabase, WalletRecord } from "./in-memory-db";
import { PlatformError, PlatformErrorCodes, LedgerTransaction } from "@platform/shared";
import { validateDoubleEntryTransaction } from "@platform/core";

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface PostgresDatabase {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  lockWalletRow(userId: string): Promise<() => void>;
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}

export class PostgresSimulatorDatabase extends InMemoryDatabase implements PostgresDatabase {
  // Simulates PostgreSQL SQL transaction semantics with explicit table/row lock queues
  private rowLocks = new Map<string, Promise<void>>();

  async lockWalletRow(userId: string): Promise<() => void> {
    while (this.rowLocks.has(userId)) {
      await this.rowLocks.get(userId);
    }
    let release: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.rowLocks.set(userId, lockPromise);

    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (this.rowLocks.get(userId) === lockPromise) {
        this.rowLocks.delete(userId);
      }
      release();
    };
  }

  override async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return super.runInTransaction(fn);
  }

  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const trimmed = sql.trim();

    // Simulate SELECT ... FROM wallets WHERE user_id = $1 (with optional FOR UPDATE)
    if (/SELECT\s+.*FROM\s+wallets\s+WHERE\s+user_id\s*=\s*\$1/i.test(trimmed)) {
      const userId = params?.[0];
      if (!userId) {
        return { rows: [], rowCount: 0 };
      }
      const wallet = this.wallets.get(userId);
      if (!wallet) {
        return { rows: [], rowCount: 0 };
      }
      return {
        rows: [{
          user_id: wallet.userId,
          available_credits: wallet.availableCredits,
          reserved_credits: wallet.reservedCredits
        } as unknown as T],
        rowCount: 1
      };
    }

    // Simulate INSERT INTO ledger_transactions
    if (/INSERT\s+INTO\s+ledger_transactions/i.test(trimmed)) {
      const idempotencyKey = params?.[1];
      if (idempotencyKey && this.processedIdempotencyKeys.has(idempotencyKey)) {
        throw new PlatformError(
          PlatformErrorCodes.PROVIDER_ERROR,
          `duplicate key value violates unique constraint "ledger_transactions_idempotency_key_key"`
        );
      }
      if (idempotencyKey) {
        this.processedIdempotencyKeys.add(idempotencyKey);
      }
      return { rows: [], rowCount: 1 };
    }

    // Simulate UPDATE wallets
    if (/UPDATE\s+wallets/i.test(trimmed)) {
      const availableCredits = params?.[0];
      const reservedCredits = params?.[1];
      const userId = params?.[2];
      if (userId && this.wallets.has(userId)) {
        const wallet = this.wallets.get(userId)!;
        if (availableCredits !== undefined) wallet.availableCredits = availableCredits;
        if (reservedCredits !== undefined) wallet.reservedCredits = reservedCredits;
        return { rows: [wallet as unknown as T], rowCount: 1 };
      }
    }

    return { rows: [], rowCount: 0 };
  }
}
