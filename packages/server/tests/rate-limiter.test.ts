import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { SlidingWindowRateLimiter } from "../src/services/rate-limiter";
import { SlidingWindowRateLimiter as ReExportedLimiter } from "../src/index";
import { ActionExecutionService } from "../src/services/action.service";
import { LedgerService } from "../src/services/ledger.service";
import { AuthService } from "../src/services/auth.service";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { MockModelProvider } from "../src/adapters/model-provider";
import { createActionRoutes } from "../src/routes/actions.routes";
import { ActionVersion, PlatformError, PlatformErrorCodes } from "@platform/shared";

describe("Sliding Window Rate Limiter", () => {
  it("re-exports SlidingWindowRateLimiter from index", () => {
    expect(ReExportedLimiter).toBeDefined();
    expect(ReExportedLimiter).toBe(SlidingWindowRateLimiter);
  });

  it("permits requests up to maxRequests and blocks subsequent requests within window", () => {
    const limiter = new SlidingWindowRateLimiter();
    const key = "usr_rate_1:proj_1:action_summarize";

    // 3 requests allowed in 60s
    expect(limiter.checkLimit(key, 3, 60)).toBe(true);
    expect(limiter.checkLimit(key, 3, 60)).toBe(true);
    expect(limiter.checkLimit(key, 3, 60)).toBe(true);
    // 4th request must be rejected
    expect(limiter.checkLimit(key, 3, 60)).toBe(false);
  });

  it("calculates remaining retry seconds accurately", () => {
    const limiter = new SlidingWindowRateLimiter();
    const key = "usr_rate_2:proj_1:action_summarize";

    limiter.checkLimit(key, 1, 30);
    expect(limiter.checkLimit(key, 1, 30)).toBe(false);
    const retryAfter = limiter.getResetSeconds(key, 30);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(30);
  });

  it("tracks rate limits independently across different keys", () => {
    const limiter = new SlidingWindowRateLimiter();
    const keyA = "usr_1:proj_1:action_a";
    const keyB = "usr_2:proj_1:action_a";

    expect(limiter.checkLimit(keyA, 1, 60)).toBe(true);
    expect(limiter.checkLimit(keyA, 1, 60)).toBe(false);

    // keyB should still be permitted
    expect(limiter.checkLimit(keyB, 1, 60)).toBe(true);
  });

  it("returns 0 reset seconds when no requests exist for key", () => {
    const limiter = new SlidingWindowRateLimiter();
    expect(limiter.getResetSeconds("non_existent_key", 60)).toBe(0);
  });

  it("allows new requests after sliding window time expires", async () => {
    const limiter = new SlidingWindowRateLimiter();
    const key = "usr_short_window:proj_1:action_test";

    // 1 request allowed in 1s window (simulated or short)
    expect(limiter.checkLimit(key, 1, 1)).toBe(true);
    expect(limiter.checkLimit(key, 1, 1)).toBe(false);

    // Wait slightly more than 1 second
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Request should now be permitted again
    expect(limiter.checkLimit(key, 1, 1)).toBe(true);
  });

  it("supports clearing specific keys or all keys", () => {
    const limiter = new SlidingWindowRateLimiter();
    limiter.checkLimit("key1", 1, 60);
    limiter.checkLimit("key2", 1, 60);
    expect(limiter.checkLimit("key1", 1, 60)).toBe(false);
    expect(limiter.checkLimit("key2", 1, 60)).toBe(false);

    limiter.clear("key1");
    expect(limiter.checkLimit("key1", 1, 60)).toBe(true);
    expect(limiter.checkLimit("key2", 1, 60)).toBe(false);

    limiter.clear();
    expect(limiter.checkLimit("key2", 1, 60)).toBe(true);
  });
});

