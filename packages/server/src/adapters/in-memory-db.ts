import { PlatformError, PlatformErrorCodes, LedgerTransaction } from "@platform/shared";
import { validateDoubleEntryTransaction } from "@platform/core";
import { LedgerDatabase, ReservationRecord, WalletRecord } from "./database";

export type { LedgerDatabase, ReservationRecord, WalletRecord } from "./database";

export class InMemoryDatabase implements LedgerDatabase {
  public wallets = new Map<string, WalletRecord>();
  public transactions = new Map<string, LedgerTransaction>();
  public reservations = new Map<string, ReservationRecord>();
  public processedIdempotencyKeys = new Set<string>();
  public actionRuns = new Map<string, any>();
  private mutex = Promise.resolve();

  async init(): Promise<void> {
    // Nothing to hydrate — state lives in memory by design.
  }

  async lockWalletRow(_userId: string): Promise<() => void> {
    // runInTransaction's mutex already serializes access in this process.
    return () => {};
  }

  seedWallet(userId: string, credits: number) {
    this.wallets.set(userId, {
      userId,
      availableCredits: credits,
      reservedCredits: 0
    });
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
      return await fn();
    } finally {
      release!();
    }
  }

  async executeLedgerTransaction(tx: LedgerTransaction): Promise<void> {
    if (this.processedIdempotencyKeys.has(tx.idempotencyKey)) {
      return; // Idempotent no-op
    }
    validateDoubleEntryTransaction(tx);
    this.transactions.set(tx.idempotencyKey, tx);
    this.processedIdempotencyKeys.add(tx.idempotencyKey);
  }
}
