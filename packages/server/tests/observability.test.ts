import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { correlationMiddleware, getCorrelationContext } from "../src/observability/correlation";
import { PlatformLogger } from "../src/observability/logger";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { LedgerService } from "../src/services/ledger.service";
import { AuthService } from "../src/services/auth.service";
import { MockModelProvider } from "../src/adapters/model-provider";
import { ActionExecutionService } from "../src/services/action.service";
import { createActionRoutes } from "../src/routes/actions.routes";
import { createWalletRoutes } from "../src/routes/wallet.routes";
import { createAuthRoutes } from "../src/routes/auth.routes";
import { ActionVersion } from "@ai-credits/shared";

describe("Correlation & Observability", () => {
  it("injects request-id and propagates correlation context", async () => {
    const app = new Hono();
    app.use("*", correlationMiddleware());
    app.get("/test", (c) => {
      const ctx = getCorrelationContext(c);
      return c.json({ requestId: ctx.requestId });
    });

    const res = await app.request("/test", {
      headers: { "x-request-id": "req_custom_123" }
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBe("req_custom_123");
    const body = await res.json() as any;
    expect(body.requestId).toBe("req_custom_123");
  });

  it("redacts sensitive prompt and response text from structured log output", () => {
    const logs: string[] = [];
    const logger = new PlatformLogger({
      sink: (msg) => logs.push(msg)
    });

    logger.info("Executing action", {
      requestId: "req_1",
      actionName: "optimize-resume",
      inputs: { cvText: "Secret candidate personal info", email: "alice@example.com" },
      rawOutput: "Secret response candidate analysis"
    });

    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.requestId).toBe("req_1");
    expect(parsed.actionName).toBe("optimize-resume");
    expect(parsed.inputs).toBe("[REDACTED]");
    expect(parsed.rawOutput).toBe("[REDACTED]");
    expect(parsed.level).toBe("INFO");
    expect(parsed.message).toBe("Executing action");
    expect(parsed.timestamp).toBeDefined();
  });

  it("generates a new request-id if none provided in request headers", async () => {
    const app = new Hono();
    app.use("*", correlationMiddleware());
    app.get("/test", (c) => {
      const ctx = getCorrelationContext(c);
      return c.json({ requestId: ctx.requestId });
    });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const reqIdHeader = res.headers.get("x-request-id");
    expect(reqIdHeader).toBeDefined();
    expect(reqIdHeader?.startsWith("req_")).toBe(true);
    const body = await res.json() as any;
    expect(body.requestId).toBe(reqIdHeader);
  });

  it("safely falls back to a generated request ID if getCorrelationContext is called on an uninstrumented context", async () => {
    const app = new Hono();
    app.get("/uninstrumented", (c) => {
      const ctx = getCorrelationContext(c);
      return c.json({ requestId: ctx.requestId });
    });

    const res = await app.request("/uninstrumented");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.requestId).toBeDefined();
    expect(body.requestId.startsWith("req_")).toBe(true);
  });

  it("redacts sensitive fields in nested objects and arrays", () => {
    const logs: string[] = [];
    const logger = new PlatformLogger({
      sink: (msg) => logs.push(msg)
    });

    logger.warn("Potential leak check", {
      requestId: "req_2",
      nested: {
        prompt: "Classified prompt instructions",
        systemPrompt: "Classified system prompt",
        cvText: "Classified CV text",
        secret: "super-secret-key",
        normalKey: "normal-value"
      },
      records: [
        { secret: "nested-in-array", name: "safe-name" },
        "plain-string"
      ]
    });

    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.level).toBe("WARN");
    expect(parsed.nested.prompt).toBe("[REDACTED]");
    expect(parsed.nested.systemPrompt).toBe("[REDACTED]");
    expect(parsed.nested.cvText).toBe("[REDACTED]");
    expect(parsed.nested.secret).toBe("[REDACTED]");
    expect(parsed.nested.normalKey).toBe("normal-value");
    expect(parsed.records[0].secret).toBe("[REDACTED]");
    expect(parsed.records[0].name).toBe("safe-name");
    expect(parsed.records[1]).toBe("plain-string");
  });

  it("supports error logging and default console output", () => {
    const logs: string[] = [];
    const logger = new PlatformLogger({
      sink: (msg) => logs.push(msg)
    });

    logger.error("Something went wrong", {
      requestId: "req_err",
      errorCode: "ACTION_FAILED",
      input: { sensitive: "data" }
    });

    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.level).toBe("ERROR");
    expect(parsed.errorCode).toBe("ACTION_FAILED");
    expect(parsed.input).toBe("[REDACTED]");

    // Default console logger instantiation
    const defaultLogger = new PlatformLogger();
    expect(defaultLogger).toBeDefined();
  });

  it("propagates correlation IDs in action, wallet, and auth routes", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_corr_1", 100);
    const ledger = new LedgerService(db);
    const authService = new AuthService(db, "corr-secret-key-32-chars-long-example!");
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const token = await authService.issueAuthorizationCode({
      userId: "usr_corr_1",
      email: "corr@example.com",
      projectId: "proj_corr_1",
      codeChallenge: verifier
    }).then(code => authService.exchangeCodeForSession({ projectId: "proj_corr_1", code, codeVerifier: verifier }))
      .then(res => res.sessionToken);

    const mockAction: ActionVersion = {
      actionName: "test-corr-action",
      version: 1,
      projectId: "proj_corr_1",
      model: "mock/gpt",
      priceCredits: 10,
      maxProviderCostCents: 2,
      maxOutputTokens: 200,
      outputFormat: "json",
      systemPrompt: "System",
      userPromptTemplate: "Hello {{name}}",
      inputSchema: { type: "object" },
      rateLimit: { maxRequests: 10, windowSeconds: 60 }
    };

    const modelProvider = new MockModelProvider();
    modelProvider.setResponse(JSON.stringify({ ok: true }));
    const actionService = new ActionExecutionService(ledger, modelProvider, [mockAction]);

    const app = new Hono();
    app.route("/v1/actions", createActionRoutes(actionService, authService));
    app.route("/v1/wallet", createWalletRoutes(ledger, authService));
    app.route("/v1/auth", createAuthRoutes(authService));

    // Test wallet route returns x-request-id
    const walletRes = await app.request("/v1/wallet", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-request-id": "req_wallet_test_456"
      }
    });
    expect(walletRes.status).toBe(200);
    expect(walletRes.headers.get("x-request-id")).toBe("req_wallet_test_456");

    // Test action execution returns x-request-id
    const actionRes = await app.request("/v1/actions/test-corr-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-request-id": "req_action_test_789"
      },
      body: JSON.stringify({
        projectId: "proj_corr_1",
        inputs: { name: "Tester" }
      })
    });
    expect(actionRes.status).toBe(200);
    expect(actionRes.headers.get("x-request-id")).toBe("req_action_test_789");

    // Test auth authorize route auto-generates x-request-id
    const authRes = await app.request("/v1/auth/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_corr_1",
        codeChallenge: verifier
      })
    });
    expect(authRes.status).toBe(200);
    expect(authRes.headers.get("x-request-id")?.startsWith("req_")).toBe(true);
  });

  it("re-exports correlation and logger from server root index", async () => {
    const { correlationMiddleware: expCorrelation, PlatformLogger: ExpLogger } = await import("../src/index");
    expect(expCorrelation).toBeDefined();
    expect(ExpLogger).toBeDefined();
  });

  it("ensures x-request-id response header is retained when route throws an unhandled error", async () => {
    const app = new Hono();
    app.use("*", correlationMiddleware());
    app.get("/error", () => {
      throw new Error("Unhandled crash");
    });

    const res = await app.request("/error", {
      headers: { "x-request-id": "req_err_trace" }
    });

    expect(res.status).toBe(500);
    expect(res.headers.get("x-request-id")).toBe("req_err_trace");
  });

  it("caches newly generated correlation context on c when getCorrelationContext is called", async () => {
    const app = new Hono();
    app.get("/cache-check", (c) => {
      const ctx1 = getCorrelationContext(c);
      const ctx2 = getCorrelationContext(c);
      return c.json({ ctx1Id: ctx1.requestId, ctx2Id: ctx2.requestId, same: ctx1 === ctx2 });
    });

    const res = await app.request("/cache-check");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.same).toBe(true);
    expect(body.ctx1Id).toBe(body.ctx2Id);
  });

  it("prevents meta fields from overwriting core log envelope fields", () => {
    const logs: string[] = [];
    const logger = new PlatformLogger({ sink: (msg) => logs.push(msg) });

    logger.info("Real message", {
      message: "Malicious override message",
      level: "FATAL",
      timestamp: "1970-01-01T00:00:00.000Z"
    });

    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.message).toBe("Real message");
    expect(parsed.level).toBe("INFO");
    expect(parsed.timestamp).not.toBe("1970-01-01T00:00:00.000Z");
  });

  it("serializes Error instances properly preserving message, name, and stack", () => {
    const logs: string[] = [];
    const logger = new PlatformLogger({ sink: (msg) => logs.push(msg) });

    const err = new Error("Database connection failed");
    err.name = "DatabaseError";

    logger.error("Operation failed", { error: err });

    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.error.message).toBe("Database connection failed");
    expect(parsed.error.name).toBe("DatabaseError");
    expect(parsed.error.stack).toBeDefined();
  });

  it("serializes Date instances and redacts credentials case-insensitively without infinite recursion on cycles", () => {
    const logs: string[] = [];
    const logger = new PlatformLogger({ sink: (msg) => logs.push(msg) });

    const cyclicObj: Record<string, unknown> = {
      now: new Date("2026-08-27T12:00:00Z"),
      Authorization: "Bearer sensitive-token",
      ApiKey: "secret-api-key",
      password: "my-password",
      TOKEN: "auth-token",
      safe: "public-value"
    };
    cyclicObj.self = cyclicObj;

    logger.info("Cycle test", cyclicObj);

    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.now).toBe("2026-08-27T12:00:00.000Z");
    expect(parsed.Authorization).toBe("[REDACTED]");
    expect(parsed.ApiKey).toBe("[REDACTED]");
    expect(parsed.password).toBe("[REDACTED]");
    expect(parsed.TOKEN).toBe("[REDACTED]");
    expect(parsed.safe).toBe("public-value");
    expect(parsed.self).toBe("[CIRCULAR]");
  });

  it("handles invalid Date instances gracefully and redacts keys with hyphens and underscores", () => {
    const logs: string[] = [];
    const logger = new PlatformLogger({ sink: (msg) => logs.push(msg) });

    const invalidDate = new Date("not-a-valid-date");
    logger.info("Hardening test", {
      invalidDate,
      api_key: "key-123",
      "api-key": "key-456",
      auth_token: "tok-789",
      "auth-token": "tok-000",
      normal_field: "safe"
    });

    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.invalidDate).toBe("[INVALID DATE]");
    expect(parsed.api_key).toBe("[REDACTED]");
    expect(parsed["api-key"]).toBe("[REDACTED]");
    expect(parsed.auth_token).toBe("[REDACTED]");
    expect(parsed["auth-token"]).toBe("[REDACTED]");
    expect(parsed.normal_field).toBe("safe");
  });
});
