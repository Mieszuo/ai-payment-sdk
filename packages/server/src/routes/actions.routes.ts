import { Hono, type Context } from "hono";
import { streamSSE } from "hono/streaming";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { ActionExecutionService } from "../services/action.service";
import { AuthService } from "../services/auth.service";

function mapPlatformErrorToStatus(code: string): number {
  switch (code) {
    case PlatformErrorCodes.UNAUTHORIZED:
      return 401;
    case PlatformErrorCodes.INSUFFICIENT_CREDITS:
      return 402;
    case PlatformErrorCodes.ACTION_NOT_FOUND:
      return 404;
    case PlatformErrorCodes.INVALID_INPUT:
    case PlatformErrorCodes.MARGIN_EXCEEDED:
      return 400;
    case PlatformErrorCodes.RATE_LIMITED:
      return 429;
    case PlatformErrorCodes.UNTRUSTED_OUTPUT:
      return 422;
    case PlatformErrorCodes.PROVIDER_ERROR:
      return 502;
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

export function createActionRoutes(actionService: ActionExecutionService, authService: AuthService) {
  const router = new Hono();

  router.post("/:name/execute", async (c) => {
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

      const body = await c.req.json().catch(() => ({}));
      const actionName = c.req.param("name");

      const executionParams = {
        actionName,
        projectId: body.projectId || session.projectId,
        userId: session.userId,
        inputs: body.inputs || {},
        idempotencyKey: c.req.header("Idempotency-Key") || body.idempotencyKey
      };

      const acceptHeader = c.req.header("Accept");
      if (acceptHeader && acceptHeader.includes("text/event-stream")) {
        return streamSSE(c, async (stream) => {
          try {
            const result = await actionService.execute(executionParams);
            await stream.writeSSE({
              event: "result",
              data: JSON.stringify(result)
            });
          } catch (err: any) {
            await stream.writeSSE({
              event: "error",
              data: JSON.stringify({
                error: err.message || "Execution failed",
                code: err instanceof PlatformError ? err.code : "INTERNAL_ERROR",
                details: err.details
              })
            });
          }
        });
      }

      const result = await actionService.execute(executionParams);
      return c.json(result);
    } catch (err) {
      return handleRouteError(err, c);
    }
  });

  router.onError((err, c) => handleRouteError(err, c));

  return router;
}
