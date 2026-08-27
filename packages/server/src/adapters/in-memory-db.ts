import { PlatformError, PlatformErrorCodes, LedgerTransaction, formatAccountIdentifier } from "@platform/shared";
import {
  validateDoubleEntryTransaction,
  createReservationTransaction,
  createSettlementTransaction,
  createReleaseTransaction
} from "@platform/core";
import { LedgerDatabase, ReservationRecord, WalletRecord } from "./database";

export type { LedgerDatabase, ReservationRecord, WalletRecord } from "./database";

/**
 * Demo in-memory database. Holds the authoritative state in process-local maps
 * and serializes every unit of work with a promise-chain mutex so the financial
 * operations behave like single transactions (no interleaving).
 */
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

  async getWallet(userId: string): Promise<WalletRecord> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
    }
    return { ...wallet };
  }

  async reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    if (amount <= 0) {
      throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "Reservation amount must be greater than zero");
    }

    await this.runInTransaction(async () => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        return; // Idempotent no-op
      }

      const wallet = this.wallets.get(userId);
      if (!wallet || wallet.availableCredits < amount) {
        throw new PlatformError(
          PlatformErrorCodes.INSUFFICIENT_CREDITS,
          `Insufficient credits: available ${wallet?.availableCredits ?? 0}, required ${amount}`
        );
      }

      const tx = createReservationTransaction({ userId, amountCredits: amount, idempotencyKey, runId });
      await this.executeLedgerTransaction(tx);

      wallet.availableCredits -= amount;
      wallet.reservedCredits += amount;
      this.reservations.set(runId, { userId, amount });
    });
  }

  async settleReservation(
    userId: string,
    amount: number,
    idempotencyKey: string,
    runId: string,
    providerCostCents: number
  ): Promise<void> {
    await this.runInTransaction(async () => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        return; // Idempotent no-op on retry
      }

      const wallet = this.wallets.get(userId);
      if (!wallet || wallet.reservedCredits < amount) {
        throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, "Invalid reservation settlement state");
      }

      const tx = createSettlementTransaction({
        userId,
        amountCredits: amount,
        idempotencyKey,
        runId,
        providerCostCents
      });
      await this.executeLedgerTransaction(tx);

      wallet.reservedCredits -= amount;
      this.reservations.delete(runId);
    });
  }

  async releaseReservation(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    await this.runInTransaction(async () => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        return; // Idempotent no-op on retry
      }

      const wallet = this.wallets.get(userId);
      if (!wallet || wallet.reservedCredits < amount) {
        return; // Nothing to release
      }

      const tx = createReleaseTransaction({
        userId,
        amountCredits: amount,
        idempotencyKey,
        runId
      });
      await this.executeLedgerTransaction(tx);

      wallet.reservedCredits -= amount;
      wallet.availableCredits += amount;
      this.reservations.delete(runId);
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
    await this.runInTransaction(async () => {
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
      const tx: LedgerTransaction = {
        idempotencyKey,
        transactionType,
        referenceId,
        // REFUND entries are recorded wallet-first to mirror the historical
        // direction of the refund double-entry pair; TOPUP/BONUS are clearing-first.
        entries: transactionType === "REFUND" ? [walletEntry, clearingEntry] : [clearingEntry, walletEntry],
        metadata
      };
      await this.executeLedgerTransaction(tx);
      const wallet = this.wallets.get(userId);
      if (wallet) wallet.availableCredits += delta;
      else this.seedWallet(userId, amount);
    });
  }
}
