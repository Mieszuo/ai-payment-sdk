import { Context, MiddlewareHandler } from "hono";

export interface CorrelationContext {
  requestId: string;
  projectId?: string;
  userId?: string;
  actionName?: string;
  runId?: string;
}

export function correlationMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const existing = c.get("correlation") as CorrelationContext | undefined;
    const incomingId = c.req.header("x-request-id");
    const requestId = existing?.requestId || incomingId || `req_${crypto.randomUUID()}`;

    const context: CorrelationContext = existing || { requestId };
    c.set("correlation", context);

    try {
      await next();
    } finally {
      c.header("x-request-id", requestId);
    }
  };
}

export function getCorrelationContext(c: Context): CorrelationContext {
  const existing = c.get("correlation") as CorrelationContext | undefined;
  if (existing) {
    return existing;
  }
  const fallback: CorrelationContext = { requestId: `req_${crypto.randomUUID()}` };
  c.set("correlation", fallback);
  return fallback;
}