describe("Rate Limiter Integration with ActionExecutionService and Routes", () => {
  const setupEnv = async (maxRequests = 2, windowSeconds = 60) => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_rl_1", 100);
    db.seedWallet("usr_rl_2", 100);

    const ledger = new LedgerService(db);
    const authService = new AuthService(db, "secret-key-32-chars-long-example!");
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";

    const token1 = await authService.issueAuthorizationCode({
      userId: "usr_rl_1",
      email: "u1@example.com",
      projectId: "proj_1",
      codeChallenge: verifier
    }).then(code => authService.exchangeCodeForSession({ projectId: "proj_1", code, codeVerifier: verifier }))
      .then(res => res.sessionToken);

    const token2 = await authService.issueAuthorizationCode({
      userId: "usr_rl_2",
      email: "u2@example.com",
      projectId: "proj_1",
      codeChallenge: verifier
    }).then(code => authService.exchangeCodeForSession({ projectId: "proj_1", code, codeVerifier: verifier }))
      .then(res => res.sessionToken);

    const action: ActionVersion = {
      actionName: "rate-limited-action",
      version: 1,
      projectId: "proj_1",
      model: "mock/gpt",
      priceCredits: 10,
      maxProviderCostCents: 5,
      maxOutputTokens: 100,
      outputFormat: "text",
      systemPrompt: "System",
      userPromptTemplate: "Hello {{name}}",
      inputSchema: { type: "object", properties: { name: { type: "string" } } },
      rateLimit: { maxRequests, windowSeconds }
    };

    const modelProvider = new MockModelProvider();
    modelProvider.setResponse("Hello Result");

    const rateLimiter = new SlidingWindowRateLimiter();
    const actionService = new ActionExecutionService(
      ledger,
      modelProvider,
      [action],
      undefined,
      rateLimiter
    );

    const app = new Hono().route("/v1/actions", createActionRoutes(actionService, authService));

    return { db, ledger, authService, token1, token2, action, modelProvider, rateLimiter, actionService, app };
  };

  it("throws PlatformError(RATE_LIMITED) and preserves credits when limit exceeded in ActionExecutionService", async () => {
    const { ledger, actionService } = await setupEnv(2, 60);

    // First 2 executions should succeed
    await actionService.execute({
      actionName: "rate-limited-action",
      projectId: "proj_1",
      userId: "usr_rl_1",
      inputs: { name: "A" }
    });
    await actionService.execute({
      actionName: "rate-limited-action",
      projectId: "proj_1",
      userId: "usr_rl_1",
      inputs: { name: "B" }
    });

    const walletBefore = await ledger.getWallet("usr_rl_1");
    expect(walletBefore.availableCredits).toBe(80);

    // 3rd execution must throw RATE_LIMITED
    let caughtErr: any;
    try {
      await actionService.execute({
        actionName: "rate-limited-action",
        projectId: "proj_1",
        userId: "usr_rl_1",
        inputs: { name: "C" }
      });
    } catch (err) {
      caughtErr = err;
    }

    expect(caughtErr).toBeInstanceOf(PlatformError);
    expect(caughtErr.code).toBe(PlatformErrorCodes.RATE_LIMITED);
    expect(caughtErr.message).toContain("Rate limit exceeded");
    expect(caughtErr.details).toBeDefined();
    expect(caughtErr.details.retryAfter).toBeGreaterThan(0);

    // Ensure no credits were reserved/deducted for rejected attempt
    const walletAfter = await ledger.getWallet("usr_rl_1");
    expect(walletAfter.availableCredits).toBe(80);
    expect(walletAfter.reservedCredits).toBe(0);
  });

  it("tracks rate limits per user independently in ActionExecutionService", async () => {
    const { actionService } = await setupEnv(1, 60);

    // User 1 uses their limit
    await actionService.execute({
      actionName: "rate-limited-action",
      projectId: "proj_1",
      userId: "usr_rl_1",
      inputs: { name: "User1" }
    });

    // User 1 blocked
    expect(actionService.execute({
      actionName: "rate-limited-action",
      projectId: "proj_1",
      userId: "usr_rl_1",
      inputs: { name: "User1 again" }
    })).rejects.toThrow("Rate limit exceeded");

    // User 2 should still be allowed to execute
    const res = await actionService.execute({
      actionName: "rate-limited-action",
      projectId: "proj_1",
      userId: "usr_rl_2",
      inputs: { name: "User2" }
    });
    expect(res.creditsUsed).toBe(10);
  });

  it("works when rateLimiter is omitted from ActionExecutionService constructor", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_no_limiter", 100);
    const ledger = new LedgerService(db);
    const modelProvider = new MockModelProvider();
    modelProvider.setResponse("OK");

    const action: ActionVersion = {
      actionName: "test-no-limiter",
      version: 1,
      projectId: "proj_1",
      model: "mock/gpt",
      priceCredits: 10,
      maxProviderCostCents: 5,
      maxOutputTokens: 100,
      outputFormat: "text",
      systemPrompt: "System",
      userPromptTemplate: "Hello",
      inputSchema: {},
      rateLimit: { maxRequests: 1, windowSeconds: 60 }
    };

    // Constructed without rate limiter
    const service = new ActionExecutionService(ledger, modelProvider, [action]);

    // Multiple calls succeed without rate limiter
    await service.execute({ actionName: "test-no-limiter", projectId: "proj_1", userId: "usr_no_limiter", inputs: {} });
    await service.execute({ actionName: "test-no-limiter", projectId: "proj_1", userId: "usr_no_limiter", inputs: {} });
  });

  it("returns HTTP 429 with Retry-After header on route when rate limit is breached", async () => {
    const { token1, app } = await setupEnv(2, 60);

    // 1st request -> 200
    const res1 = await app.request("/v1/actions/rate-limited-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token1}`
      },
      body: JSON.stringify({ inputs: { name: "First" } })
    });
    expect(res1.status).toBe(200);

    // 2nd request -> 200
    const res2 = await app.request("/v1/actions/rate-limited-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token1}`
      },
      body: JSON.stringify({ inputs: { name: "Second" } })
    });
    expect(res2.status).toBe(200);

    // 3rd request -> 429
    const res3 = await app.request("/v1/actions/rate-limited-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token1}`
      },
      body: JSON.stringify({ inputs: { name: "Third" } })
    });
    expect(res3.status).toBe(429);
    const body = await res3.json() as any;
    expect(body.code).toBe("RATE_LIMITED");
    expect(body.error).toContain("Rate limit exceeded");

    const retryAfterHeader = res3.headers.get("Retry-After");
    expect(retryAfterHeader).not.toBeNull();
    expect(Number(retryAfterHeader)).toBeGreaterThan(0);
    expect(Number(retryAfterHeader)).toBeLessThanOrEqual(60);
  });
});
