import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { 
  createReservationTransaction, 
  createSettlementTransaction, 
  createReleaseTransaction 
} from "@platform/core";
import { InMemoryDatabase } from "../adapters/in-memory-db";

interface ReservationRecord {
  userId: string;
  amount: number;
}

export class LedgerService {
  private reservations = new Map<string, ReservationRecord>();

  constructor(private db: InMemoryDatabase) {}

  async getWallet(userId: string): Promise<{ userId: string; availableCredits: number; reservedCredits: number }> {
    const wallet = this.db.wallets.get(userId);
    if (!wallet) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
    }
    return { ...wallet };
  }

  async reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    return this.db.runInTransaction(async () => {
      if (this.db.processedIdempotencyKeys.has(idempotencyKey)) {
        return; // Idempotent no-op
      }

      const wallet = this.db.wallets.get(userId);
      if (!wallet || wallet.availableCredits < amount) {
        throw new PlatformError(
          PlatformErrorCodes.INSUFFICIENT_CREDITS,
          `Insufficient credits: available ${wallet?.availableCredits ?? 0}, required ${amount}`
        );
      }

      const tx = createReservationTransaction({ userId, amountCredits: amount, idempotencyKey, runId });
      await this.db.executeLedgerTransaction(tx);

      wallet.availableCredits -= amount;
      wallet.reservedCredits += amount;
      this.reservations.set(runId, { userId, amount });
    });
  }

  async settleReservation(runId: string, costCents: number): Promise<void>;
  async settleReservation(userId: string, amount: number, idempotencyKey: string, runId: string, costCents: number): Promise<void>;
  async settleReservation(
    userIdOrRunId: string,
    amountOrCostCents: number,
    idempotencyKey?: string,
    runId?: string,
    costCents?: number
  ): Promise<void> {
    let resolvedUserId: string;
    let resolvedAmount: number;
    let resolvedIdempotencyKey: string;
    let resolvedRunId: string;
    let resolvedCostCents: number;

    if (idempotencyKey === undefined || runId === undefined || costCents === undefined) {
      resolvedRunId = userIdOrRunId;
      resolvedCostCents = amountOrCostCents;
      const reservation = this.reservations.get(resolvedRunId);
      if (!reservation) {
        throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, `Reservation not found for runId: ${resolvedRunId}`);
      }
      resolvedUserId = reservation.userId;
      resolvedAmount = reservation.amount;
      resolvedIdempotencyKey = `set_${resolvedRunId}`;
    } else {
      resolvedUserId = userIdOrRunId;
      resolvedAmount = amountOrCostCents;
      resolvedIdempotencyKey = idempotencyKey;
      resolvedRunId = runId;
      resolvedCostCents = costCents;
    }

    return this.db.runInTransaction(async () => {
      if (this.db.processedIdempotencyKeys.has(resolvedIdempotencyKey)) {
        return; // Idempotent no-op
      }

      const wallet = this.db.wallets.get(resolvedUserId);
      if (!wallet || wallet.reservedCredits < resolvedAmount) {
        throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, "Invalid reservation settlement state");
      }

      const tx = createSettlementTransaction({
        userId: resolvedUserId,
        amountCredits: resolvedAmount,
        idempotencyKey: resolvedIdempotencyKey,
        runId: resolvedRunId,
        providerCostCents: resolvedCostCents
      });
      await this.db.executeLedgerTransaction(tx);

      wallet.reservedCredits -= resolvedAmount;
      this.reservations.delete(resolvedRunId);
    });
  }

  async releaseReservation(runId: string): Promise<void>;
  async releaseReservation(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>;
  async releaseReservation(
    userIdOrRunId: string,
    amount?: number,
    idempotencyKey?: string,
    runId?: string
  ): Promise<void> {
    let resolvedUserId: string;
    let resolvedAmount: number;
    let resolvedIdempotencyKey: string;
    let resolvedRunId: string;

    if (amount === undefined || idempotencyKey === undefined || runId === undefined) {
      resolvedRunId = userIdOrRunId;
      const reservation = this.reservations.get(resolvedRunId);
      if (!reservation) {
        return; // Nothing to release
      }
      resolvedUserId = reservation.userId;
      resolvedAmount = reservation.amount;
      resolvedIdempotencyKey = `rel_${resolvedRunId}`;
    } else {
      resolvedUserId = userIdOrRunId;
      resolvedAmount = amount;
      resolvedIdempotencyKey = idempotencyKey;
      resolvedRunId = runId;
    }

    return this.db.runInTransaction(async () => {
      if (this.db.processedIdempotencyKeys.has(resolvedIdempotencyKey)) {
        return; // Idempotent no-op
      }

      const wallet = this.db.wallets.get(resolvedUserId);
      if (!wallet || wallet.reservedCredits < resolvedAmount) {
        return;
      }

      const tx = createReleaseTransaction({
        userId: resolvedUserId,
        amountCredits: resolvedAmount,
        idempotencyKey: resolvedIdempotencyKey,
        runId: resolvedRunId
      });
      await this.db.executeLedgerTransaction(tx);

      wallet.reservedCredits -= resolvedAmount;
      wallet.availableCredits += resolvedAmount;
      this.reservations.delete(resolvedRunId);
    });
  }
}
