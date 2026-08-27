import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import crypto from "node:crypto";
import { InMemoryDatabase } from "../../packages/server/src/adapters/in-memory-db";
import { LedgerService } from "../../packages/server/src/services/ledger.service";
import { AuthService } from "../../packages/server/src/services/auth.service";
import { MockModelProvider } from "../../packages/server/src/adapters/model-provider";
import { ActionExecutionService } from "../../packages/server/src/services/action.service";
import { StripeBillingService } from "../../packages/server/src/services/stripe.service";
import { DeveloperService } from "../../packages/server/src/services/developer.service";
import { ActionRunService } from "../../packages/server/src/services/run.service";
import { SlidingWindowRateLimiter } from "../../packages/server/src/services/rate-limiter";
import { createAuthRoutes } from "../../packages/server/src/routes/auth.routes";
import { createActionRoutes } from "../../packages/server/src/routes/actions.routes";
import { createStripeRoutes } from "../../packages/server/src/routes/stripe.routes";
import { createDeveloperRoutes } from "../../packages/server/src/routes/developer.routes";
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

  it("executes production-hardened lifecycle: developer publish -> correlation ID -> run audit -> rate limit -> signed stripe topup & refund", async () => {
    // 1. Setup Gateway with all hardened services
    const db = new InMemoryDatabase();
    const ledger = new LedgerService(db);
    const authService = new AuthService(db, "e2e-hardened-secret-32-chars-long!");
    const devService = new DeveloperService(db);
    const runService = new ActionRunService(db);
    const rateLimiter = new SlidingWindowRateLimiter();
    const modelProvider = new MockModelProvider();
    modelProvider.setResponse(JSON.stringify({ review: "Security review passed. No critical flaws detected." }));
    modelProvider.setCostCents(2.0);

    const webhookSecret = "whsec_e2e_hardened_test_secret_12345";
    const stripeService = new StripeBillingService(db, webhookSecret);

    // Register project with developer secret and public key
    await devService.registerProject({
      projectId: "proj_hardened",
      name: "Hardened Security App",
      publicKey: "pk_live_hardened_abc",
      secretKey: "sk_live_hardened_sec_xyz"
    });

    const actionService = new ActionExecutionService(
      ledger,
      modelProvider,
      devService,
      runService,
      rateLimiter
    );

    const app = new Hono();
    app.route("/v1/developer", createDeveloperRoutes(devService));
    app.route("/v1/auth", createAuthRoutes(authService));
    app.route("/v1/actions", createActionRoutes(actionService, authService));
    app.route("/v1/stripe", createStripeRoutes(stripeService));

    // 2. Developer Action Publishing & Key Verification
    // 2a. Public key (pk_live_...) is strictly rejected on developer endpoint
    const rejectRes = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer pk_live_hardened_abc"
      },
      body: JSON.stringify({
        actionName: "security-audit",
        model: "openai/gpt-4o-mini",
        priceCredits: 10
      })
    });
    expect(rejectRes.status).toBe(401);
    const rejectBody = await rejectRes.json() as any;
    expect(rejectBody.code).toBe("UNAUTHORIZED");

    // 2b. Developer publishes immutable action version with developer secret (sk_live_...)
    const publishRes = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_hardened_sec_xyz"
      },
      body: JSON.stringify({
        actionName: "security-audit",
        model: "openai/gpt-4o-mini",
        priceCredits: 10,
        maxProviderCostCents: 5,
        maxOutputTokens: 500,
        outputFormat: "json",
        systemPrompt: "You are a secure code analysis bot.",
        userPromptTemplate: "Audit code: {{codeSnippet}}",
        inputSchema: { type: "object", required: ["codeSnippet"] },
        rateLimit: { maxRequests: 1, windowSeconds: 60 }
      })
    });
    expect(publishRes.status).toBe(201);
    const publishData = await publishRes.json() as any;
    expect(publishData.action.version).toBe(1);
    expect(publishData.action.actionName).toBe("security-audit");
    expect(publishData.action.projectId).toBe("proj_hardened");
    expect(publishData.action.priceCredits).toBe(10);
    expect(publishData.action.rateLimit.maxRequests).toBe(1);

    // 3. User Authenticates via PKCE, receives 20-credit welcome bonus
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "usr_hardened_alice",
      email: "alice@example.com",
      projectId: "proj_hardened",
      codeChallenge: verifier
    });

    const tokenRes = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_hardened",
        code,
        codeVerifier: verifier
      })
    });
    expect(tokenRes.status).toBe(200);
    const tokenData = await tokenRes.json() as any;
    expect(tokenData.welcomeBonusGranted).toBe(true);
    expect(tokenData.sessionToken).toBeDefined();

    let wallet = await ledger.getWallet("usr_hardened_alice");
    expect(wallet.availableCredits).toBe(20);
    expect(wallet.reservedCredits).toBe(0);

    // 4. User Executes Action with x-request-id correlation ID propagated
    const customRequestId = "req_hardened_audit_001";
    const actionRes = await app.request("/v1/actions/security-audit/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenData.sessionToken}`,
        "x-request-id": customRequestId
      },
      body: JSON.stringify({
        projectId: "proj_hardened",
        inputs: { codeSnippet: "const apiKey = 'sk-12345';" }
      })
    });

    expect(actionRes.status).toBe(200);
    expect(actionRes.headers.get("x-request-id")).toBe(customRequestId);

    const actionData = await actionRes.json() as any;
    expect(actionData.creditsUsed).toBe(10);
    expect(actionData.remainingBalance).toBe(10);
    expect(actionData.output.review).toBe("Security review passed. No critical flaws detected.");
    expect(actionData.runId).toBeDefined();

    wallet = await ledger.getWallet("usr_hardened_alice");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(0);

    // 5. Action Run Audit Record Created in ActionRunService with Cryptographically Verified Hashes
    const run = runService.getRun(actionData.runId);
    expect(run).toBeDefined();
    expect(run?.id).toBe(actionData.runId);
    expect(run?.projectId).toBe("proj_hardened");
    expect(run?.userId).toBe("usr_hardened_alice");
    expect(run?.actionName).toBe("security-audit");
    expect(run?.actionVersion).toBe(1);
    expect(run?.status).toBe("SUCCEEDED");
    expect(run?.reservedCredits).toBe(10);
    expect(run?.consumedCredits).toBe(10);
    expect(run?.costCents).toBe(2.0);
    expect(run?.completedAt).toBeDefined();

    // Cryptographic verification of promptHash and inputHash
    const expectedPrompt = "You are a secure code analysis bot.\n---\nAudit code: {{codeSnippet}}";
    const expectedPromptHash = crypto.createHash("sha256").update(expectedPrompt).digest("hex");
    const expectedInputHash = crypto.createHash("sha256").update(JSON.stringify({ codeSnippet: "const apiKey = 'sk-12345';" })).digest("hex");

    expect(run?.promptHash).toBe(expectedPromptHash);
    expect(run?.inputHash).toBe(expectedInputHash);

    // 6. Rate Limiter Enforces Limit on Repeated Calls (maxRequests = 1), Returning HTTP 429 with Retry-After
    const rateLimitedRes = await app.request("/v1/actions/security-audit/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenData.sessionToken}`,
        "x-request-id": "req_hardened_audit_002"
      },
      body: JSON.stringify({
        projectId: "proj_hardened",
        inputs: { codeSnippet: "console.log('safe');" }
      })
    });

    expect(rateLimitedRes.status).toBe(429);
    expect(rateLimitedRes.headers.get("x-request-id")).toBe("req_hardened_audit_002");
    const retryAfter = rateLimitedRes.headers.get("Retry-After");
    expect(retryAfter).not.toBeNull();
    expect(Number(retryAfter)).toBeGreaterThan(0);
    expect(Number(retryAfter)).toBeLessThanOrEqual(60);

    const rateLimitedBody = await rateLimitedRes.json() as any;
    expect(rateLimitedBody.code).toBe("RATE_LIMITED");

    // Wallet untouched after rate limit rejection
    wallet = await ledger.getWallet("usr_hardened_alice");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(0);

    // 7. Signed Stripe Webhook Top-Up (+550) and Signed Refund (-550) via Balanced Double-Entry Ledger
    // 7a. Reject unauthenticated / invalid signature webhook
    const invalidSigRes = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "invalid_sig"
      },
      body: JSON.stringify({ id: "evt_fake", type: "checkout.session.completed", data: { object: {} } })
    });
    expect(invalidSigRes.status).toBe(400);
    const invalidSigBody = await invalidSigRes.json() as any;
    expect(invalidSigBody.error).toBe("INVALID_SIGNATURE");

    // 7b. Signed checkout.session.completed webhook -> +550 credits
    const topupPayload = JSON.stringify({
      id: "evt_topup_hardened_999",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_hardened_session_1",
          metadata: {
            userId: "usr_hardened_alice",
            packId: "popular"
          }
        }
      }
    });
    const topupTimestamp = Math.floor(Date.now() / 1000).toString();
    const topupHmac = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${topupTimestamp}.${topupPayload}`)
      .digest("hex");
    const topupSigHeader = `t=${topupTimestamp},v1=${topupHmac}`;

    const topupRes = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": topupSigHeader
      },
      body: topupPayload
    });
    expect(topupRes.status).toBe(200);
    const topupBody = await topupRes.json() as any;
    expect(topupBody.received).toBe(true);

    wallet = await ledger.getWallet("usr_hardened_alice");
    expect(wallet.availableCredits).toBe(560); // 10 + 550

    // 7c. Signed charge.refunded webhook -> -550 credits via balanced double-entry
    const refundPayload = JSON.stringify({
      id: "evt_refund_hardened_999",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_hardened_charge_1",
          metadata: {
            userId: "usr_hardened_alice",
            packId: "popular"
          }
        }
      }
    });
    const refundTimestamp = Math.floor(Date.now() / 1000).toString();
    const refundHmac = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${refundTimestamp}.${refundPayload}`)
      .digest("hex");
    const refundSigHeader = `t=${refundTimestamp},v1=${refundHmac}`;

    const refundRes = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": refundSigHeader
      },
      body: refundPayload
    });
    expect(refundRes.status).toBe(200);
    const refundBody = await refundRes.json() as any;
    expect(refundBody.received).toBe(true);

    wallet = await ledger.getWallet("usr_hardened_alice");
    expect(wallet.availableCredits).toBe(10); // 560 - 550 = 10
    expect(wallet.reservedCredits).toBe(0);

    // Verify double-entry ledger transactions are balanced and recorded in db
    const topupTx = db.transactions.get("stripe_cs_hardened_session_1");
    expect(topupTx).toBeDefined();
    expect(topupTx?.transactionType).toBe("TOPUP");
    const topupSum = topupTx!.entries.reduce((sum, e) => sum + e.amountCredits, 0);
    expect(topupSum).toBe(0); // Zero-sum balance

    const refundTx = db.transactions.get("stripe_refund_ch_hardened_charge_1");
    expect(refundTx).toBeDefined();
    expect(refundTx?.transactionType).toBe("REFUND");
    const refundSum = refundTx!.entries.reduce((sum, e) => sum + e.amountCredits, 0);
    expect(refundSum).toBe(0); // Zero-sum balance
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
