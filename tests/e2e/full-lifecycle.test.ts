import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { InMemoryDatabase } from "../../packages/server/src/adapters/in-memory-db";
import { LedgerService } from "../../packages/server/src/services/ledger.service";
import { AuthService } from "../../packages/server/src/services/auth.service";
import { MockModelProvider } from "../../packages/server/src/adapters/model-provider";
import { ActionExecutionService } from "../../packages/server/src/services/action.service";
import { StripeBillingService } from "../../packages/server/src/services/stripe.service";
import { createAuthRoutes } from "../../packages/server/src/routes/auth.routes";
import { createActionRoutes } from "../../packages/server/src/routes/actions.routes";
import { createStripeRoutes } from "../../packages/server/src/routes/stripe.routes";
import { createAI } from "../../packages/sdk/src";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("E2E Full Platform Lifecycle", () => {
  it("executes complete lifecycle: signup -> bonus -> action -> deduction -> topup", async () => {
    // 1. Setup Server Gateway
    const db = new InMemoryDatabase();
    const ledger = new LedgerService(db);
    const authService = new AuthService(db, "e2e-secret-key-32-chars-long-example!");
    const stripeService = new StripeBillingService(db);
    const modelProvider = new MockModelProvider();
    modelProvider.setResponse(JSON.stringify({ improvedSummary: "High-impact tech leader" }));

    const actionService = new ActionExecutionService(ledger, modelProvider, [{
      actionName: "optimize-resume",
      version: 1,
      projectId: "proj_e2e",
      model: "mock/gpt",
      priceCredits: 15,
      maxProviderCostCents: 5,
      maxOutputTokens: 500,
      outputFormat: "json",
      systemPrompt: "Recruiter prompt",
      userPromptTemplate: "CV: {{cvText}}",
      inputSchema: { type: "object" },
      rateLimit: { maxRequests: 10, windowSeconds: 60 }
    }]);

    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));
    app.route("/v1/actions", createActionRoutes(actionService, authService));
    app.route("/v1/stripe", createStripeRoutes(stripeService));

    // 2. User Authenticates via PKCE & Receives 20 Welcome Credits
    // Note: TokenExchangeRequestSchema enforces verifier length >= 32 chars
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "usr_e2e_1",
      email: "engineer@example.com",
      projectId: "proj_e2e",
      codeChallenge: verifier
    });

    const tokenRes = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_e2e",
        code,
        codeVerifier: verifier
      })
    });
    const tokenData = await tokenRes.json() as any;
    expect(tokenData.welcomeBonusGranted).toBe(true);

    let wallet = await ledger.getWallet("usr_e2e_1");
    expect(wallet.availableCredits).toBe(20);

    // 3. User Executes Action (15 credits)
    const actionRes = await app.request("/v1/actions/optimize-resume/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenData.sessionToken}`
      },
      body: JSON.stringify({
        projectId: "proj_e2e",
        inputs: { cvText: "Experienced engineer with Bun and TS." }
      })
    });
    const actionData = await actionRes.json() as any;
    expect(actionData.creditsUsed).toBe(15);
    expect(actionData.output.improvedSummary).toBe("High-impact tech leader");

    wallet = await ledger.getWallet("usr_e2e_1");
    expect(wallet.availableCredits).toBe(5);

    // 4. User Tops Up via Stripe ($5 -> 550 credits)
    await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "evt_topup_1",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_e2e_123",
            metadata: { userId: "usr_e2e_1", packId: "popular" }
          }
        }
      })
    });

    wallet = await ledger.getWallet("usr_e2e_1");
    expect(wallet.availableCredits).toBe(555); // 5 + 550
  });

  describe("Demo Web Application (apps/demo)", () => {
    it("has all required demo application files and valid UI structure", () => {
      const demoRoot = join(process.cwd(), "apps", "demo");
      const packageJsonPath = join(demoRoot, "package.json");
      const indexHtmlPath = join(demoRoot, "index.html");
      const mainTsPath = join(demoRoot, "src", "main.ts");
      const styleCssPath = join(demoRoot, "src", "style.css");

      expect(existsSync(packageJsonPath)).toBe(true);
      expect(existsSync(indexHtmlPath)).toBe(true);
      expect(existsSync(mainTsPath)).toBe(true);
      expect(existsSync(styleCssPath)).toBe(true);

      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      expect(pkg.name).toBe("demo-app");
      expect(pkg.dependencies["@platform/sdk"]).toBeDefined();

      const html = readFileSync(indexHtmlPath, "utf-8");
      expect(html).toContain('id="cvInput"');
      expect(html).toContain('id="optimizeBtn"');
      expect(html).toContain('id="output"');
      expect(html).toContain('src="/src/main.ts"');
    });

    it("verifies AIClient mock execution for the demo app", async () => {
      const ai = createAI({
        project: "pk_live_demo123",
        mock: true
      });

      const res = await ai.action("optimize-resume", {
        inputs: { cvText: "Senior Software Engineer CV" }
      });

      expect(res.creditsUsed).toBe(0);
      expect(res.remainingBalance).toBe(999);
      expect(res.output).toEqual({
        mock: true,
        message: "Mock execution for optimize-resume"
      });
    });
  });
});
