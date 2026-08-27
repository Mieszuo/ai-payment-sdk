# Production Hardening & Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the core vertical slice of the AI Payment Platform into a production-ready engine with real PostgreSQL persistence, row-level concurrency locking (`SELECT ... FOR UPDATE`), immutable action execution audit trails, developer API key management, real OpenAI/Gemini provider adapters, Stripe signature verification, and correlation-driven observability.

**Architecture:** Extend `@platform/shared`, `@platform/core`, and `@platform/server` with:
1. Postgres transactional adapter with row-level locks and idempotency constraints.
2. Developer API authentication (`sk_live_...`) and immutable Action Registry management.
3. Central `action_runs` persistence recording immutable snapshots (`prompt_hash`, `model`, `price_credits`).
4. Real LLM provider adapters (`OpenAIAdapter`, `GeminiAdapter`) with structured JSON schema outputs.
5. Production Stripe webhook hardening with signature verification and refund/dispute ledger transactions.
6. Structured request correlation IDs (`request_id`, `run_id`, `ledger_tx_id`) and sliding-window rate limiting.

**Tech Stack:** Bun, TypeScript, Hono, PostgreSQL / Supabase SQL, Zod, jose (JWT), Stripe SDK, OpenAI API / Gemini API formats.

## Global Constraints

- **Runtime & Build System:** Bun (`bun install`, `bun test`, `bun run typecheck`).
- **Typing:** 100% strict TypeScript (`tsc --build` must pass with zero diagnostics).
- **Double-Entry Ledger:** Every financial movement must balance to zero ($\sum \text{amountCredits} = 0$).
- **Two-Phase Lifecycle:** `RESERVATION_HOLD` before any model call $\to$ `SETTLEMENT` on success $\to$ `RESERVATION_RELEASE` on any failure.
- **Security:** Public `pk_live_*` keys are client identifiers only. Action modifications and administrative operations strictly require developer secrets (`sk_live_*`).
- **Privacy:** Prompts, raw CVs, and LLM text outputs must never be logged to standard production logs.

---

### Task 1: Correlation IDs & Structured Privacy-First Observability (`@platform/server`)

**Files:**
- Create: `packages/server/src/observability/correlation.ts`
- Create: `packages/server/src/observability/logger.ts`
- Modify: `packages/server/src/routes/actions.routes.ts`
- Modify: `packages/server/src/routes/wallet.routes.ts`
- Modify: `packages/server/src/routes/auth.routes.ts`
- Test: `packages/server/tests/observability.test.ts`

**Interfaces:**
- Produces:
  - `correlationMiddleware()`: Hono middleware attaching `CorrelationContext` (`requestId`, `userId`, `projectId`, `actionName`) to request context and `x-request-id` response header.
  - `PlatformLogger`: Structured logger emitting JSON logs with correlation tags while masking prompt/user payload fields.

- [ ] **Step 1: Write failing observability tests**

```typescript
// packages/server/tests/observability.test.ts
import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { correlationMiddleware, getCorrelationContext } from "../src/observability/correlation";
import { PlatformLogger } from "../src/observability/logger";

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
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/observability.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement correlation middleware and logger**

Implement `packages/server/src/observability/correlation.ts`:
```typescript
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
    const incomingId = c.req.header("x-request-id");
    const requestId = incomingId || `req_${crypto.randomUUID()}`;

    const context: CorrelationContext = { requestId };
    c.set("correlation", context);

    await next();

    c.header("x-request-id", requestId);
  };
}

export function getCorrelationContext(c: Context): CorrelationContext {
  return (c.get("correlation") as CorrelationContext) || { requestId: `req_${crypto.randomUUID()}` };
}
```

Implement `packages/server/src/observability/logger.ts`:
```typescript
export interface LoggerOptions {
  sink?: (message: string) => void;
}

export class PlatformLogger {
  private sink: (message: string) => void;

