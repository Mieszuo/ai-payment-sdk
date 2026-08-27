import { Hono } from "hono";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { StripeBillingService } from "../services/stripe.service";
import { AuthService } from "../services/auth.service";
import { correlationMiddleware, getCorrelationContext } from "../observability/correlation";

export function createCheckoutRoutes(billingService: StripeBillingService, authService: AuthService) {
  const router = new Hono();
  router.use("*", correlationMiddleware());

  router.post("/", async (c) => {
    try {
      const auth = c.req.header("Authorization");
      if (!auth?.startsWith("Bearer ")) {
        throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Missing session token");
      }
      const session = await authService.verifySessionToken(auth.replace("Bearer ", ""));

      const body = await c.req.json().catch(() => null);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "Malformed or missing JSON request body");
      }
      const { packId, successUrl, cancelUrl } = body as { packId?: string; successUrl?: string; cancelUrl?: string };
      if (!packId || !successUrl || !cancelUrl) {
        throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "packId, successUrl and cancelUrl are required");
      }

      const correlation = getCorrelationContext(c);
      correlation.userId = session.userId;

      const result = await billingService.createCheckoutSession({
        packId,
        userId: session.userId,
        successUrl,
        cancelUrl
      });
      return c.json(result);
    } catch (err: any) {
      const status = err instanceof PlatformError
        ? err.code === PlatformErrorCodes.UNAUTHORIZED ? 401 : 400
        : 500;
      return c.json({ error: err.message || "Checkout failed" }, status);
    }
  });

  return router;
}
