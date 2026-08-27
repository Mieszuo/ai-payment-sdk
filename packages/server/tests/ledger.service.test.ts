import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { LedgerService } from "../src/services/ledger.service";
import { PlatformError, PlatformErrorCodes } from "@ai-credits/shared";

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

  it("rejects non-positive reservation amounts with INVALID_INPUT", async () => {
    // Zero credits
    try {
      await ledger.reserveCredits("usr_1", 0, "res_zero", "run_zero");
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.INVALID_INPUT);
    }

    // Negative credits
    try {
      await ledger.reserveCredits("usr_1", -10, "res_neg", "run_neg");
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.INVALID_INPUT);
    }
  });

  it("handles idempotency on repeated shorthand settleReservation(runId, costCents) calls", async () => {
    await ledger.reserveCredits("usr_1", 8, "res_idem_s", "run_idem_s");
    await ledger.settleReservation("run_idem_s", 3);

    // Repeated call must NOT throw Reservation not found, must be idempotent no-op
    await expect(ledger.settleReservation("run_idem_s", 3)).resolves.toBeUndefined();

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(12);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("handles idempotency on repeated shorthand releaseReservation(runId) calls", async () => {
    await ledger.reserveCredits("usr_1", 8, "res_idem_r", "run_idem_r");
    await ledger.releaseReservation("run_idem_r");

    // Repeated call must be idempotent no-op without double-crediting
    await expect(ledger.releaseReservation("run_idem_r")).resolves.toBeUndefined();

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(20);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("shares reservations across multiple LedgerService instances on the same database", async () => {
    const ledger2 = new LedgerService(db);
    await ledger.reserveCredits("usr_1", 6, "res_inst", "run_inst");

    // ledger2 can settle the reservation made by ledger
    await ledger2.settleReservation("run_inst", 2);
    const wallet = await ledger2.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(14);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("rejects REFUND when the user has no wallet (PROVIDER_ERROR)", async () => {
    try {
      await db.applyCredit("usr_no_wallet_refund", 100, "REFUND", "ref_missing_key", "ch_missing");
      expect(true).toBe(false); // should not reach here
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.PROVIDER_ERROR);
      expect(err.message).toBe("Cannot refund: wallet not found");
    }
  });

  it("rejects REFUND that would drive available credits below zero (INVALID_INPUT)", async () => {
    db.seedWallet("usr_over_refund", 50);
    try {
      await db.applyCredit("usr_over_refund", 100, "REFUND", "ref_over_key", "ch_over");
      expect(true).toBe(false); // should not reach here
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.INVALID_INPUT);
      expect(err.message).toBe("Cannot refund: insufficient balance");
    }
  });

  it("accepts REFUND up to the available balance and no-ops on replay", async () => {
    db.seedWallet("usr_exact_refund", 50);
    await db.applyCredit("usr_exact_refund", 50, "REFUND", "ref_exact_key", "ch_exact");
    expect(db.wallets.get("usr_exact_refund")?.availableCredits).toBe(0);

    // Replay with the same idempotency key must not re-debit.
    await db.applyCredit("usr_exact_refund", 50, "REFUND", "ref_exact_key", "ch_exact");
    expect(db.wallets.get("usr_exact_refund")?.availableCredits).toBe(0);
  });

  it("does not record a ledger transaction or create a wallet for a rejected REFUND", async () => {
    try {
      await db.applyCredit("usr_missing_refund_ledger", 10, "REFUND", "ref_missing_ledger", "ch_missing");
    } catch {
      // expected: PROVIDER_ERROR
    }
    expect(db.transactions.get("ref_missing_ledger")).toBeUndefined();
    expect(db.wallets.get("usr_missing_refund_ledger")).toBeUndefined();
  });
});
