import { Hono, type Context } from "hono";
import { ZodError } from "zod";
import {
  TokenExchangeRequestSchema,
  PKCEChallengeRequestSchema,
  PlatformError,
  PlatformErrorCodes
} from "@platform/shared";
import { AuthService } from "../services/auth.service";
import { correlationMiddleware, getCorrelationContext } from "../observability/correlation";
import type { RateLimiter } from "../services/action.service";

function mapPlatformErrorToStatus(code: string): number {
  switch (code) {
    case PlatformErrorCodes.UNAUTHORIZED:
      return 401;
    case PlatformErrorCodes.INVALID_INPUT:
      return 400;
    case PlatformErrorCodes.INSUFFICIENT_CREDITS:
      return 402;
    case PlatformErrorCodes.ACTION_NOT_FOUND:
      return 404;
    case PlatformErrorCodes.RATE_LIMITED:
      return 429;
    default:
      return 400;
  }
}

function handleRouteError(err: unknown, c: Context) {
  if (err instanceof ZodError) {
    return c.json({ error: "Validation error", details: err.errors }, 400);
  }
  if (err instanceof PlatformError) {
    const status = mapPlatformErrorToStatus(err.code) as any;
    return c.json({ error: err.message, code: err.code, details: err.details }, status);
  }
  return c.json({ error: (err as any)?.message || "Internal server error" }, 500);
}

export function createAuthRoutes(authService: AuthService, rateLimiter?: RateLimiter) {
  const router = new Hono();
  router.use("*", correlationMiddleware());

  router.post("/authorize", async (c) => {
    try {
      const body = await c.req.json();
      const parsed = PKCEChallengeRequestSchema.parse(body);
      const correlation = getCorrelationContext(c);
      correlation.projectId = parsed.projectId;

      const redirectParam = parsed.redirectUri ? `&redirect_uri=${encodeURIComponent(parsed.redirectUri)}` : "";
      const authUrl = `/oauth/authorize?project_id=${encodeURIComponent(parsed.projectId)}&code_challenge=${encodeURIComponent(parsed.codeChallenge)}${redirectParam}`;
      return c.json({
        authUrl,
        codeChallenge: parsed.codeChallenge
      });
    } catch (err) {
      return handleRouteError(err, c);
    }
  });

  router.post("/otp/request", async (c) => {
    try {
      // Per-IP throttle (final review I5b): 5 OTP requests per IP per 5 minutes,
      // layered on top of the per-email 10-minute window in AuthService.
      // This is optional — routes built without a rate limiter (tests, minimal
      // setups) keep working unchanged.
      if (rateLimiter) {
        const ip =
          c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
          c.req.header("x-real-ip") ||
          "unknown";
        if (!(await rateLimiter.checkLimit(`otp_ip_${ip}`, 5, 300))) {
          throw new PlatformError(PlatformErrorCodes.RATE_LIMITED, "Too many OTP requests");
        }
      }
      const body = await c.req.json();
      const result = await authService.requestOtp({
        email: String(body.email),
        projectId: String(body.projectId)
      });
      return c.json(result);
    } catch (err) {
      return handleRouteError(err, c);
    }
  });

  router.post("/otp/verify", async (c) => {
    try {
      const body = await c.req.json();
      // PKCE floor for the OTP path: the codeChallenge must satisfy the same
      // min(32) constraint as the authorize flow (PKCEChallengeRequestSchema).
      // A short challenge fails here with a 400 via handleRouteError.
      const parsedChallenge = PKCEChallengeRequestSchema.parse({
        projectId: body.projectId,
        codeChallenge: body.codeChallenge
      });
      const result = await authService.verifyOtp({
        email: String(body.email),
        projectId: String(body.projectId),
        code: String(body.code),
        codeChallenge: parsedChallenge.codeChallenge
      });
      return c.json(result);
    } catch (err) {
      return handleRouteError(err, c);
    }
  });

  router.post("/token", async (c) => {
    try {
      const body = await c.req.json();
      const parsed = TokenExchangeRequestSchema.parse(body);
      const correlation = getCorrelationContext(c);
      correlation.projectId = parsed.projectId;

      const result = await authService.exchangeCodeForSession(parsed);
      return c.json(result);
    } catch (err) {
      return handleRouteError(err, c);
    }
  });

  router.onError((err, c) => handleRouteError(err, c));

  return router;
}
