import { Hono } from "hono";
import { cors } from "hono/cors";
import { InMemoryDatabase } from "./adapters/in-memory-db";
import { LedgerService } from "./services/ledger.service";
import { AuthService } from "./services/auth.service";
import { DeveloperService } from "./services/developer.service";
import { ActionRunService } from "./services/run.service";
import { SlidingWindowRateLimiter } from "./services/rate-limiter";
import { ActionExecutionService } from "./services/action.service";
import { StripeBillingService } from "./services/stripe.service";
import { MockModelProvider } from "./adapters/model-provider";
import { OpenAIAdapter } from "./adapters/openai-provider";
import { GeminiAdapter } from "./adapters/gemini-provider";
import { correlationMiddleware } from "./observability/correlation";
import { PlatformLogger } from "./observability/logger";
import { createAuthRoutes } from "./routes/auth.routes";
import { createActionRoutes } from "./routes/actions.routes";
import { createWalletRoutes } from "./routes/wallet.routes";
import { createDeveloperRoutes } from "./routes/developer.routes";
import { createStripeRoutes } from "./routes/stripe.routes";

export function createPlatformApp(options?: { forceMock?: boolean }) {
  const db = new InMemoryDatabase();
  const ledger = new LedgerService(db);
  const authService = new AuthService(db, "demo-secret-key-32-chars-long-example!");
  const devService = new DeveloperService(db);
  const runService = new ActionRunService(db);
  const rateLimiter = new SlidingWindowRateLimiter();
  const stripeService = new StripeBillingService(db, "whsec_demo_secret_123");
  const logger = new PlatformLogger();

  // Model provider: use real OpenAI/Gemini if API key exists and not forceMock, otherwise smart mock provider
  let modelProvider = new MockModelProvider();
  if (!options?.forceMock && process.env.OPENAI_API_KEY) {
    modelProvider = new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY }) as any;
    logger.info("Using real OpenAIAdapter with OPENAI_API_KEY");
  } else if (!options?.forceMock && process.env.GEMINI_API_KEY) {
    modelProvider = new GeminiAdapter({ apiKey: process.env.GEMINI_API_KEY }) as any;
    logger.info("Using real GeminiAdapter with GEMINI_API_KEY");
  } else {
    modelProvider.setResponse(JSON.stringify({
      rating: 9.4,
      strengths: [
        "Strong focus on measurable business outcomes and revenue impact",
        "Clear demonstration of technical leadership in high-scale systems",
        "Concise, metric-oriented bullet points throughout work experience"
      ],
      recommendations: [
        "Add specific latency/throughput figures to the distributed systems section",
        "Highlight experience with cloud-native deployment and observability stacks"
      ],
      optimizedSummary: "Staff Distributed Systems Engineer with 8+ years designing zero-trust financial platforms, high-throughput microservices, and AI gateways. Proven track record scaling workloads to 100k+ req/s with 99.999% availability."
    }));
  }

  // Pre-seed demo project
  devService.registerProject({
    projectId: "proj_demo",
    name: "AI Resume Optimizer Demo",
    publicKey: "pk_live_demo123",
    secretKey: "sk_live_demo_secret_456"
  });

  // Pre-publish demo action version 1
  const demoAction = devService.publishActionVersion("proj_demo", {
    actionName: "optimize-resume",
    model: process.env.OPENAI_API_KEY ? "gpt-4o-mini" : "mock-model",
    priceCredits: 15,
    maxProviderCostCents: 5,
    maxOutputTokens: 800,
    outputFormat: "json",
    systemPrompt: "You are an elite executive technical recruiter. Analyze the candidate's CV and return a structured JSON evaluation.",
    userPromptTemplate: "Candidate CV:\n{{cvText}}",
    rateLimit: { maxRequests: 5, windowSeconds: 60 }
  });

  // Pre-seed dev_playground wallet for developer testing
  db.wallets.set("dev_playground", {
    userId: "dev_playground",
    availableCredits: 1000,
    reservedCredits: 0
  });

  const actionExecutionService = new ActionExecutionService(
    ledger,
    modelProvider,
    devService,
    runService,
    rateLimiter
  );

  const app = new Hono();

  // Middleware
  app.use("*", cors({
    origin: "*",
    allowHeaders: ["*"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }));
  app.use("*", correlationMiddleware());

  // Mount API routes
  app.route("/v1/auth", createAuthRoutes(authService));
  app.route("/v1/actions", createActionRoutes(actionExecutionService, authService));
  app.route("/v1/wallet", createWalletRoutes(ledger, authService));
  app.route("/v1/developer", createDeveloperRoutes(devService, runService, actionExecutionService));
  app.route("/v1/stripe", createStripeRoutes(stripeService));

  // Health check & info
  app.get("/", (c) => c.json({
    status: "ok",
    service: "AI Payment Gateway & Managed Actions Engine",
    version: "1.0.0",
    endpoints: {
      auth: "/v1/auth/token",
      actions: "/v1/actions/:name/execute",
      wallet: "/v1/wallet",
      developer: "/v1/developer/actions",
      stripe: "/v1/stripe/webhook"
    }
  }));

  return { app, db, ledger, authService, devService, actionExecutionService, stripeService };
}

// Standalone entrypoint when executed directly with bun
if (import.meta.main) {
  const port = Number(process.env.PORT || 3000);
  const { app } = createPlatformApp();
  console.log(`\n[Server] AI Payment Platform Gateway running at http://localhost:${port}`);
  console.log(`   - Public Key:  pk_live_demo123`);
  console.log(`   - Secret Key:  sk_live_demo_secret_456`);
  console.log(`   - Demo Action: optimize-resume (15 credits)\n`);

  Bun.serve({
    fetch: app.fetch,
    port
  });
}
