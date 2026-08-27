import { Hono, type Context } from "hono";
import { PlatformError, PlatformErrorCodes } from "@ai-credits/shared";
import { LedgerService } from "../services/ledger.service";
import { AuthService } from "../services/auth.service";
import { correlationMiddleware, getCorrelationContext } from "../observability/correlation";

function mapPlatformErrorToStatus(code: string): number {
  switch (code) {
    case PlatformErrorCodes.UNAUTHORIZED:
      return 401;
    case PlatformErrorCodes.INSUFFICIENT_CREDITS:
      return 402;
    case PlatformErrorCodes.ACTION_NOT_FOUND:
      return 404;
    case PlatformErrorCodes.INVALID_INPUT:
      return 400;
    case PlatformErrorCodes.RATE_LIMITED:
      return 429;
    default:
      return 500;
  }
}

function handleRouteError(err: unknown, c: Context) {
  if (err instanceof PlatformError) {
    const status = mapPlatformErrorToStatus(err.code) as any;
    return c.json({ error: err.message, code: err.code, details: err.details }, status);
  }
  return c.json({ error: (err as any)?.message || "Internal server error" }, 500);
}

export function createWalletRoutes(ledgerService: LedgerService, authService: AuthService) {
  const router = new Hono();
  router.use("*", correlationMiddleware());

  router.get("/", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new PlatformError(
          PlatformErrorCodes.UNAUTHORIZED,
          "Missing or invalid authorization header"
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const session = await authService.verifySessionToken(token);

      const correlation = getCorrelationContext(c);
      correlation.userId = session.userId;
      correlation.projectId = session.projectId;

      const wallet = await ledgerService.getWallet(session.userId);

      return c.json({
        availableCredits: wallet.availableCredits,
        reservedCredits: wallet.reservedCredits
      });
    } catch (err) {
      return handleRouteError(err, c);
    }
  });

  return router;
}
