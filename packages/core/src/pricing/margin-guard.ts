import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export function verifyMarginGuard(params: {
  priceCredits: number;
  maxProviderCostCents: number;
  estimatedCostCents: number;
}): void {
  if (params.estimatedCostCents > params.maxProviderCostCents) {
    throw new PlatformError(
      PlatformErrorCodes.MARGIN_EXCEEDED,
      `Estimated provider cost (${params.estimatedCostCents}¢) exceeds max allowed (${params.maxProviderCostCents}¢)`
    );
  }
}
