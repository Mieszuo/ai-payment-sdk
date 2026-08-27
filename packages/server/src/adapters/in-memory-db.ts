import { PlatformError, PlatformErrorCodes, LedgerTransaction } from "@platform/shared";
import { validateDoubleEntryTransaction } from "@platform/core";

export interface WalletRecord {
  userId: string;
  availableCredits: number;
  reservedCredits: number;
}

export class InMemoryDatabase {
  public wallets = new Map<string, WalletRecord>();
  public transactions = new Map<string, LedgerTransaction>();
  public processedIdempotencyKeys = new Set<string>();
  private mutex = Promise.resolve();

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
