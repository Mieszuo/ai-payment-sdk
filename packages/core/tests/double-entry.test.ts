import { describe, it, expect } from "bun:test";
import { 
  validateDoubleEntryTransaction, 
  createReservationTransaction,
  createSettlementTransaction,
  createReleaseTransaction
} from "../src";

describe("Double-Entry Domain Rules", () => {
  it("enforces balanced entries summing strictly to zero", () => {
    const balancedTx = {
      idempotencyKey: "tx_123",
      transactionType: "RESERVATION_HOLD" as const,
      entries: [
        { accountIdentifier: "USER_WALLET:usr_1", amountCredits: -15 },
        { accountIdentifier: "PLATFORM_CLEARING", amountCredits: 15 }
      ],
      metadata: {}
    };
    expect(() => validateDoubleEntryTransaction(balancedTx)).not.toThrow();

    const unbalancedTx = {
      ...balancedTx,
      entries: [
        { accountIdentifier: "USER_WALLET:usr_1", amountCredits: -15 },
        { accountIdentifier: "PLATFORM_CLEARING", amountCredits: 10 }
      ]
    };
    expect(() => validateDoubleEntryTransaction(unbalancedTx)).toThrow();
  });

  it("creates valid reservation transaction", () => {
    const tx = createReservationTransaction({
      userId: "usr_1",
      amountCredits: 15,
      idempotencyKey: "res_123",
      runId: "run_999"
    });
    expect(tx.transactionType).toBe("RESERVATION_HOLD");
    expect(tx.entries).toHaveLength(2);
    expect(() => validateDoubleEntryTransaction(tx)).not.toThrow();
  });

  it("creates valid settlement transaction without developer share", () => {
    const tx = createSettlementTransaction({
      userId: "usr_1",
      amountCredits: 15,
      idempotencyKey: "set_123",
      runId: "run_999",
      providerCostCents: 5
    });
    expect(tx.transactionType).toBe("SETTLEMENT");
    expect(tx.entries).toHaveLength(2);
    expect(tx.entries[0]).toEqual({
      accountIdentifier: "PLATFORM_CLEARING",
      amountCredits: -15
    });
    expect(tx.entries[1]).toEqual({
      accountIdentifier: "PLATFORM_REVENUE",
      amountCredits: 15
    });
    expect(() => validateDoubleEntryTransaction(tx)).not.toThrow();
  });

  it("creates valid settlement transaction with developer share", () => {
    const tx = createSettlementTransaction({
      userId: "usr_1",
      amountCredits: 20,
      idempotencyKey: "set_456",
      runId: "run_999",
      providerCostCents: 8,
      developerShareCredits: 14
    });
    expect(tx.transactionType).toBe("SETTLEMENT");
    expect(tx.entries).toHaveLength(3);
    expect(tx.entries[0]).toEqual({
      accountIdentifier: "PLATFORM_CLEARING",
      amountCredits: -20
    });
    expect(tx.entries[1]).toEqual({
      accountIdentifier: "PLATFORM_REVENUE",
      amountCredits: 6
    });
    expect(tx.entries[2]).toEqual({
      accountIdentifier: "DEVELOPER_PAYABLE",
      amountCredits: 14
    });
    expect(() => validateDoubleEntryTransaction(tx)).not.toThrow();
  });

  it("creates valid release transaction", () => {
    const tx = createReleaseTransaction({
      userId: "usr_1",
      amountCredits: 15,
      idempotencyKey: "rel_123",
      runId: "run_999"
    });
    expect(tx.transactionType).toBe("RESERVATION_RELEASE");
    expect(tx.entries).toHaveLength(2);
    expect(() => validateDoubleEntryTransaction(tx)).not.toThrow();
  });
});