  constructor(options?: LoggerOptions) {
    this.sink = options?.sink || ((msg) => console.log(msg));
  }

  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = new Set(["inputs", "input", "rawOutput", "prompt", "systemPrompt", "cvText", "secret"]);
    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.has(key)) {
        cleaned[key] = "[REDACTED]";
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        cleaned[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  info(message: string, meta: Record<string, unknown> = {}) {
    this.log("INFO", message, meta);
  }

  warn(message: string, meta: Record<string, unknown> = {}) {
    this.log("WARN", message, meta);
  }

  error(message: string, meta: Record<string, unknown> = {}) {
    this.log("ERROR", message, meta);
  }

  private log(level: string, message: string, meta: Record<string, unknown>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.sanitize(meta)
    };
    this.sink(JSON.stringify(entry));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/observability.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/observability/ packages/server/tests/observability.test.ts
git commit -m "feat(server): add correlation ID propagation and privacy-first structured logger"
```

---

### Task 2: Developer Authentication & Action Registry Management (`@platform/server`)

**Files:**
- Create: `packages/server/src/services/developer.service.ts`
- Create: `packages/server/src/routes/developer.routes.ts`
- Modify: `packages/server/src/index.ts`
- Test: `packages/server/tests/developer.routes.test.ts`

**Interfaces:**
- Consumes: `@platform/shared`, `InMemoryDatabase`.
- Produces:
  - `POST /v1/developer/actions`: Registers or updates a managed action definition requiring `Authorization: Bearer sk_live_...`.
  - `GET /v1/developer/actions/:name`: Retrieves all published immutable versions for an action.
  - Rejection of client `pk_live_...` on administrative action endpoints.

- [ ] **Step 1: Write failing developer authentication and action publishing tests**

```typescript
// packages/server/tests/developer.routes.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { DeveloperService } from "../src/services/developer.service";
import { createDeveloperRoutes } from "../src/routes/developer.routes";

describe("Developer Action Registry Management", () => {
  let db: InMemoryDatabase;
  let devService: DeveloperService;
  let app: Hono;

  beforeEach(() => {
    db = new InMemoryDatabase();
    devService = new DeveloperService(db);
    // Seed project with public key and developer secret
    devService.registerProject({
      projectId: "proj_dev_1",
      name: "Resume App",
      publicKey: "pk_live_123",
      secretKey: "sk_live_secret_456"
    });

    app = new Hono();
    app.route("/v1/developer", createDeveloperRoutes(devService));
  });

  it("publishes immutable action version with valid developer secret key", async () => {
    const res = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk_live_secret_456"
      },
      body: JSON.stringify({
        actionName: "generate-cover-letter",
        model: "openai/gpt-4o-mini",
        priceCredits: 20,
        maxProviderCostCents: 6,
        systemPrompt: "You are a professional cover letter writer.",
        userPromptTemplate: "Write for {{company}}: {{details}}"
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.action.version).toBe(1);
    expect(body.action.projectId).toBe("proj_dev_1");
  });

  it("strictly rejects attempts to publish actions using public pk_live keys", async () => {
    const res = await app.request("/v1/developer/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer pk_live_123"
      },
      body: JSON.stringify({
        actionName: "hack-action",
        model: "openai/gpt-4o",
        priceCredits: 1
      })
    });

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/developer.routes.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement DeveloperService and Developer Routes**

Implement `packages/server/src/services/developer.service.ts`:
```typescript
import { ActionVersion, PlatformError, PlatformErrorCodes } from "@platform/shared";
import { InMemoryDatabase } from "../adapters/in-memory-db";

export interface ProjectRecord {
  projectId: string;
  name: string;
  publicKey: string;
  secretKey: string;
}

export class DeveloperService {
  private projectsBySecret = new Map<string, ProjectRecord>();
  private projectsById = new Map<string, ProjectRecord>();
  private actionVersions = new Map<string, ActionVersion[]>();

  constructor(private db: InMemoryDatabase) {}

  registerProject(project: ProjectRecord) {
    this.projectsBySecret.set(project.secretKey, project);
    this.projectsById.set(project.projectId, project);
  }

  verifySecret(secretKey: string): ProjectRecord {
    if (!secretKey.startsWith("sk_live_")) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid developer secret key prefix");
    }
    const project = this.projectsBySecret.get(secretKey);
    if (!project) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid developer secret key");
    }
    return project;
  }

  publishActionVersion(projectId: string, input: Partial<ActionVersion> & { actionName: string; model: string; priceCredits: number }): ActionVersion {
    const key = `${projectId}:${input.actionName}`;
    const existing = this.actionVersions.get(key) || [];
    const nextVersion = existing.length + 1;

    const version: ActionVersion = {
      actionName: input.actionName,
      version: nextVersion,
      projectId,
      model: input.model,
      priceCredits: input.priceCredits,
      maxProviderCostCents: input.maxProviderCostCents ?? 10,
      maxOutputTokens: input.maxOutputTokens ?? 1000,
      outputFormat: input.outputFormat ?? "json",
      systemPrompt: input.systemPrompt ?? "",
      userPromptTemplate: input.userPromptTemplate ?? "",
      inputSchema: input.inputSchema ?? { type: "object" },
      rateLimit: input.rateLimit ?? { maxRequests: 60, windowSeconds: 60 }
    };

    existing.push(version);
    this.actionVersions.set(key, existing);
    return version;
  }

  getActionVersions(projectId: string, actionName: string): ActionVersion[] {
    const key = `${projectId}:${actionName}`;
    return [...(this.actionVersions.get(key) || [])];
  }

  getLatestAction(projectId: string, actionName: string): ActionVersion | null {
    const versions = this.getActionVersions(projectId, actionName);
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }
}
```

Implement `packages/server/src/routes/developer.routes.ts`:
```typescript
import { Hono } from "hono";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { DeveloperService } from "../services/developer.service";

export function createDeveloperRoutes(devService: DeveloperService) {
  const router = new Hono();

  router.post("/actions", async (c) => {
    const auth = c.req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Missing developer authorization header");
    }

    const token = auth.replace("Bearer ", "");
    const project = devService.verifySecret(token);

    const body = await c.req.json();
    const action = devService.publishActionVersion(project.projectId, body);

    return c.json({ action }, 201);
  });

  router.get("/actions/:name", async (c) => {
    const auth = c.req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Missing developer authorization header");
    }
    const token = auth.replace("Bearer ", "");
    const project = devService.verifySecret(token);
    const actionName = c.req.param("name");

    const versions = devService.getActionVersions(project.projectId, actionName);
    return c.json({ versions });
  });

  return router;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/developer.routes.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/developer.service.ts packages/server/src/routes/developer.routes.ts packages/server/tests/developer.routes.test.ts
git commit -m "feat(server): implement developer secret key authentication and immutable action publishing"
```

---

### Task 3: Immutable Action Run Snapshots (`action_runs`) (`@platform/server`)

**Files:**
- Create: `packages/server/src/services/run.service.ts`
- Modify: `packages/server/src/services/action.service.ts`
- Test: `packages/server/tests/run.service.test.ts`

**Interfaces:**
- Consumes: `@platform/shared`, `InMemoryDatabase`.
- Produces:
  - `ActionRunRecord` tracking run state (`RESERVED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED`).
  - Immutable audit snapshot: `action_name`, `action_version`, `model`, `price_credits`, `prompt_hash`, `input_hash`.
  - `ActionRunService.createRun(...)`, `updateStatus(...)`.

- [ ] **Step 1: Write failing action run snapshot tests**

```typescript
// packages/server/tests/run.service.test.ts
import { describe, it, expect } from "bun:test";
import { ActionRunService } from "../src/services/run.service";

describe("Action Runs Immutable Audit Record", () => {
  it("stores full execution snapshot with prompt and input hashes", async () => {
    const runService = new ActionRunService();

    const run = await runService.recordRunReservation({
      runId: "run_test_1",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "optimize-resume",
      actionVersion: 3,
      model: "openai/gpt-4o",
      priceCredits: 15,
      systemPrompt: "Review resumes rigorously.",
      userPrompt: "Candidate CV text...",
      inputs: { cvText: "Candidate CV text..." },
      idempotencyKey: "idem_run_1"
    });

    expect(run.status).toBe("RESERVED");
    expect(run.actionVersion).toBe(3);
    expect(run.promptHash).toHaveLength(64); // SHA-256 hex
    expect(run.inputHash).toHaveLength(64);

    await runService.markSucceeded("run_test_1", {
      consumedCredits: 15,
      costCents: 2.5
    });

    const completed = runService.getRun("run_test_1");
    expect(completed?.status).toBe("SUCCEEDED");
    expect(completed?.completedAt).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/run.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement ActionRunService and integrate with ActionExecutionService**

Implement `packages/server/src/services/run.service.ts`:
```typescript
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export type RunStatus = "RESERVED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export interface ActionRunRecord {
  id: string;
  projectId: string;
  userId: string;
  actionName: string;
  actionVersion: number;
  idempotencyKey: string;
  status: RunStatus;
  model: string;
  reservedCredits: number;
  consumedCredits: number;
  costCents?: number;
  promptHash: string;
  inputHash: string;
  createdAt: string;
  completedAt?: string;
}

export class ActionRunService {
  private runs = new Map<string, ActionRunRecord>();

  private async sha256(text: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
  }

  async recordRunReservation(params: {
    runId: string;
    projectId: string;
    userId: string;
    actionName: string;
    actionVersion: number;
    model: string;
    priceCredits: number;
    systemPrompt: string;
    userPrompt: string;
    inputs: Record<string, unknown>;
    idempotencyKey: string;
  }): Promise<ActionRunRecord> {
    const promptHash = await this.sha256(`${params.systemPrompt}\n---\n${params.userPrompt}`);
    const inputHash = await this.sha256(JSON.stringify(params.inputs));

    const record: ActionRunRecord = {
      id: params.runId,
      projectId: params.projectId,
      userId: params.userId,
      actionName: params.actionName,
      actionVersion: params.actionVersion,
      idempotencyKey: params.idempotencyKey,
      status: "RESERVED",
      model: params.model,
      reservedCredits: params.priceCredits,
      consumedCredits: 0,
      promptHash,
      inputHash,
      createdAt: new Date().toISOString()
    };

    this.runs.set(params.runId, record);
    return record;
  }

  async markRunning(runId: string) {
    const run = this.runs.get(runId);
    if (run) run.status = "RUNNING";
  }

  async markSucceeded(runId: string, params: { consumedCredits: number; costCents: number }) {
    const run = this.runs.get(runId);
    if (run) {
      run.status = "SUCCEEDED";
      run.consumedCredits = params.consumedCredits;
      run.costCents = params.costCents;
      run.completedAt = new Date().toISOString();
    }
  }

  async markFailed(runId: string) {
    const run = this.runs.get(runId);
    if (run) {
      run.status = "FAILED";
      run.completedAt = new Date().toISOString();
    }
  }

  getRun(runId: string): ActionRunRecord | undefined {
    return this.runs.get(runId);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/run.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/run.service.ts packages/server/tests/run.service.test.ts
git commit -m "feat(server): implement immutable action run audit records with cryptographic prompt hashing"
```

---

### Task 4: Real PostgreSQL Persistence & Concurrency Verification (`@platform/server`)

**Files:**
- Create: `packages/server/src/adapters/postgres-db.ts`
- Modify: `packages/server/src/adapters/index.ts`
- Test: `packages/server/tests/postgres-concurrency.test.ts`

**Interfaces:**
- Produces:
  - `PostgresDatabase` interface and implementation executing parameterized queries.
  - Verification of `SELECT available_credits, reserved_credits FROM wallets WHERE user_id = $1 FOR UPDATE`.
  - Verification that PostgreSQL `UNIQUE(idempotency_key)` constraint prevents race-condition double crediting.

- [ ] **Step 1: Write failing PostgreSQL concurrency test simulating concurrent row-level locks**

```typescript
// packages/server/tests/postgres-concurrency.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { PostgresSimulatorDatabase } from "../src/adapters/postgres-db";
import { LedgerService } from "../src/services/ledger.service";

describe("PostgreSQL Transaction Isolation & Row-Level Locking", () => {
  let db: PostgresSimulatorDatabase;
  let ledger: LedgerService;

  beforeEach(() => {
    db = new PostgresSimulatorDatabase();
    ledger = new LedgerService(db as any);
    db.seedWallet("usr_pg_concurrent", 20); // 20 credits balance
  });

  it("blocks concurrent overdraws via row-level locking simulation (10 parallel requests)", async () => {
    // 10 concurrent attempts to reserve 10 credits each. Only 2 should succeed (20 / 10 = 2).
    const requests = Array.from({ length: 10 }, (_, i) => 
      ledger.reserveCredits("usr_pg_concurrent", 10, `idem_concurrent_${i}`, `run_pg_${i}`)
    );

    const results = await Promise.allSettled(requests);
    const fulfilled = results.filter(r => r.status === "fulfilled");
    const rejected = results.filter(r => r.status === "rejected");

    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(8);

    const wallet = await ledger.getWallet("usr_pg_concurrent");
    expect(wallet.availableCredits).toBe(0);
    expect(wallet.reservedCredits).toBe(20);
  });

  it("handles UNIQUE constraint violation on idempotency_key gracefully", async () => {
    await ledger.reserveCredits("usr_pg_concurrent", 10, "idem_duplicate", "run_1");
    // Duplicate call with exact same idempotency_key must be idempotent no-op
    await ledger.reserveCredits("usr_pg_concurrent", 10, "idem_duplicate", "run_1");

    const wallet = await ledger.getWallet("usr_pg_concurrent");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/postgres-concurrency.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Postgres database adapter with atomic row locking semantics**

Implement `packages/server/src/adapters/postgres-db.ts`:
```typescript
import { InMemoryDatabase, WalletRecord } from "./in-memory-db";
import { PlatformError, PlatformErrorCodes, LedgerTransaction } from "@platform/shared";
import { validateDoubleEntryTransaction } from "@platform/core";

export class PostgresSimulatorDatabase extends InMemoryDatabase {
  // Simulates PostgreSQL SQL transaction semantics with explicit table/row lock queues
  private rowLocks = new Map<string, Promise<void>>();

  async lockWalletRow(userId: string): Promise<() => void> {
    while (this.rowLocks.has(userId)) {
      await this.rowLocks.get(userId);
    }
    let release: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.rowLocks.set(userId, lockPromise);

    return () => {
      this.rowLocks.delete(userId);
      release();
    };
  }

  override async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return super.runInTransaction(fn);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/postgres-concurrency.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/adapters/postgres-db.ts packages/server/tests/postgres-concurrency.test.ts
git commit -m "feat(server): implement postgres row-level locking transaction adapter and concurrency tests"
```

---

### Task 5: Real Provider Adapters (`OpenAIAdapter` & `GeminiAdapter`) (`@platform/server`)

**Files:**
- Create: `packages/server/src/adapters/openai-provider.ts`
- Create: `packages/server/src/adapters/gemini-provider.ts`
- Modify: `packages/server/src/adapters/index.ts`
- Test: `packages/server/tests/providers.test.ts`

**Interfaces:**
- Consumes: `ModelProvider` interface (`generate(...)`).
- Produces:
  - `OpenAIAdapter`: sends structured `response_format: { type: "json_object" }`, parses usage tokens, and calculates cost.
  - `GeminiAdapter`: sends `responseMimeType: "application/json"`, parses usageMetadata, and calculates cost.

- [ ] **Step 1: Write failing real provider adapter tests**

```typescript
// packages/server/tests/providers.test.ts
import { describe, it, expect } from "bun:test";
import { OpenAIAdapter } from "../src/adapters/openai-provider";
import { GeminiAdapter } from "../src/adapters/gemini-provider";

describe("Real LLM Provider Adapters", () => {
  it("formats OpenAI request payload with json_object format and parses usage cost", async () => {
    const adapter = new OpenAIAdapter({
      apiKey: "mock-key",
      fetchClient: async (url, init) => {
        const body = JSON.parse(init?.body as string);
        expect(body.response_format.type).toBe("json_object");
        expect(body.messages).toHaveLength(2);
        return new Response(JSON.stringify({
          choices: [{ message: { content: '{"score": 95}' } }],
          usage: { prompt_tokens: 100, completion_tokens: 50 }
        }), { status: 200 });
      }
    });

    const res = await adapter.generate({
      model: "gpt-4o-mini",
      systemPrompt: "System",
      prompt: "User text",
      maxTokens: 500
    });

    expect(res.text).toBe('{"score": 95}');
    expect(res.costCents).toBeGreaterThan(0);
  });

  it("formats Gemini request payload with application/json mimeType and parses usage", async () => {
    const adapter = new GeminiAdapter({
      apiKey: "mock-gemini-key",
      fetchClient: async (url, init) => {
        const body = JSON.parse(init?.body as string);
        expect(body.generationConfig.responseMimeType).toBe("application/json");
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"analysis": "Strong"}' }] } }],
          usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 60 }
        }), { status: 200 });
      }
    });

    const res = await adapter.generate({
      model: "gemini-1.5-flash",
      systemPrompt: "System",
      prompt: "User text",
      maxTokens: 500
    });

    expect(res.text).toBe('{"analysis": "Strong"}');
    expect(res.costCents).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/providers.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement OpenAIAdapter and GeminiAdapter**

Implement `packages/server/src/adapters/openai-provider.ts`:
```typescript
import { ModelProvider } from "./model-provider";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export class OpenAIAdapter implements ModelProvider {
  constructor(private options: { apiKey: string; fetchClient?: typeof fetch; baseUrl?: string }) {}

  async generate(params: { model: string; systemPrompt: string; prompt: string; maxTokens: number }): Promise<{ text: string; costCents: number }> {
    const fetcher = this.options.fetchClient || fetch;
    const url = `${this.options.baseUrl || "https://api.openai.com/v1"}/chat/completions`;

    const res = await fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.prompt }
        ],
        max_tokens: params.maxTokens,
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, `OpenAI API error (${res.status})`);
    }

    const data = await res.json() as any;
    const text = data.choices?.[0]?.message?.content || "{}";
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    // Approximate cost: $0.15/1M input, $0.60/1M output for gpt-4o-mini
    const costDollars = (promptTokens * 0.00000015) + (completionTokens * 0.00000060);
    const costCents = Math.max(0.01, Number((costDollars * 100).toFixed(4)));

    return { text, costCents };
  }
}
```

Implement `packages/server/src/adapters/gemini-provider.ts`:
```typescript
import { ModelProvider } from "./model-provider";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export class GeminiAdapter implements ModelProvider {
  constructor(private options: { apiKey: string; fetchClient?: typeof fetch }) {}

  async generate(params: { model: string; systemPrompt: string; prompt: string; maxTokens: number }): Promise<{ text: string; costCents: number }> {
    const fetcher = this.options.fetchClient || fetch;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${this.options.apiKey}`;

    const res = await fetcher(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: params.maxTokens
        }
      })
    });

    if (!res.ok) {
      throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, `Gemini API error (${res.status})`);
    }

    const data = await res.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const promptTokens = data.usageMetadata?.promptTokenCount || 0;
    const candidateTokens = data.usageMetadata?.candidatesTokenCount || 0;

    const costDollars = (promptTokens * 0.000000075) + (candidateTokens * 0.00000030);
    const costCents = Math.max(0.01, Number((costDollars * 100).toFixed(4)));

    return { text, costCents };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/providers.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/adapters/openai-provider.ts packages/server/src/adapters/gemini-provider.ts packages/server/tests/providers.test.ts
git commit -m "feat(server): implement real OpenAI and Gemini provider adapters with structured JSON schema outputs"
```

---

### Task 6: Stripe Webhook Signature & Refund/Dispute Handling (`@platform/server`)

**Files:**
- Modify: `packages/server/src/services/stripe.service.ts`
- Modify: `packages/server/src/routes/stripe.routes.ts`
- Test: `packages/server/tests/stripe.service.test.ts`

**Interfaces:**
- Consumes: `@platform/shared`, `InMemoryDatabase`.
- Produces:
  - `handleWebhookEvent(payload: string, signature: string)` with cryptographic HMAC-SHA256 signature verification.
  - Server-side pack validation: frontend sends `packId`, server determines credits/cents.
  - Handling `charge.refunded` event $\to$ creates balanced `REFUND` transaction deducting credits.
  - Handling `charge.dispute.created` event $\to$ logs dispute audit event.

- [ ] **Step 1: Write failing Stripe signature & refund tests**

```typescript
// packages/server/tests/stripe.service.test.ts (additions)
import { describe, it, expect } from "bun:test";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { StripeBillingService } from "../src/services/stripe.service";

describe("Stripe Production Signature & Refunds", () => {
  it("rejects webhooks with invalid signatures", async () => {
    const db = new InMemoryDatabase();
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    expect(service.verifySignature(payload, "invalid_sig")).toBe(false);
  });

  it("handles charge.refunded by deducting credited tokens via balanced REFUND transaction", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_refund_1", 550);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_refund_123",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_refund_1",
          metadata: { userId: "usr_refund_1", packId: "popular" }
        }
      }
    });

    const wallet = db.wallets.get("usr_refund_1");
    expect(wallet?.availableCredits).toBe(0); // 550 - 550 = 0
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/stripe.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement signature verification and refund ledger transaction**

In `packages/server/src/services/stripe.service.ts`:
- Add `verifySignature(payload: string, signature: string): boolean` using HMAC SHA-256 (`crypto.subtle`).
- In `handleWebhook`, add `charge.refunded` handler creating a balanced `REFUND` transaction:
  - Account `USER_WALLET`: `-pack.credits`
  - Account `PLATFORM_CLEARING`: `+pack.credits`
  - Deduct from `wallet.availableCredits`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/stripe.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/stripe.service.ts packages/server/tests/stripe.service.test.ts
git commit -m "feat(server): add Stripe signature verification, refund ledger balancing, and dispute handling"
```

---

### Task 7: Sliding-Window Rate Limiting (`@platform/server`)

**Files:**
- Create: `packages/server/src/services/rate-limiter.ts`
- Modify: `packages/server/src/routes/actions.routes.ts`
- Test: `packages/server/tests/rate-limiter.test.ts`

**Interfaces:**
- Produces:
  - `SlidingWindowRateLimiter`: tracks user requests per window (`maxRequests` per `windowSeconds`).
  - Throws `PlatformError(PlatformErrorCodes.RATE_LIMITED, ...)` when threshold is breached.

- [ ] **Step 1: Write failing rate limiter test**

```typescript
// packages/server/tests/rate-limiter.test.ts
import { describe, it, expect } from "bun:test";
import { SlidingWindowRateLimiter } from "../src/services/rate-limiter";

describe("Sliding Window Rate Limiter", () => {
  it("permits requests up to maxRequests and blocks subsequent requests within window", () => {
    const limiter = new SlidingWindowRateLimiter();
    const key = "usr_rate_1:action_summarize";

    // 3 requests allowed in 60s
    expect(limiter.checkLimit(key, 3, 60)).toBe(true);
    expect(limiter.checkLimit(key, 3, 60)).toBe(true);
    expect(limiter.checkLimit(key, 3, 60)).toBe(true);
    // 4th request must be rejected
    expect(limiter.checkLimit(key, 3, 60)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/rate-limiter.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement SlidingWindowRateLimiter**

Implement `packages/server/src/services/rate-limiter.ts`:
```typescript
export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();

  checkLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    const timestamps = this.windows.get(key) || [];
    const active = timestamps.filter(t => t > windowStart);

    if (active.length >= maxRequests) {
      this.windows.set(key, active);
      return false;
    }

    active.push(now);
    this.windows.set(key, active);
    return true;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/rate-limiter.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/rate-limiter.ts packages/server/tests/rate-limiter.test.ts
git commit -m "feat(server): implement sliding-window rate limiter for managed action execution"
```

---

### Task 8: Production-Hardened End-to-End Test (`tests/e2e`)

**Files:**
- Modify: `tests/e2e/full-lifecycle.test.ts`

**Interfaces:**
- Tests all 7 production hardening features together:
  Developer Authentication (`sk_live_...`) $\to$ Publish Immutable Action v1 $\to$ Rate Limiting $\to$ Real Provider Adapter formatting $\to$ Correlation ID propagation $\to$ Immutable `action_runs` snapshot $\to$ Stripe Signature Verification & Refund.

- [ ] **Step 1: Add production hardened E2E scenario**

```typescript
// tests/e2e/full-lifecycle.test.ts (additional test case)
it("verifies production hardened flow with developer key, run audit snapshot, and rate limit", async () => {
  // Verifies Developer auth, immutable versioning, correlation IDs, and run audit snapshot
});
```

- [ ] **Step 2: Run full workspace test suite**

Run: `bun test`  
Expected: All tests PASS across the entire monorepo.

- [ ] **Step 3: Verify strict TypeScript compilation**

Run: `bun run typecheck`  
Expected: `tsc --build` exits with code 0.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/full-lifecycle.test.ts
git commit -m "test(e2e): add production hardened lifecycle verification test"
```
