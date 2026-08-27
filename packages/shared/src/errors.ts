export const PlatformErrorCodes = {
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  UNTRUSTED_OUTPUT: "UNTRUSTED_OUTPUT",
  RATE_LIMITED: "RATE_LIMITED",
  ACTION_NOT_FOUND: "ACTION_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  UNAUTHORIZED: "UNAUTHORIZED",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  MARGIN_EXCEEDED: "MARGIN_EXCEEDED"
} as const;

export type PlatformErrorCode = keyof typeof PlatformErrorCodes;

export class PlatformError extends Error {
  constructor(
    public readonly code: PlatformErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "PlatformError";
  }
}
