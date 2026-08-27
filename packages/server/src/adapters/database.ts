import { ActionVersion, LedgerTransaction } from "@ai-credits/shared";
import type { ProjectRecord } from "../services/developer.service";

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

  /** Serialize a unit of work; the Postgres adapter executes it as a single SQL transaction. */
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;

  executeLedgerTransaction(tx: LedgerTransaction): Promise<void>;

  /** Row-level lock; no-op while the process-local mutex is the only writer. */
  lockWalletRow(userId: string): Promise<() => void>;

  getWallet(userId: string): Promise<WalletRecord>;
  reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>;
  settleReservation(userId: string, amount: number, idempotencyKey: string, runId: string, providerCostCents: number): Promise<void>;
  releaseReservation(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>;
  applyCredit(
    userId: string,
    amount: number,
    transactionType: "TOPUP" | "BONUS" | "REFUND",
    idempotencyKey: string,
    referenceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Persist (or update) an action run audit record. The in-memory database is a
   * no-op (its actionRuns map already holds the record); the Postgres adapter
   * upserts into `action_runs`.
   */
  upsertActionRun(record: Record<string, any>): Promise<void>;

  /**
   * Developer registry persistence (Task 6). The in-memory database keeps the
   * registry per-instance (demo mode) — load returns empty state and upserts are
   * no-ops; the Postgres adapter reads/writes `developer_projects` and
   * `developer_action_versions` so published actions survive gateway restarts.
   */
  loadDeveloperState(): Promise<{ projects: ProjectRecord[]; versions: ActionVersion[] }>;
  upsertDeveloperProject(project: ProjectRecord): Promise<void>;
  upsertActionVersion(version: ActionVersion): Promise<void>;
}
