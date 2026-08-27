import { formatAccountIdentifier, LedgerTransaction } from "@platform/shared";

export function createReservationTransaction(params: {
  userId: string;
  amountCredits: number;
  idempotencyKey: string;
  runId: string;
}): LedgerTransaction {
  return {
    idempotencyKey: params.idempotencyKey,
    transactionType: "RESERVATION_HOLD",
    referenceId: params.runId,
    entries: [
      {
        accountIdentifier: formatAccountIdentifier("USER_WALLET", params.userId),
        amountCredits: -params.amountCredits
      },
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: params.amountCredits
      }
    ],
    metadata: { runId: params.runId, reservedCredits: params.amountCredits }
  };
}

export function createSettlementTransaction(params: {
  userId: string;
  amountCredits: number;
  idempotencyKey: string;
  runId: string;
  providerCostCents: number;
  developerShareCredits?: number;
}): LedgerTransaction {
  const devShare = params.developerShareCredits || 0;
  const platformRevenue = params.amountCredits - devShare;

  return {
    idempotencyKey: params.idempotencyKey,
    transactionType: "SETTLEMENT",
    referenceId: params.runId,
    entries: [
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: -params.amountCredits
      },
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_REVENUE"),
        amountCredits: platformRevenue
      },
      ...(devShare > 0 ? [{
        accountIdentifier: formatAccountIdentifier("DEVELOPER_PAYABLE"),
        amountCredits: devShare
      }] : [])
    ],
    metadata: {
      runId: params.runId,
      providerCostCents: params.providerCostCents
    }
  };
}

export function createReleaseTransaction(params: {
  userId: string;
  amountCredits: number;
  idempotencyKey: string;
  runId: string;
}): LedgerTransaction {
  return {
    idempotencyKey: params.idempotencyKey,
    transactionType: "RESERVATION_RELEASE",
    referenceId: params.runId,
    entries: [
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: -params.amountCredits
      },
      {
        accountIdentifier: formatAccountIdentifier("USER_WALLET", params.userId),
        amountCredits: params.amountCredits
      }
    ],
    metadata: { runId: params.runId }
  };
}
