import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { LedgerService } from "../src/services/ledger.service";
import { AuthService } from "../src/services/auth.service";
import { MockModelProvider } from "../src/adapters/model-provider";
import { ActionExecutionService } from "../src/services/action.service";
import { createActionRoutes } from "../src/routes/actions.routes";
import { ActionVersion } from "@ai-credits/shared";

describe("Managed Actions Execution Endpoint", () => {
  const setupTestEnv = async (initialBalance = 50) => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_1", initialBalance);

    const ledger = new LedgerService(db);
    const authService = new AuthService(db, "secret-key-32-chars-long-example!");
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const token = await authService.issueAuthorizationCode({
      userId: "usr_1",
      email: "usr@example.com",
      projectId: "proj_1",
      codeChallenge: verifier
    }).then(code => authService.exchangeCodeForSession({ projectId: "proj_1", code, codeVerifier: verifier }))
      .then(res => res.sessionToken);

    const mockAction: ActionVersion = {
      actionName: "test-action",
      version: 1,
      projectId: "proj_1",
      model: "mock/gpt",
      priceCredits: 15,
      maxProviderCostCents: 5,
      maxOutputTokens: 500,
      outputFormat: "json",
      systemPrompt: "System",
      userPromptTemplate: "Hello {{name}}",
      inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
      rateLimit: { maxRequests: 10, windowSeconds: 60 }
    };

    const textAction: ActionVersion = {
      actionName: "text-action",
      version: 1,
      projectId: "proj_1",
      model: "mock/gpt",
      priceCredits: 10,
      maxProviderCostCents: 5,
      maxOutputTokens: 200,
      outputFormat: "text",
      systemPrompt: "Text system",
      userPromptTemplate: "Tell story for {{topic}}",
      inputSchema: { type: "object", properties: { topic: { type: "string" } } },
      rateLimit: { maxRequests: 10, windowSeconds: 60 }
    };

    const modelProvider = new MockModelProvider();
    modelProvider.setResponse(JSON.stringify({ greeting: "Hello World" }));

    const actionService = new ActionExecutionService(ledger, modelProvider, [mockAction, textAction]);
    const app = new Hono();
    app.route("/v1/actions", createActionRoutes(actionService, authService));

    return { db, ledger, authService, token, mockAction, textAction, modelProvider, actionService, app };
  };

  it("executes action, validates input, reserves credits, calls LLM, settles, and returns output", async () => {
    const { ledger, token, app } = await setupTestEnv(50);

    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: "proj_1",
        inputs: { name: "Alice" }
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.creditsUsed).toBe(15);
    expect(body.output).toEqual({ greeting: "Hello World" });
    expect(body.remainingBalance).toBe(35);

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(35);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("executes action with text output format without JSON parsing", async () => {
    const { ledger, token, app, modelProvider } = await setupTestEnv(50);
    modelProvider.setResponse("Once upon a time in a far away land...");

    const res = await app.request("/v1/actions/text-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: "proj_1",
        inputs: { topic: "magic" }
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.creditsUsed).toBe(10);
    expect(body.output).toBe("Once upon a time in a far away land...");
    expect(body.remainingBalance).toBe(40);

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(40);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("fails with 401 when Authorization header is missing or not Bearer", async () => {
    const { app } = await setupTestEnv(50);

    const res1 = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "proj_1", inputs: { name: "Alice" } })
    });
    expect(res1.status).toBe(401);
    const body1 = await res1.json() as any;
    expect(body1.code).toBe("UNAUTHORIZED");

    const res2 = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic dXNlcjpwYXNz"
      },
      body: JSON.stringify({ projectId: "proj_1", inputs: { name: "Alice" } })
    });
    expect(res2.status).toBe(401);
  });

  it("fails with 401 when session token is invalid or expired", async () => {
    const { app } = await setupTestEnv(50);

    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid.jwt.token"
      },
      body: JSON.stringify({ projectId: "proj_1", inputs: { name: "Alice" } })
    });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("fails with 404 when action is not found", async () => {
    const { token, app } = await setupTestEnv(50);

    // Non-existent action name
    const resNotFound = await app.request("/v1/actions/unknown-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ projectId: "proj_1", inputs: {} })
    });
    expect(resNotFound.status).toBe(404);
    const bodyNotFound = await resNotFound.json() as any;
    expect(bodyNotFound.code).toBe("ACTION_NOT_FOUND");
  });

  it("fails with 401 when body.projectId mismatches session projectId", async () => {
    const { token, app } = await setupTestEnv(50);

    const resMismatch = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ projectId: "other_proj", inputs: { name: "Alice" } })
    });
    expect(resMismatch.status).toBe(401);
    const body = await resMismatch.json() as any;
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.error).toBe("Token not valid for this project");
  });

  it("fails with 402 INSUFFICIENT_CREDITS when user lacks required credits", async () => {
    const { ledger, token, app } = await setupTestEnv(10); // price is 15

    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: "proj_1",
        inputs: { name: "Alice" }
      })
    });

    expect(res.status).toBe(402);
    const body = await res.json() as any;
    expect(body.code).toBe("INSUFFICIENT_CREDITS");

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("releases reserved credits and returns 400 when template input is missing", async () => {
    const { ledger, token, app } = await setupTestEnv(50);

    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: "proj_1",
        inputs: {} // missing "name"
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.code).toBe("INVALID_INPUT");

    // Credits must be completely released back
    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(50);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("releases reserved credits and returns 400 when margin guard is exceeded", async () => {
    const { ledger, token, app, modelProvider } = await setupTestEnv(50);
    // maxProviderCostCents is 5, model returns cost of 10
    modelProvider.setCostCents(10);

    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: "proj_1",
        inputs: { name: "Alice" }
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.code).toBe("MARGIN_EXCEEDED");

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(50);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("releases reserved credits and returns 422 when model JSON output is invalid", async () => {
    const { ledger, token, app, modelProvider } = await setupTestEnv(50);
    modelProvider.setResponse("This is not valid JSON at all!");

    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: "proj_1",
        inputs: { name: "Alice" }
      })
    });

    expect(res.status).toBe(422);
    const body = await res.json() as any;
    expect(body.code).toBe("UNTRUSTED_OUTPUT");

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(50);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("releases reserved credits and returns 500 when model provider throws an unexpected error", async () => {
    const { ledger, token, app, modelProvider } = await setupTestEnv(50);
    modelProvider.generate = async () => {
      throw new Error("Provider API timeout or failure");
    };

    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: "proj_1",
        inputs: { name: "Alice" }
      })
    });

    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.error).toContain("Provider API timeout or failure");

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(50);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("streams SSE result when Accept: text/event-stream is requested", async () => {
    const { ledger, token, app } = await setupTestEnv(50);

    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: "proj_1",
        inputs: { name: "Alice" }
      })
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const text = await res.text();
    expect(text).toContain("event: result");
    expect(text).toContain('"creditsUsed":15');
    expect(text).toContain('"greeting":"Hello World"');

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(35);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("supports multi-tenant action mapping with same actionName across different projects", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_p1", 50);
    db.seedWallet("usr_p2", 50);

    const ledger = new LedgerService(db);
    const authService = new AuthService(db, "secret-key-32-chars-long-example!");
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";

    const token1 = await authService.issueAuthorizationCode({
      userId: "usr_p1",
      email: "u1@example.com",
      projectId: "proj_alpha",
      codeChallenge: verifier
    }).then(code => authService.exchangeCodeForSession({ projectId: "proj_alpha", code, codeVerifier: verifier }))
      .then(res => res.sessionToken);

    const token2 = await authService.issueAuthorizationCode({
      userId: "usr_p2",
      email: "u2@example.com",
      projectId: "proj_beta",
      codeChallenge: verifier
    }).then(code => authService.exchangeCodeForSession({ projectId: "proj_beta", code, codeVerifier: verifier }))
      .then(res => res.sessionToken);

    const actionAlpha: ActionVersion = {
      actionName: "shared-action",
      version: 1,
      projectId: "proj_alpha",
      model: "mock/gpt",
      priceCredits: 10,
      maxProviderCostCents: 5,
      maxOutputTokens: 200,
      outputFormat: "text",
      systemPrompt: "Alpha system",
      userPromptTemplate: "Alpha {{input}}",
      inputSchema: { type: "object", properties: { input: { type: "string" } } },
      rateLimit: { maxRequests: 10, windowSeconds: 60 }
    };

    const actionBeta: ActionVersion = {
      actionName: "shared-action",
      version: 1,
      projectId: "proj_beta",
      model: "mock/gpt",
      priceCredits: 25,
      maxProviderCostCents: 5,
      maxOutputTokens: 200,
      outputFormat: "text",
      systemPrompt: "Beta system",
      userPromptTemplate: "Beta {{input}}",
      inputSchema: { type: "object", properties: { input: { type: "string" } } },
      rateLimit: { maxRequests: 10, windowSeconds: 60 }
    };

    const modelProvider = new MockModelProvider();
    modelProvider.setResponse("Execution response");

    const actionService = new ActionExecutionService(ledger, modelProvider, [actionAlpha, actionBeta]);
    const app = new Hono().route("/v1/actions", createActionRoutes(actionService, authService));

    const resAlpha = await app.request("/v1/actions/shared-action/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token1}` },
      body: JSON.stringify({ inputs: { input: "test" } })
    });
    expect(resAlpha.status).toBe(200);
    const bodyAlpha = await resAlpha.json() as any;
    expect(bodyAlpha.creditsUsed).toBe(10);

    const resBeta = await app.request("/v1/actions/shared-action/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token2}` },
      body: JSON.stringify({ inputs: { input: "test" } })
    });
    expect(resBeta.status).toBe(200);
    const bodyBeta = await resBeta.json() as any;
    expect(bodyBeta.creditsUsed).toBe(25);
  });

  it("handles missing inputs payload safely when schema requires fields without throwing TypeError", async () => {
    const { app, token } = await setupTestEnv();
    const res = await app.request("/v1/actions/test-action/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      // inputs omitted completely
      body: JSON.stringify({})
    });

    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toContain('Missing required input field: "name"');
  });
});
