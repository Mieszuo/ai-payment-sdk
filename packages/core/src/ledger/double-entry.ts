import { LedgerTransaction, PlatformError, PlatformErrorCodes } from "@ai-credits/shared";

export function validateDoubleEntryTransaction(tx: LedgerTransaction): void {
  const sum = tx.entries.reduce((acc, curr) => acc + curr.amountCredits, 0);
  if (sum !== 0) {
    throw new PlatformError(
      PlatformErrorCodes.PROVIDER_ERROR,
      `Double-entry imbalance: transaction sum is ${sum}, must be 0`,
      { tx }
    );
  }
}
