import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { LedgerDatabase } from "../adapters/database";

/**
 * Facade over `LedgerDatabase`. All financial operations now live in the
 * adapters (SQL transactions with row locks on Postgres, mutex-serialized
 * transactions in memory); this service keeps the historical public API —
 * including the `settleReservation(runId, costCents)` /
 * `releaseReservation(runId)` short forms used by routes and services — and
 * delegates.
 */
export class LedgerService {
  constructor(private db: LedgerDatabase) {}

  async getWallet(userId: string): Promise<{ userId: string; availableCredits: number; reservedCredits: number }> {
    return this.db.getWallet(userId);
  }

  async reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    return this.db.reserveCredits(userId, amount, idempotencyKey, runId);
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
    if (idempotencyKey === undefined || runId === undefined || costCents === undefined) {
      const resolvedRunId = userIdOrRunId;
      const resolvedCostCents = amountOrCostCents;
      const resolvedIdempotencyKey = `set_${resolvedRunId}`;
      if (this.db.processedIdempotencyKeys.has(resolvedIdempotencyKey)) {
        return; // Idempotent no-op on retry
      }
      const reservation = this.db.reservations.get(resolvedRunId);
      if (!reservation) {
        throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, `Reservation not found for runId: ${resolvedRunId}`);
      }
      return this.db.settleReservation(
        reservation.userId,
        reservation.amount,
        resolvedIdempotencyKey,
        resolvedRunId,
        resolvedCostCents
      );
    }
    return this.db.settleReservation(userIdOrRunId, amountOrCostCents, idempotencyKey, runId, costCents);
  }

  async releaseReservation(runId: string): Promise<void>;
  async releaseReservation(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>;
  async releaseReservation(
    userIdOrRunId: string,
    amount?: number,
    idempotencyKey?: string,
    runId?: string
  ): Promise<void> {
    if (amount === undefined || idempotencyKey === undefined || runId === undefined) {
      const resolvedRunId = userIdOrRunId;
      const resolvedIdempotencyKey = `rel_${resolvedRunId}`;
      if (this.db.processedIdempotencyKeys.has(resolvedIdempotencyKey)) {
        return; // Idempotent no-op on retry
      }
      const reservation = this.db.reservations.get(resolvedRunId);
      if (!reservation) {
        return; // Nothing to release
      }
      return this.db.releaseReservation(reservation.userId, reservation.amount, resolvedIdempotencyKey, resolvedRunId);
    }
    return this.db.releaseReservation(userIdOrRunId, amount, idempotencyKey, runId);
  }
}
