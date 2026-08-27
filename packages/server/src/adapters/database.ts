import { LedgerTransaction } from "@platform/shared";

/**
 * The storage surface every service depends on. Both the in-memory demo
 * database and the production Postgres adapter implement this interface, so
 * services never know where their state actually lives.
 */
export interface WalletRecord {
  userId: string;
  availableCredits: number;
  reservedCredits: number;
}

export interface ReservationRecord {
  userId: string;
  amount: number;
}

export interface LedgerDatabase {
  wallets: Map<string, WalletRecord>;
  transactions: Map<string, LedgerTransaction>;
  reservations: Map<string, ReservationRecord>;
  processedIdempotencyKeys: Set<string>;
  actionRuns: Map<string, any>;

  /** Load persisted state (no-op for the in-memory database). */
  init(): Promise<void>;

  seedWallet(userId: string, credits: number): void;

  /** Serialize a unit of work; Postgres adapter commits a snapshot afterwards. */
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;

  executeLedgerTransaction(tx: LedgerTransaction): Promise<void>;

  /** Row-level lock; no-op while the process-local mutex is the only writer. */
  lockWalletRow(userId: string): Promise<() => void>;
}
