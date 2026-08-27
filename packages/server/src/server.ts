import { Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { InMemoryDatabase } from "./adapters/in-memory-db";
import { PostgresDatabase } from "./adapters/postgres-real";
import { LedgerDatabase } from "./adapters/database";
import { LedgerService } from "./services/ledger.service";
import { AuthService } from "./services/auth.service";
import { ResendEmailTransport } from "./services/email-transport";
import { DeveloperService } from "./services/developer.service";
import { CorsPolicyService } from "./services/cors-policy";
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
import { createCheckoutRoutes } from "./routes/checkout.routes";

// Demo-only fallbacks, used ONLY when the matching env var is not set.
// Production deployments always provide real values via .env / platform env.
const DEMO_JWT_SECRET = "demo-secret-key-32-chars-long-example!";
const DEMO_WEBHOOK_SECRET = "whsec_demo_secret_123";

/**
 * Per-project CORS guard for browser-facing routes. Replaces the previous
 * blanket `cors("*")`: the Origin header is validated against the resolved
 * project's allowedDomains, and disallowed origins get a 403. Requests without
 * an Origin header (server-to-server) are always allowed.
 *
 * projectId resolution: the `x-project-id` header wins when present; otherwise
 * the origin is allowed if ANY registered project lists it (the SDK sends
 * projectId only in the request body, and the dashboard authenticates with a
 * secret key). For allowed origins the hono `cors` middleware still runs, so
 * OPTIONS preflights and CORS response headers keep working.
 *
 * Trade-off: because the projectId is resolved per request, a preflight OPTIONS
 * cannot always know the target project (the browser does not send the
 * x-project-id header on preflights) — it relies on the any-project fallback.
 */
function browserCorsGuard(policy: CorsPolicyService): MiddlewareHandler {
  return async (c, next) => {
    const origin = c.req.header("Origin");

    // Server-to-server / non-browser requests are always allowed.
    if (!origin) {
      return next();
    }

    const projectId = c.req.header("x-project-id");
    const allowed = projectId
      ? policy.isOriginAllowed(origin, projectId)
      : policy.isOriginAllowedByAnyProject(origin);

    if (!allowed) {
      return c.json({ error: "Origin not allowed for this project" }, 403);
    }

    // Keep preflight handling and CORS header injection for the allowed origin.
    return cors({
      origin: () => origin,
      allowHeaders: ["*"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    })(c, next);
  };
}

export async function createPlatformApp(options?: { forceMock?: boolean }) {
  // Database: PostgreSQL (Supabase) when DATABASE_URL is set, in-memory demo otherwise.
  const databaseUrl = process.env.DATABASE_URL;
  const db: LedgerDatabase = databaseUrl
    ? new PostgresDatabase({ url: databaseUrl })
    : new InMemoryDatabase();
  await db.init();

  const jwtSecret = process.env.JWT_SECRET || DEMO_JWT_SECRET;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || DEMO_WEBHOOK_SECRET;

  const ledger = new LedgerService(db);
  const authService = new AuthService(db, jwtSecret, new ResendEmailTransport());
  const devService = new DeveloperService(db);
  const corsPolicy = new CorsPolicyService(devService);
  const runService = new ActionRunService(db);
  const rateLimiter = new SlidingWindowRateLimiter();
  const stripeService = new StripeBillingService(db, webhookSecret);
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

  // Pre-seed demo project (idempotent; real projects are registered via the API)
  devService.registerProject({
    projectId: "proj_demo",
    name: "AI Resume Optimizer Demo",
    publicKey: process.env.DEMO_PUBLIC_KEY || "pk_live_demo123",
    secretKey: process.env.DEMO_SECRET_KEY || "sk_live_demo_secret_456",
    allowedDomains: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176"
    ]
  });

  // Pre-publish demo action version 1
  devService.publishActionVersion("proj_demo", {
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

  // Pre-seed dev_playground wallet for developer testing (only if not present,
  // so a persisted balance survives gateway restarts)
  if (!db.wallets.has("dev_playground")) {
    db.seedWallet("dev_playground", 1000);
  }

  const actionExecutionService = new ActionExecutionService(
    ledger,
    modelProvider,
    devService,
    runService,
    rateLimiter
  );

  const app = new Hono();

  // Middleware
  // Per-project CORS for browser-facing routes (actions, wallet, checkout,
  // auth OTP, developer dashboard) instead of the former blanket cors("*").
  const browserCors = browserCorsGuard(corsPolicy);
  app.use("/v1/actions/*", browserCors);
  app.use("/v1/wallet/*", browserCors);
  app.use("/v1/stripe/checkout/*", browserCors);
  app.use("/v1/auth/*", browserCors);
  app.use("/v1/developer/*", browserCors);
  app.use("*", correlationMiddleware());

  // Mount API routes
  app.route("/v1/auth", createAuthRoutes(authService));
  app.route("/v1/actions", createActionRoutes(actionExecutionService, authService));
  app.route("/v1/wallet", createWalletRoutes(ledger, authService));
  app.route("/v1/developer", createDeveloperRoutes(devService, runService, actionExecutionService));
  app.route("/v1/stripe", createStripeRoutes(stripeService));
  app.route("/v1/stripe/checkout", createCheckoutRoutes(stripeService, authService));

  // Health check & info
  app.get("/", (c) => c.json({
    status: "ok",
    service: "AI Payment Gateway & Managed Actions Engine",
    version: "1.0.0",
    database: databaseUrl ? "postgres" : "in-memory",
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
  const { app } = await createPlatformApp();
  console.log(`\n[Server] AI Payment Platform Gateway running at http://localhost:${port}`);
  console.log(`   - Database: ${process.env.DATABASE_URL ? "PostgreSQL (Supabase)" : "in-memory (demo)"}`);
  console.log(`   - Model provider: ${process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY ? "real (OpenAI/Gemini)" : "mock (set OPENAI_API_KEY or GEMINI_API_KEY)"}`);
  console.log(`   - Public Key:  ${process.env.DEMO_PUBLIC_KEY || "pk_live_demo123"}`);
  console.log(`   - Secret Key:  ${process.env.DEMO_SECRET_KEY || "sk_live_demo_secret_456"}`);
  console.log(`   - Demo Action: optimize-resume (15 credits)\n`);

  Bun.serve({
    fetch: app.fetch,
    port
  });
}
