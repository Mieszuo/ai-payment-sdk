import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { LedgerService } from "../src/services/ledger.service";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

describe("LedgerService Concurrency & Reservation", () => {
  let db: InMemoryDatabase;
  let ledger: LedgerService;

  beforeEach(() => {
    db = new InMemoryDatabase();
    ledger = new LedgerService(db);
    db.seedWallet("usr_1", 20); // User has 20 credits
  });

  it("successfully reserves credits within available balance", async () => {
    await ledger.reserveCredits("usr_1", 15, "key_1", "run_1");
    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(5);
    expect(wallet.reservedCredits).toBe(15);
  });

  it("blocks concurrent reservation if balance is exceeded", async () => {
    // Attempt two reservations of 15 credits each simultaneously
    const req1 = ledger.reserveCredits("usr_1", 15, "key_1", "run_1");
    const req2 = ledger.reserveCredits("usr_1", 15, "key_2", "run_2");

    const results = await Promise.allSettled([req1, req2]);
    const succeeded = results.filter(r => r.status === "fulfilled");
    const failed = results.filter(r => r.status === "rejected");

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
  });

  it("throws INSUFFICIENT_CREDITS when reserving more credits than available", async () => {
    try {
      await ledger.reserveCredits("usr_1", 25, "key_fail", "run_fail");
      expect(true).toBe(false); // should not reach here
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.INSUFFICIENT_CREDITS);
    }
  });

  it("throws UNAUTHORIZED when wallet does not exist", async () => {
    try {
      await ledger.getWallet("usr_nonexistent");
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.UNAUTHORIZED);
    }
  });

  it("settles reservation and clears reserved balance", async () => {
    await ledger.reserveCredits("usr_1", 10, "res_key", "run_settle");
    let wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(10);

    await ledger.settleReservation("usr_1", 10, "set_key", "run_settle", 2);
    wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(0);

    // Verify transaction recorded
    const tx = db.transactions.get("set_key");
    expect(tx).toBeDefined();
    expect(tx?.transactionType).toBe("SETTLEMENT");
  });

  it("releases reservation returning credits to available balance", async () => {
    await ledger.reserveCredits("usr_1", 10, "res_key", "run_release");
    let wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(10);

    await ledger.releaseReservation("usr_1", 10, "rel_key", "run_release");
    wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(20);
    expect(wallet.reservedCredits).toBe(0);

    // Verify transaction recorded
    const tx = db.transactions.get("rel_key");
    expect(tx).toBeDefined();
    expect(tx?.transactionType).toBe("RESERVATION_RELEASE");
  });

  it("handles idempotency: repeated calls with the same idempotency key do not double modify balance", async () => {
    await ledger.reserveCredits("usr_1", 10, "res_dup", "run_dup");
    await ledger.reserveCredits("usr_1", 10, "res_dup", "run_dup");

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(10);

    await ledger.settleReservation("usr_1", 10, "set_dup", "run_dup", 2);
    await ledger.settleReservation("usr_1", 10, "set_dup", "run_dup", 2);

    const walletAfterSettle = await ledger.getWallet("usr_1");
    expect(walletAfterSettle.availableCredits).toBe(10);
    expect(walletAfterSettle.reservedCredits).toBe(0);
  });

  it("supports shorthand settleReservation(runId, costCents)", async () => {
    await ledger.reserveCredits("usr_1", 8, "res_short_s", "run_short_s");
    await ledger.settleReservation("run_short_s", 3);
    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(12);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("supports shorthand releaseReservation(runId)", async () => {
    await ledger.reserveCredits("usr_1", 8, "res_short_r", "run_short_r");
    await ledger.releaseReservation("run_short_r");
    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(20);
    expect(wallet.reservedCredits).toBe(0);
  });
});
