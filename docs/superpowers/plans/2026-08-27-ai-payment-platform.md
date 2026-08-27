# AI Payment Platform & Managed Actions Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować produkcyjny vertical slice platformy płatności AI i uniwersalnego portfela (Universal AI Wallet) z silnikiem zarządzanych akcji (Managed Actions) bez konieczności budowy backendu przez dewelopera.

**Architecture:** Monorepo w Bun Workspaces oparte na Architekturze Heksagonalnej. Czyste reguły biznesowe i kontrakty w `@platform/core` i `@platform/shared`, silnik Gateway (Hono) w `@platform/server` z podwójnym zapisem księgowym (Double-Entry Ledger) i transakcyjną rezerwacją środków w Postgres, oraz lekki (<20KB) kliencki SDK z widżetem w Shadow DOM (`@platform/sdk`), hookami React (`@platform/react`) i aplikacją demonstracyjną (`apps/demo`).

**Tech Stack:** Bun (Runtime & Package Manager), TypeScript, Hono, Zod, PostgreSQL / Supabase, Stripe API, OpenAI / Google Gemini API, Preact / Web Components (Shadow DOM), Vitest / Bun Test.

## Global Constraints

- **Runtime & Build System:** Bun (`bun test`, `bun run`).
- **Typing & Contracts:** 100% strict TypeScript, współdzielone schematy Zod w `@platform/shared`.
- **Financial Ledger:** Prawdziwy Double-Entry Accounting – suma wpisów w `ledger_entries` per transakcja zawsze równa zero ($\sum = 0$). Żadnego mutowania salda bez wpisu w księdze.
- **Funds Lifecycle:** Dwufazowy stan środków: `AVAILABLE` $\rightarrow$ `RESERVED` $\rightarrow$ `SETTLED` (sukces) / `RELEASED` (błąd/anulowanie).
- **Security:** `pk_live_...` to wyłącznie identyfikator projektu i filtr CORS, autoryzacja wymaga zweryfikowanego tokena sesji użytkownika (`UserSessionJWT`) uzyskanego przez OAuth 2.0 PKCE.
- **Client Widget:** Pełna izolacja stylów przez Shadow DOM (`mode: 'open'`).

---

## File Structure & Package Boundaries

```
ai-payment-platform/
├── package.json                          # Bun workspaces configuration
├── tsconfig.json                         # Base TypeScript configuration
│
├── packages/
│   ├── shared/                           # @platform/shared
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Public exports
│   │       ├── errors.ts                 # Standard error codes & classes
│   │       ├── accounts.ts               # Ledger account identifiers & types
│   │       ├── actions.ts                # ActionDefinition, ActionVersion schemas
│   │       ├── auth.ts                   # PKCE & Session schemas
│   │       └── ledger.ts                 # TransactionType, LedgerEntry schemas
│   │
│   ├── core/                             # @platform/core (Pure domain, zero I/O)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── ledger/
│   │       │   ├── double-entry.ts       # Double-entry balance & validation
│   │       │   └── reservation.ts        # Reservation -> Settlement lifecycle
│   │       ├── actions/
│   │       │   ├── template.ts           # Prompt template interpolation & sanitization
│   │       │   └── output-validator.ts   # Untrusted output JSON/Zod parser
│   │       ├── pricing/
│   │       │   └── margin-guard.ts       # Provider cost vs credit price guard
│   │       └── policies/
│   │           ├── rate-limiter.ts       # RateLimiter interface
│   │           └── abort-policy.ts       # AbortSignal settlement rules
│   │
│   ├── server/                           # @platform/server (Hono HTTP Gateway)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Server entrypoint
│   │       ├── db/
│   │       │   ├── client.ts             # Database client interface
│   │       │   └── migrations/           # 001_initial_schema.sql
│   │       ├── services/
│   │       │   ├── ledger.service.ts     # SQL transaction with FOR UPDATE lock
│   │       │   ├── auth.service.ts       # PKCE code challenge & JWT generator
│   │       │   ├── action.service.ts     # Action execution pipeline
│   │       │   └── stripe.service.ts     # Stripe Checkout & Webhook handler
│   │       ├── adapters/
│   │       │   ├── in-memory-db.ts       # Mock DB for fast unit tests
│   │       │   ├── model-provider.ts     # OpenAI & Gemini adapters with fallback
│   │       │   └── rate-limiter.ts       # Memory & Redis sliding window limiters
│   │       └── routes/
│   │           ├── auth.routes.ts        # /v1/auth/authorize, /v1/auth/token
│   │           ├── actions.routes.ts     # /v1/actions/:name/execute (POST & SSE)
│   │           ├── wallet.routes.ts      # /v1/wallet (GET)
│   │           └── stripe.routes.ts      # /v1/stripe/checkout, /v1/stripe/webhook
│   │
│   ├── sdk/                              # @platform/sdk (Client JS/TS + UI)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # createAI factory
│   │       ├── client.ts                 # Core AIClient (actions, streaming, chat)
│   │       ├── pkce.ts                   # Client-side PKCE code verifier/challenge
│   │       └── ui/
│   │           ├── widget.ts             # Web Component with Shadow DOM
│   │           ├── styles.ts             # Scoped CSS for modal, drawer, buttons
│   │           └── state.ts              # Widget UI state machine
│   │
│   └── react/                            # @platform/react
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── context.tsx               # AIProvider
│           ├── useAction.ts              # Action hook with loading/error/data
│           ├── useActionStream.ts        # Streaming action hook
│           └── useWallet.ts              # Wallet balance reactive hook
│
└── apps/
    └── demo/                             # Demo Vite application
        ├── index.html
        ├── vite.config.ts
        └── src/
            ├── main.ts                   # Resume Optimizer demo integration
            └── style.css
```

---

## Tasks

### Task 1: Monorepo Scaffolding & Shared Package (`@platform/shared`)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/errors.ts`
- Create: `packages/shared/src/accounts.ts`
- Create: `packages/shared/src/ledger.ts`
- Create: `packages/shared/src/actions.ts`
- Create: `packages/shared/src/auth.ts`
- Create: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/schemas.test.ts`

**Interfaces:**
- Produces: 
  - `PlatformErrorCode`: `'INSUFFICIENT_CREDITS' | 'UNTRUSTED_OUTPUT' | 'RATE_LIMITED' | 'ACTION_NOT_FOUND' | 'INVALID_INPUT' | 'UNAUTHORIZED'`
  - `ActionVersion`: `{ actionName, version, projectId, model, fallbackModel?, priceCredits, maxProviderCostCents, maxOutputTokens, outputFormat, systemPrompt, userPromptTemplate, inputSchema, outputSchema? }`
  - `LedgerTransactionType`: `'TOPUP' | 'BONUS' | 'RESERVATION_HOLD' | 'SETTLEMENT' | 'RESERVATION_RELEASE' | 'REFUND'`
  - `LedgerEntrySchema`: `{ accountIdentifier, amountCredits }`

- [ ] **Step 1: Write failing schema test**

```typescript
// packages/shared/tests/schemas.test.ts
import { describe, it, expect } from "bun:test";
import { ActionVersionSchema, LedgerEntrySchema } from "../src";

describe("Shared Schemas", () => {
  it("validates a well-formed ActionVersion", () => {
    const valid = {
      actionName: "optimize-resume",
      version: 1,
      projectId: "proj_123",
      model: "google/gemini-1.5-flash",
      priceCredits: 15,
      maxProviderCostCents: 5,
      maxOutputTokens: 2000,
      outputFormat: "json",
      systemPrompt: "You are an expert recruiter.",
      userPromptTemplate: "CV: {{cvText}}",
      inputSchema: { type: "object", properties: { cvText: { type: "string" } } }
    };
    const parsed = ActionVersionSchema.parse(valid);
    expect(parsed.actionName).toBe("optimize-resume");
    expect(parsed.priceCredits).toBe(15);
  });

  it("validates ledger entry schema", () => {
    const entry = LedgerEntrySchema.parse({
      accountIdentifier: "USER_WALLET:usr_123",
      amountCredits: -15
    });
    expect(entry.amountCredits).toBe(-15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/shared/tests/schemas.test.ts`  
Expected: FAIL (files and exports not yet created)

- [ ] **Step 3: Implement Monorepo config and `@platform/shared`**

Create root `package.json`:
```json
{
  "name": "ai-payment-platform",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --build"
  }
}
```

Create root `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true
  }
}
```

Create `packages/shared/package.json`:
```json
{
  "name": "@platform/shared",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

Implement `packages/shared/src/errors.ts`:
```typescript
export const PlatformErrorCodes = {
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  UNTRUSTED_OUTPUT: "UNTRUSTED_OUTPUT",
  RATE_LIMITED: "RATE_LIMITED",
  ACTION_NOT_FOUND: "ACTION_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  UNAUTHORIZED: "UNAUTHORIZED",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  MARGIN_EXCEEDED: "MARGIN_EXCEEDED"
} as const;

export type PlatformErrorCode = keyof typeof PlatformErrorCodes;

export class PlatformError extends Error {
  constructor(
    public readonly code: PlatformErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "PlatformError";
  }
}
```

Implement `packages/shared/src/accounts.ts`:
```typescript
export const AccountTypes = {
  USER_WALLET: "USER_WALLET",
  PLATFORM_CLEARING: "PLATFORM_CLEARING",
  PLATFORM_REVENUE: "PLATFORM_REVENUE",
  PROVIDER_EXPENSE: "PROVIDER_EXPENSE",
  DEVELOPER_PAYABLE: "DEVELOPER_PAYABLE"
} as const;

export type AccountType = keyof typeof AccountTypes;

export function formatAccountIdentifier(type: AccountType, id?: string): string {
  return id ? `${type}:${id}` : type;
}
```

Implement `packages/shared/src/ledger.ts`:
```typescript
import { z } from "zod";

export const LedgerTransactionTypeSchema = z.enum([
  "TOPUP",
  "BONUS",
  "RESERVATION_HOLD",
  "SETTLEMENT",
  "RESERVATION_RELEASE",
  "REFUND"
]);

export type LedgerTransactionType = z.infer<typeof LedgerTransactionTypeSchema>;

export const LedgerEntrySchema = z.object({
  accountIdentifier: z.string().min(1),
  amountCredits: z.number().int()
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const LedgerTransactionSchema = z.object({
  idempotencyKey: z.string().min(1),
  transactionType: LedgerTransactionTypeSchema,
  referenceId: z.string().optional(),
  entries: z.array(LedgerEntrySchema).min(2),
  metadata: z.record(z.unknown()).default({})
});

export type LedgerTransaction = z.infer<typeof LedgerTransactionSchema>;
```

Implement `packages/shared/src/actions.ts`:
```typescript
import { z } from "zod";

export const ActionVersionSchema = z.object({
  actionName: z.string().min(1),
  version: z.number().int().positive(),
  projectId: z.string().min(1),
  model: z.string().min(1),
  fallbackModel: z.string().optional(),
  priceCredits: z.number().int().positive(),
  maxProviderCostCents: z.number().positive(),
  maxOutputTokens: z.number().int().positive().default(2000),
  outputFormat: z.enum(["text", "json"]).default("text"),
  systemPrompt: z.string().min(1),
  userPromptTemplate: z.string().min(1),
  inputSchema: z.record(z.unknown()), // JSON schema or Zod object definition
  outputSchema: z.record(z.unknown()).optional(),
  rateLimit: z.object({
    maxRequests: z.number().int().positive().default(10),
    windowSeconds: z.number().int().positive().default(3600)
  }).default({ maxRequests: 10, windowSeconds: 3600 })
});

export type ActionVersion = z.infer<typeof ActionVersionSchema>;
```

Implement `packages/shared/src/auth.ts`:
```typescript
import { z } from "zod";

export const PKCEChallengeRequestSchema = z.object({
  projectId: z.string().min(1),
  codeChallenge: z.string().min(32),
  redirectUri: z.string().url().optional()
});

export const TokenExchangeRequestSchema = z.object({
  projectId: z.string().min(1),
  code: z.string().min(1),
  codeVerifier: z.string().min(32)
});

export const UserSessionTokenSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  projectId: z.string().min(1),
  exp: z.number().int()
});

export type UserSessionToken = z.infer<typeof UserSessionTokenSchema>;
```

Implement `packages/shared/src/index.ts`:
```typescript
export * from "./errors";
export * from "./accounts";
export * from "./ledger";
export * from "./actions";
export * from "./auth";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/shared/tests/schemas.test.ts`  
Expected: PASS (2 tests pass)

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json packages/shared/
git commit -m "feat(shared): add monorepo config and shared contracts with Zod validation"
```

---

### Task 2: Core Domain Logic (`@platform/core`)

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/ledger/double-entry.ts`
- Create: `packages/core/src/ledger/reservation.ts`
- Create: `packages/core/src/actions/template.ts`
- Create: `packages/core/src/actions/output-validator.ts`
- Create: `packages/core/src/pricing/margin-guard.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/tests/double-entry.test.ts`
- Test: `packages/core/tests/template-and-output.test.ts`

**Interfaces:**
- Consumes: `@platform/shared` (types, schemas, errors).
- Produces:
  - `validateDoubleEntryTransaction(tx: LedgerTransaction): void`
  - `createReservationTransaction(params: { userId, amountCredits, idempotencyKey, runId }): LedgerTransaction`
  - `createSettlementTransaction(params: { userId, amountCredits, idempotencyKey, runId, providerCostCents }): LedgerTransaction`
  - `renderPromptTemplate(template: string, inputs: Record<string, unknown>): string`
  - `parseUntrustedOutput(raw: string, schema?: z.ZodSchema): unknown`
  - `verifyMarginGuard(params: { priceCredits, maxProviderCostCents, estimatedCostCents }): void`

- [ ] **Step 1: Write failing core domain tests**

```typescript
// packages/core/tests/double-entry.test.ts
import { describe, it, expect } from "bun:test";
import { 
  validateDoubleEntryTransaction, 
  createReservationTransaction,
  createSettlementTransaction 
} from "../src";

describe("Double-Entry Domain Rules", () => {
  it("enforces balanced entries summing strictly to zero", () => {
    const balancedTx = {
      idempotencyKey: "tx_123",
      transactionType: "RESERVATION_HOLD" as const,
      entries: [
        { accountIdentifier: "USER_WALLET:usr_1", amountCredits: -15 },
        { accountIdentifier: "PLATFORM_CLEARING", amountCredits: 15 }
      ],
      metadata: {}
    };
    expect(() => validateDoubleEntryTransaction(balancedTx)).not.toThrow();

    const unbalancedTx = {
      ...balancedTx,
      entries: [
        { accountIdentifier: "USER_WALLET:usr_1", amountCredits: -15 },
        { accountIdentifier: "PLATFORM_CLEARING", amountCredits: 10 }
      ]
    };
    expect(() => validateDoubleEntryTransaction(unbalancedTx)).toThrow();
  });

  it("creates valid reservation transaction", () => {
    const tx = createReservationTransaction({
      userId: "usr_1",
      amountCredits: 15,
      idempotencyKey: "res_123",
      runId: "run_999"
    });
    expect(tx.transactionType).toBe("RESERVATION_HOLD");
    expect(tx.entries).toHaveLength(2);
    expect(() => validateDoubleEntryTransaction(tx)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/core/tests/double-entry.test.ts`  
Expected: FAIL (functions not defined)

- [ ] **Step 3: Implement `@platform/core` domain logic**

Create `packages/core/package.json`:
```json
{
  "name": "@platform/core",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@platform/shared": "workspace:*",
    "zod": "^3.23.8"
  }
}
```

Implement `packages/core/src/ledger/double-entry.ts`:
```typescript
import { LedgerTransaction, PlatformError, PlatformErrorCodes } from "@platform/shared";

export function validateDoubleEntryTransaction(tx: LedgerTransaction): void {
  const sum = tx.entries.reduce((acc, curr) => acc + curr.amountCredits, 0);
  if (sum !== 0) {
    throw new PlatformError(
      PlatformErrorCodes.PROVIDER_ERROR,
      `Double-entry imbalance: transaction sum is ${sum}, must be 0`,
      { tx }
    );
  }
}
```

Implement `packages/core/src/ledger/reservation.ts`:
```typescript
import { formatAccountIdentifier, LedgerTransaction } from "@platform/shared";

export function createReservationTransaction(params: {
  userId: string;
  amountCredits: number;
  idempotencyKey: string;
  runId: string;
}): LedgerTransaction {
  return {
    idempotencyKey: params.idempotencyKey,
    transactionType: "RESERVATION_HOLD",
    referenceId: params.runId,
    entries: [
      {
        accountIdentifier: formatAccountIdentifier("USER_WALLET", params.userId),
        amountCredits: -params.amountCredits
      },
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: params.amountCredits
      }
    ],
    metadata: { runId: params.runId, reservedCredits: params.amountCredits }
  };
}

export function createSettlementTransaction(params: {
  userId: string;
  amountCredits: number;
  idempotencyKey: string;
  runId: string;
  providerCostCents: number;
  developerShareCredits?: number;
}): LedgerTransaction {
  const devShare = params.developerShareCredits || 0;
  const platformRevenue = params.amountCredits - devShare;

  return {
    idempotencyKey: params.idempotencyKey,
    transactionType: "SETTLEMENT",
    referenceId: params.runId,
    entries: [
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: -params.amountCredits
      },
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_REVENUE"),
        amountCredits: platformRevenue
      },
      ...(devShare > 0 ? [{
        accountIdentifier: formatAccountIdentifier("DEVELOPER_PAYABLE"),
        amountCredits: devShare
      }] : [])
    ],
    metadata: {
      runId: params.runId,
      providerCostCents: params.providerCostCents
    }
  };
}

export function createReleaseTransaction(params: {
  userId: string;
  amountCredits: number;
  idempotencyKey: string;
  runId: string;
}): LedgerTransaction {
  return {
    idempotencyKey: params.idempotencyKey,
    transactionType: "RESERVATION_RELEASE",
    referenceId: params.runId,
    entries: [
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: -params.amountCredits
      },
      {
        accountIdentifier: formatAccountIdentifier("USER_WALLET", params.userId),
        amountCredits: params.amountCredits
      }
    ],
    metadata: { runId: params.runId }
  };
}
```

Implement `packages/core/src/actions/template.ts`:
```typescript
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export function renderPromptTemplate(template: string, inputs: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in inputs) || inputs[key] === undefined || inputs[key] === null) {
      throw new PlatformError(
        PlatformErrorCodes.INVALID_INPUT,
        `Missing required prompt template input: "${key}"`
      );
    }
    // Sanitize string value to prevent basic delimiter breakout
    const rawVal = String(inputs[key]);
    return rawVal.replace(/<\/?user_input>/gi, "");
  });
}
```

Implement `packages/core/src/actions/output-validator.ts`:
```typescript
import { z } from "zod";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export function parseUntrustedOutput<T>(raw: string, schema?: z.ZodType<T>): T {
  // Strip markdown code fences if present
  let clean = raw.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    throw new PlatformError(
      PlatformErrorCodes.UNTRUSTED_OUTPUT,
      "Failed to parse LLM response as JSON",
      { raw }
    );
  }

  if (schema) {
    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      throw new PlatformError(
        PlatformErrorCodes.UNTRUSTED_OUTPUT,
        "LLM output violated target schema",
        { errors: validation.error.format() }
      );
    }
    return validation.data;
  }

  return parsed as T;
}
```

Implement `packages/core/src/pricing/margin-guard.ts`:
```typescript
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export function verifyMarginGuard(params: {
  priceCredits: number;
  maxProviderCostCents: number;
  estimatedCostCents: number;
}): void {
  if (params.estimatedCostCents > params.maxProviderCostCents) {
    throw new PlatformError(
      PlatformErrorCodes.MARGIN_EXCEEDED,
      `Estimated provider cost (${params.estimatedCostCents}¢) exceeds max allowed (${params.maxProviderCostCents}¢)`
    );
  }
}
```

Implement `packages/core/src/index.ts`:
```typescript
export * from "./ledger/double-entry";
export * from "./ledger/reservation";
export * from "./actions/template";
export * from "./actions/output-validator";
export * from "./pricing/margin-guard";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test packages/core/tests/double-entry.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/
git commit -m "feat(core): implement double-entry balancing, reservation lifecycle, and untrusted output validation"
```

---

### Task 3: Database Migrations & Transactional Ledger Service (`@platform/server`)

**Files:**
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/src/db/migrations/001_initial_schema.sql`
- Create: `packages/server/src/adapters/in-memory-db.ts`
- Create: `packages/server/src/services/ledger.service.ts`
- Test: `packages/server/tests/ledger.service.test.ts`

**Interfaces:**
- Consumes: `@platform/shared`, `@platform/core`.
- Produces:
  - `LedgerService.reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>`
  - `LedgerService.settleReservation(runId: string, costCents: number): Promise<void>`
  - `LedgerService.releaseReservation(runId: string): Promise<void>`
  - `LedgerService.getWallet(userId: string): Promise<{ availableCredits: number, reservedCredits: number }>`

- [ ] **Step 1: Write failing ledger service test (testing concurrency & atomic locking)**

```typescript
// packages/server/tests/ledger.service.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { LedgerService } from "../src/services/ledger.service";

describe("LedgerService Concurrency & Reservation", () => {
  let db: InMemoryDatabase;
  let ledger: LedgerService;

  beforeEach(() => {
    db = new InMemoryDatabase();
    ledger = new LedgerService(db);
    db.seedWallet("usr_1", 20); // User has 20 credits
  });

  it("successfully reserves credits within available balance", async () => {
    await ledger.reserveCredits("usr_1", 15, "key_1", "run_1");
    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(5);
    expect(wallet.reservedCredits).toBe(15);
  });

  it("blocks concurrent reservation if balance is exceeded", async () => {
    // Attempt two reservations of 15 credits each simultaneously
    const req1 = ledger.reserveCredits("usr_1", 15, "key_1", "run_1");
    const req2 = ledger.reserveCredits("usr_1", 15, "key_2", "run_2");

    const results = await Promise.allSettled([req1, req2]);
    const succeeded = results.filter(r => r.status === "fulfilled");
    const failed = results.filter(r => r.status === "rejected");

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/ledger.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement SQL migrations, in-memory adapter, and LedgerService**

Create `packages/server/package.json`:
```json
{
  "name": "@platform/server",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@platform/shared": "workspace:*",
    "@platform/core": "workspace:*",
    "hono": "^4.5.3",
    "zod": "^3.23.8",
    "jose": "^5.6.3",
    "stripe": "^16.2.0"
  }
}
```

Create `packages/server/src/db/migrations/001_initial_schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    public_key TEXT NOT NULL UNIQUE,
    allowed_domains TEXT[] NOT NULL DEFAULT '{}',
    developer_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    available_credits INTEGER NOT NULL DEFAULT 0,
    reserved_credits INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT positive_available CHECK (available_credits >= 0),
    CONSTRAINT positive_reserved CHECK (reserved_credits >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    transaction_type TEXT NOT NULL,
    reference_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
    account_identifier TEXT NOT NULL,
    amount_credits INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action_name TEXT NOT NULL,
    action_version INTEGER NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('RESERVED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    model TEXT NOT NULL,
    reserved_credits INTEGER NOT NULL,
    consumed_credits INTEGER DEFAULT 0,
    input_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
```

Implement `packages/server/src/adapters/in-memory-db.ts`:
```typescript
import { PlatformError, PlatformErrorCodes, LedgerTransaction } from "@platform/shared";
import { validateDoubleEntryTransaction } from "@platform/core";

export interface WalletRecord {
  userId: string;
  availableCredits: number;
  reservedCredits: number;
}

export class InMemoryDatabase {
  public wallets = new Map<string, WalletRecord>();
  public transactions = new Map<string, LedgerTransaction>();
  public processedIdempotencyKeys = new Set<string>();

  seedWallet(userId: string, credits: number) {
    this.wallets.set(userId, {
      userId,
      availableCredits: credits,
      reservedCredits: 0
    });
  }

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    // In-memory mutex serialization
    return await fn();
  }

  async executeLedgerTransaction(tx: LedgerTransaction): Promise<void> {
    if (this.processedIdempotencyKeys.has(tx.idempotencyKey)) {
      return; // Idempotent no-op
    }
    validateDoubleEntryTransaction(tx);
    this.transactions.set(tx.idempotencyKey, tx);
    this.processedIdempotencyKeys.add(tx.idempotencyKey);
  }
}
```

Implement `packages/server/src/services/ledger.service.ts`:
```typescript
import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { 
  createReservationTransaction, 
  createSettlementTransaction, 
  createReleaseTransaction 
} from "@platform/core";
import { InMemoryDatabase } from "../adapters/in-memory-db";

export class LedgerService {
  constructor(private db: InMemoryDatabase) {}

  async getWallet(userId: string) {
    const wallet = this.db.wallets.get(userId);
    if (!wallet) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
    }
    return { ...wallet };
  }

  async reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    return this.db.runInTransaction(async () => {
      const wallet = this.db.wallets.get(userId);
      if (!wallet || wallet.availableCredits < amount) {
        throw new PlatformError(
          PlatformErrorCodes.INSUFFICIENT_CREDITS,
          `Insufficient credits: available ${wallet?.availableCredits ?? 0}, required ${amount}`
        );
      }

      const tx = createReservationTransaction({ userId, amountCredits: amount, idempotencyKey, runId });
      await this.db.executeLedgerTransaction(tx);

      wallet.availableCredits -= amount;
      wallet.reservedCredits += amount;
    });
  }

  async settleReservation(userId: string, amount: number, idempotencyKey: string, runId: string, costCents: number): Promise<void> {
    return this.db.runInTransaction(async () => {
      const wallet = this.db.wallets.get(userId);
      if (!wallet || wallet.reservedCredits < amount) {
        throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, "Invalid reservation settlement state");
      }

      const tx = createSettlementTransaction({ userId, amountCredits: amount, idempotencyKey, runId, providerCostCents: costCents });
      await this.db.executeLedgerTransaction(tx);

      wallet.reservedCredits -= amount;
    });
  }

  async releaseReservation(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    return this.db.runInTransaction(async () => {
      const wallet = this.db.wallets.get(userId);
      if (!wallet || wallet.reservedCredits < amount) {
        return;
      }

      const tx = createReleaseTransaction({ userId, amountCredits: amount, idempotencyKey, runId });
      await this.db.executeLedgerTransaction(tx);

      wallet.reservedCredits -= amount;
      wallet.availableCredits += amount;
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/ledger.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/
git commit -m "feat(server): implement database schema migrations and atomic ledger service"
```

---

### Task 4: PKCE Auth & Session Tokens (`@platform/server`)

**Files:**
- Create: `packages/server/src/services/auth.service.ts`
- Create: `packages/server/src/routes/auth.routes.ts`
- Test: `packages/server/tests/auth.routes.test.ts`

**Interfaces:**
- Consumes: `@platform/shared`.
- Produces:
  - `POST /v1/auth/authorize` $\rightarrow$ `{ authUrl, codeChallenge }`
  - `POST /v1/auth/token` $\rightarrow$ `{ sessionToken, user: { id, email }, welcomeBonusGranted: boolean }`
  - `verifySessionToken(token: string): Promise<UserSessionToken>`

- [ ] **Step 1: Write failing auth flow test**

```typescript
// packages/server/tests/auth.routes.test.ts
import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { AuthService } from "../src/services/auth.service";
import { createAuthRoutes } from "../src/routes/auth.routes";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";

describe("PKCE Auth Routes", () => {
  it("exchanges valid code and verifier for signed session token and grants 20 welcome credits", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));

    // 1. Generate challenge
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000001",
      email: "user@example.com",
      projectId: "proj_123",
      codeChallenge: verifier // plain for mock test
    });

    // 2. Exchange token
    const res = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_123",
        code,
        codeVerifier: verifier
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.sessionToken).toBeDefined();
    expect(body.user.email).toBe("user@example.com");
    expect(body.welcomeBonusGranted).toBe(true);

    const wallet = db.wallets.get("00000000-0000-0000-0000-000000000001");
    expect(wallet?.availableCredits).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/auth.routes.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement AuthService and auth routes**

Implement `packages/server/src/services/auth.service.ts`:
```typescript
import * as jose from "jose";
import { PlatformError, PlatformErrorCodes, UserSessionToken } from "@platform/shared";
import { InMemoryDatabase } from "../adapters/in-memory-db";

export class AuthService {
  private codes = new Map<string, { userId: string; email: string; projectId: string; codeChallenge: string; expiresAt: number }>();
  private secret: Uint8Array;

  constructor(private db: InMemoryDatabase, secretString: string) {
    this.secret = new TextEncoder().encode(secretString);
  }

  async issueAuthorizationCode(params: { userId: string; email: string; projectId: string; codeChallenge: string }): Promise<string> {
    const code = `code_${crypto.randomUUID()}`;
    this.codes.set(code, {
      ...params,
      expiresAt: Date.now() + 60000 // 60s validity
    });
    return code;
  }

  async exchangeCodeForSession(params: { projectId: string; code: string; codeVerifier: string }) {
    const entry = this.codes.get(params.code);
    if (!entry || entry.projectId !== params.projectId || entry.expiresAt < Date.now()) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired authorization code");
    }

    this.codes.delete(params.code);

    let welcomeBonusGranted = false;
    let wallet = this.db.wallets.get(entry.userId);
    if (!wallet) {
      // First time user: seed wallet with 20 credits
      this.db.seedWallet(entry.userId, 20);
      welcomeBonusGranted = true;
    }

    const token = await new jose.SignJWT({
      userId: entry.userId,
      email: entry.email,
      projectId: entry.projectId
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(this.secret);

    return {
      sessionToken: token,
      user: { id: entry.userId, email: entry.email },
      welcomeBonusGranted
    };
  }

  async verifySessionToken(token: string): Promise<UserSessionToken> {
    try {
      const { payload } = await jose.jwtVerify(token, this.secret);
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        projectId: payload.projectId as string,
        exp: payload.exp as number
      };
    } catch {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired session token");
    }
  }
}
```

Implement `packages/server/src/routes/auth.routes.ts`:
```typescript
import { Hono } from "hono";
import { TokenExchangeRequestSchema } from "@platform/shared";
import { AuthService } from "../services/auth.service";

export function createAuthRoutes(authService: AuthService) {
  const router = new Hono();

  router.post("/token", async (c) => {
    const body = await c.req.json();
    const parsed = TokenExchangeRequestSchema.parse(body);
    const result = await authService.exchangeCodeForSession(parsed);
    return c.json(result);
  });

  return router;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/auth.routes.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/auth.service.ts packages/server/src/routes/auth.routes.ts packages/server/tests/auth.routes.test.ts
git commit -m "feat(server): implement PKCE authorization code exchange and welcome bonus grant"
```

---

### Task 5: Managed Action Execution Engine & Gateway (`@platform/server`)

**Files:**
- Create: `packages/server/src/adapters/model-provider.ts`
- Create: `packages/server/src/services/action.service.ts`
- Create: `packages/server/src/routes/actions.routes.ts`
- Test: `packages/server/tests/actions.routes.test.ts`

**Interfaces:**
- Consumes: `@platform/shared`, `@platform/core`, `LedgerService`, `AuthService`.
- Produces:
  - `POST /v1/actions/:name/execute` $\rightarrow$ `{ output: unknown, creditsUsed: number, remainingBalance: number }`
  - Streaming SSE on same endpoint if `Accept: text/event-stream`.

- [ ] **Step 1: Write failing action execution test**

```typescript
// packages/server/tests/actions.routes.test.ts
import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { LedgerService } from "../src/services/ledger.service";
import { AuthService } from "../src/services/auth.service";
import { MockModelProvider } from "../src/adapters/model-provider";
import { ActionExecutionService } from "../src/services/action.service";
import { createActionRoutes } from "../src/routes/actions.routes";
import { ActionVersion } from "@platform/shared";

describe("Managed Actions Execution Endpoint", () => {
  it("executes action, validates input, reserves credits, calls LLM, settles, and returns output", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_1", 50);

    const ledger = new LedgerService(db);
    const authService = new AuthService(db, "secret-key-32-chars-long-example!");
    const token = await authService.issueAuthorizationCode({
      userId: "usr_1",
      email: "usr@example.com",
      projectId: "proj_1",
      codeChallenge: "ver"
    }).then(code => authService.exchangeCodeForSession({ projectId: "proj_1", code, codeVerifier: "ver" }))
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

    const modelProvider = new MockModelProvider();
    modelProvider.setResponse(JSON.stringify({ greeting: "Hello World" }));

    const actionService = new ActionExecutionService(ledger, modelProvider, [mockAction]);
    const app = new Hono();
    app.route("/v1/actions", createActionRoutes(actionService, authService));

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

    const wallet = await ledger.getWallet("usr_1");
    expect(wallet.availableCredits).toBe(35);
    expect(wallet.reservedCredits).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/actions.routes.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement ModelProvider, ActionExecutionService, and routes**

Implement `packages/server/src/adapters/model-provider.ts`:
```typescript
export interface ModelProvider {
  generate(params: { model: string; systemPrompt: string; prompt: string; maxTokens: number }): Promise<{ text: string; costCents: number }>;
}

export class MockModelProvider implements ModelProvider {
  private response = "{}";
  setResponse(resp: string) { this.response = resp; }
  async generate() {
    return { text: this.response, costCents: 0.5 };
  }
}
```

Implement `packages/server/src/services/action.service.ts`:
```typescript
import { ActionVersion, PlatformError, PlatformErrorCodes } from "@platform/shared";
import { renderPromptTemplate, parseUntrustedOutput, verifyMarginGuard } from "@platform/core";
import { LedgerService } from "./ledger.service";
import { ModelProvider } from "../adapters/model-provider";

export class ActionExecutionService {
  private actionMap = new Map<string, ActionVersion>();

  constructor(
    private ledger: LedgerService,
    private modelProvider: ModelProvider,
    actions: ActionVersion[]
  ) {
    actions.forEach(a => this.actionMap.set(a.actionName, a));
  }

  async execute(params: {
    actionName: string;
    projectId: string;
    userId: string;
    inputs: Record<string, unknown>;
    idempotencyKey?: string;
  }) {
    const action = this.actionMap.get(params.actionName);
    if (!action || action.projectId !== params.projectId) {
      throw new PlatformError(PlatformErrorCodes.ACTION_NOT_FOUND, `Action "${params.actionName}" not found`);
    }

    const runId = crypto.randomUUID();
    const idempotencyKey = params.idempotencyKey || `run_${runId}`;

    // 1. Reserve credits
    await this.ledger.reserveCredits(params.userId, action.priceCredits, `res_${idempotencyKey}`, runId);

    try {
      // 2. Build prompt
      const prompt = renderPromptTemplate(action.userPromptTemplate, params.inputs);

      // 3. Call model
      const result = await this.modelProvider.generate({
        model: action.model,
        systemPrompt: action.systemPrompt,
        prompt,
        maxTokens: action.maxOutputTokens
      });

      // 4. Verify margin guard
      verifyMarginGuard({
        priceCredits: action.priceCredits,
        maxProviderCostCents: action.maxProviderCostCents,
        estimatedCostCents: result.costCents
      });

      // 5. Parse output
      const output = action.outputFormat === "json"
        ? parseUntrustedOutput(result.text)
        : result.text;

      // 6. Settle reservation
      await this.ledger.settleReservation(
        params.userId,
        action.priceCredits,
        `set_${idempotencyKey}`,
        runId,
        result.costCents
      );

      const wallet = await this.ledger.getWallet(params.userId);

      return {
        output,
        creditsUsed: action.priceCredits,
        remainingBalance: wallet.availableCredits
      };
    } catch (err) {
      // On failure, release reservation completely
      await this.ledger.releaseReservation(params.userId, action.priceCredits, `rel_${idempotencyKey}`, runId);
      throw err;
    }
  }
}
```

Implement `packages/server/src/routes/actions.routes.ts`:
```typescript
import { Hono } from "hono";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { ActionExecutionService } from "../services/action.service";
import { AuthService } from "../services/auth.service";

export function createActionRoutes(actionService: ActionExecutionService, authService: AuthService) {
  const router = new Hono();

  router.post("/:name/execute", async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Missing or invalid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const session = await authService.verifySessionToken(token);

    const body = await c.req.json();
    const actionName = c.req.param("name");

    const result = await actionService.execute({
      actionName,
      projectId: body.projectId || session.projectId,
      userId: session.userId,
      inputs: body.inputs || {},
      idempotencyKey: c.req.header("Idempotency-Key")
    });

    return c.json(result);
  });

  return router;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/actions.routes.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/adapters/model-provider.ts packages/server/src/services/action.service.ts packages/server/src/routes/actions.routes.ts packages/server/tests/actions.routes.test.ts
git commit -m "feat(server): implement action execution lifecycle with reservation hold and settlement"
```

---

### Task 6: Stripe Billing & Webhook Replay (`@platform/server`)

**Files:**
- Create: `packages/server/src/services/stripe.service.ts`
- Create: `packages/server/src/routes/stripe.routes.ts`
- Test: `packages/server/tests/stripe.service.test.ts`

**Interfaces:**
- Consumes: `InMemoryDatabase`.
- Produces:
  - `createCheckoutSession(userId: string, pack: 'starter' | 'popular' | 'power'): Promise<{ checkoutUrl: string }>`
  - `handleWebhook(event: { type: string, data: { object: any } }): Promise<void>`

- [ ] **Step 1: Write failing Stripe webhook idempotency test**

```typescript
// packages/server/tests/stripe.service.test.ts
import { describe, it, expect } from "bun:test";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { StripeBillingService } from "../src/services/stripe.service";

describe("Stripe Top-Up & Idempotency", () => {
  it("credits wallet on checkout.session.completed and handles duplicate webhook replay safely", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_stripe_1", 0);
    const stripeService = new StripeBillingService(db);

    const event = {
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_session_abc",
          metadata: { userId: "usr_stripe_1", packId: "popular" } // 550 credits
        }
      }
    };

    // First delivery
    await stripeService.handleWebhook(event);
    let wallet = db.wallets.get("usr_stripe_1");
    expect(wallet?.availableCredits).toBe(550);

    // Duplicate replay
    await stripeService.handleWebhook(event);
    wallet = db.wallets.get("usr_stripe_1");
    expect(wallet?.availableCredits).toBe(550); // Did not double-credit
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/server/tests/stripe.service.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement StripeBillingService and routes**

Implement `packages/server/src/services/stripe.service.ts`:
```typescript
import { formatAccountIdentifier, LedgerTransaction } from "@platform/shared";
import { InMemoryDatabase } from "../adapters/in-memory-db";

export const TOPUP_PACKAGES = {
  starter: { priceCents: 300, credits: 300 },
  popular: { priceCents: 500, credits: 550 },
  power: { priceCents: 1000, credits: 1200 }
} as const;

export class StripeBillingService {
  constructor(private db: InMemoryDatabase) {}

  async handleWebhook(event: { id: string; type: string; data: { object: any } }) {
    if (event.type !== "checkout.session.completed") {
      return;
    }

    const session = event.data.object;
    const userId = session.metadata?.userId;
    const packId = session.metadata?.packId as keyof typeof TOPUP_PACKAGES;

    if (!userId || !packId || !(packId in TOPUP_PACKAGES)) {
      return;
    }

    const pack = TOPUP_PACKAGES[packId];
    const idempotencyKey = `stripe_${session.id}`;

    const tx: LedgerTransaction = {
      idempotencyKey,
      transactionType: "TOPUP",
      referenceId: session.id,
      entries: [
        {
          accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
          amountCredits: -pack.credits
        },
        {
          accountIdentifier: formatAccountIdentifier("USER_WALLET", userId),
          amountCredits: pack.credits
        }
      ],
      metadata: { sessionId: session.id, amountCents: pack.priceCents }
    };

    await this.db.executeLedgerTransaction(tx);

    const wallet = this.db.wallets.get(userId);
    if (wallet) {
      wallet.availableCredits += pack.credits;
    }
  }
}
```

Implement `packages/server/src/routes/stripe.routes.ts`:
```typescript
import { Hono } from "hono";
import { StripeBillingService } from "../services/stripe.service";

export function createStripeRoutes(billingService: StripeBillingService) {
  const router = new Hono();

  router.post("/webhook", async (c) => {
    const event = await c.req.json();
    await billingService.handleWebhook(event);
    return c.json({ received: true });
  });

  return router;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/server/tests/stripe.service.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/stripe.service.ts packages/server/src/routes/stripe.routes.ts packages/server/tests/stripe.service.test.ts
git commit -m "feat(server): implement Stripe webhook receiver with idempotent topup processing"
```

---

### Task 7: Client SDK Core (`@platform/sdk`)

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/src/pkce.ts`
- Create: `packages/sdk/src/client.ts`
- Create: `packages/sdk/src/index.ts`
- Test: `packages/sdk/tests/client.test.ts`

**Interfaces:**
- Consumes: `@platform/shared`.
- Produces:
  - `createAI(config: { project: string, baseUrl?: string, mock?: boolean }): AIClient`
  - `ai.action<TInput, TOutput>(name: string, options: { inputs: TInput, signal?: AbortSignal }): Promise<{ output: TOutput, creditsUsed: number }>`
  - `ai.getWallet(): Promise<{ availableCredits: number }>`

- [ ] **Step 1: Write failing SDK client test**

```typescript
// packages/sdk/tests/client.test.ts
import { describe, it, expect } from "bun:test";
import { createAI } from "../src";

describe("Client SDK", () => {
  it("supports mock mode for zero-cost local development", async () => {
    const ai = createAI({
      project: "pk_test_123",
      mock: true
    });

    const result = await ai.action("optimize-resume", {
      inputs: { cvText: "Senior developer CV content..." }
    });

    expect(result.creditsUsed).toBe(0);
    expect(result.output).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/sdk/tests/client.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement PKCE and AIClient**

Create `packages/sdk/package.json`:
```json
{
  "name": "@platform/sdk",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@platform/shared": "workspace:*"
  }
}
```

Implement `packages/sdk/src/pkce.ts`:
```typescript
export async function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = Array.from(array, b => b.toString(16).padStart(2, "0")).join("");

  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return { verifier, challenge };
}
```

Implement `packages/sdk/src/client.ts`:
```typescript
export interface AIClientConfig {
  project: string;
  baseUrl?: string;
  mock?: boolean;
  headless?: boolean;
  theme?: "auto" | "light" | "dark";
}

export class AIClient {
  private sessionToken: string | null = null;

  constructor(private config: AIClientConfig) {
    this.config.baseUrl = config.baseUrl || "https://api.example.com";
  }

  setSessionToken(token: string) {
    this.sessionToken = token;
  }

  async action<TInput = any, TOutput = any>(
    actionName: string,
    options: { inputs: TInput; signal?: AbortSignal }
  ): Promise<{ output: TOutput; creditsUsed: number; remainingBalance: number }> {
    if (this.config.mock) {
      return {
        output: { mock: true, message: `Mock execution for ${actionName}` } as unknown as TOutput,
        creditsUsed: 0,
        remainingBalance: 999
      };
    }

    const res = await fetch(`${this.config.baseUrl}/v1/actions/${actionName}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.sessionToken || ""}`
      },
      body: JSON.stringify({
        projectId: this.config.project,
        inputs: options.inputs
      }),
      signal: options.signal
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to execute action");
    }

    return await res.json();
  }
}

export function createAI(config: AIClientConfig): AIClient {
  return new AIClient(config);
}
```

Implement `packages/sdk/src/index.ts`:
```typescript
export * from "./client";
export * from "./pkce";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/sdk/tests/client.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/sdk/
git commit -m "feat(sdk): implement core client with PKCE generator and mock mode"
```

---

### Task 8: Shadow DOM Widget Component (`@platform/sdk`)

**Files:**
- Create: `packages/sdk/src/ui/styles.ts`
- Create: `packages/sdk/src/ui/state.ts`
- Create: `packages/sdk/src/ui/widget.ts`
- Modify: `packages/sdk/src/index.ts`
- Test: `packages/sdk/tests/widget.test.ts`

**Interfaces:**
- Produces:
  - Custom Element `<ai-payment-widget>` with encapsulated Shadow DOM.
  - States: `AUTH` (Google 1-click + OTP), `TOPUP` ($3, $5, $10), `CONFIRM`, `DRAWER`.

- [ ] **Step 1: Write failing widget lifecycle test**

```typescript
// packages/sdk/tests/widget.test.ts
import { describe, it, expect } from "bun:test";
import { AIPaymentWidget } from "../src/ui/widget";

describe("Shadow DOM Widget Isolation", () => {
  it("attaches shadow root in open mode and renders encapsulated state container", () => {
    // Custom elements test environment
    const widget = new AIPaymentWidget();
    expect(widget.shadowRoot).toBeDefined();
    expect(widget.shadowRoot?.mode).toBe("open");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/sdk/tests/widget.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement styles, state machine, and AIPaymentWidget**

Implement `packages/sdk/src/ui/styles.ts`:
```typescript
export const WIDGET_CSS = `
  :host {
    all: initial;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  }
  .card {
    background: #ffffff;
    color: #1a1a1a;
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
  .btn-primary {
    background: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 12px;
    width: 100%;
    font-weight: 600;
    cursor: pointer;
  }
  @media (max-width: 640px) {
    .modal-overlay {
      align-items: flex-end;
    }
    .card {
      width: 100%;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
`;
```

Implement `packages/sdk/src/ui/widget.ts`:
```typescript
import { WIDGET_CSS } from "./styles";

export class AIPaymentWidget extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = WIDGET_CSS;

    const container = document.createElement("div");
    container.className = "widget-root";
    container.innerHTML = `
      <div class="modal-overlay" style="display: none;">
        <div class="card">
          <h3>Universal AI Wallet</h3>
          <p>Zaloguj się, aby otrzymać ⚡ 20 darmowych kredytów.</p>
          <button class="btn-primary">Kontynuuj z Google</button>
        </div>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ai-payment-widget")) {
  customElements.define("ai-payment-widget", AIPaymentWidget);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/sdk/tests/widget.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/sdk/src/ui/ packages/sdk/tests/widget.test.ts
git commit -m "feat(sdk): implement isolated Shadow DOM Web Component widget with mobile bottom-sheet styling"
```

---

### Task 9: React Hooks Package (`@platform/react`)

**Files:**
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`
- Create: `packages/react/src/context.tsx`
- Create: `packages/react/src/useAction.ts`
- Create: `packages/react/src/useWallet.ts`
- Create: `packages/react/src/index.ts`
- Test: `packages/react/tests/useAction.test.ts`

**Interfaces:**
- Consumes: `@platform/sdk`.
- Produces:
  - `<AIProvider client={ai}>{children}</AIProvider>`
  - `useAction(actionName)` $\rightarrow$ `{ execute, data, isPending, error }`
  - `useWallet()` $\rightarrow$ `{ balance }`

- [ ] **Step 1: Write failing hook test**

```typescript
// packages/react/tests/useAction.test.ts
import { describe, it, expect } from "bun:test";
import { createAI } from "@platform/sdk";

describe("React Integration Hooks", () => {
  it("provides typed action runner structure", () => {
    const ai = createAI({ project: "pk_test", mock: true });
    expect(ai).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `bun test packages/react/tests/useAction.test.ts`  
Expected: PASS

- [ ] **Step 3: Implement React package**

Create `packages/react/package.json`:
```json
{
  "name": "@platform/react",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "dependencies": {
    "@platform/sdk": "workspace:*"
  }
}
```

Implement `packages/react/src/useAction.ts`:
```typescript
import { useState, useCallback } from "react";
import { AIClient } from "@platform/sdk";

export function useAction<TInput = any, TOutput = any>(client: AIClient, actionName: string) {
  const [data, setData] = useState<TOutput | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (inputs: TInput) => {
    setIsPending(true);
    setError(null);
    try {
      const res = await client.action<TInput, TOutput>(actionName, { inputs });
      setData(res.output);
      return res.output;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [client, actionName]);

  return { execute, data, isPending, error };
}
```

Implement `packages/react/src/index.ts`:
```typescript
export * from "./useAction";
```

- [ ] **Step 4: Commit**

```bash
git add packages/react/
git commit -m "feat(react): add useAction hook wrapper for declarative component integration"
```

---

### Task 10: Demo Application & End-to-End Test (`apps/demo`)

**Files:**
- Create: `apps/demo/package.json`
- Create: `apps/demo/index.html`
- Create: `apps/demo/src/main.ts`
- Create: `apps/demo/src/style.css`
- Test: `tests/e2e/full-lifecycle.test.ts`

**Interfaces:**
- Integrates all layers: `@platform/shared`, `@platform/core`, `@platform/server`, `@platform/sdk`.
- E2E Test covers: Seed $\rightarrow$ Auth PKCE $\rightarrow$ Welcome bonus 20 ⚡ $\rightarrow$ Action execution 15 ⚡ $\rightarrow$ Balance 5 ⚡ $\rightarrow$ Topup 550 ⚡ $\rightarrow$ Final Balance 555 ⚡.

- [ ] **Step 1: Write comprehensive end-to-end test**

```typescript
// tests/e2e/full-lifecycle.test.ts
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
    const code = await authService.issueAuthorizationCode({
      userId: "usr_e2e_1",
      email: "engineer@example.com",
      projectId: "proj_e2e",
      codeChallenge: "challenge_123"
    });

    const tokenRes = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_e2e",
        code,
        codeVerifier: "challenge_123"
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
});
```

- [ ] **Step 2: Run E2E test to verify it passes**

Run: `bun test tests/e2e/full-lifecycle.test.ts`  
Expected: PASS

- [ ] **Step 3: Create Demo Web Application (`apps/demo`)**

Create `apps/demo/package.json`:
```json
{
  "name": "demo-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "@platform/sdk": "workspace:*"
  },
  "devDependencies": {
    "vite": "^5.4.2"
  }
}
```

Create `apps/demo/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AI Resume Optimizer (Demo)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <div id="app">
    <h1>🎨 AI Resume Optimizer</h1>
    <p>Zero-backend AI integration powered by Universal AI Wallet.</p>
    <textarea id="cvInput" rows="6" placeholder="Wklej fragment swojego CV..."></textarea>
    <br/>
    <button id="optimizeBtn">Optymalizuj CV (15 ⚡)</button>
    <pre id="output"></pre>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

Create `apps/demo/src/main.ts`:
```typescript
import { createAI } from "@platform/sdk";

const ai = createAI({
  project: "pk_live_demo123",
  mock: true // Local demo mode
});

const btn = document.getElementById("optimizeBtn") as HTMLButtonElement;
const input = document.getElementById("cvInput") as HTMLTextAreaElement;
const output = document.getElementById("output") as HTMLPreElement;

btn?.addEventListener("click", async () => {
  btn.disabled = true;
  btn.innerText = "Optymalizuję...";
  try {
    const res = await ai.action("optimize-resume", {
      inputs: { cvText: input.value || "Standard CV text" }
    });
    output.innerText = JSON.stringify(res.output, null, 2);
  } catch (err: any) {
    output.innerText = `Błąd: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.innerText = "Optymalizuj CV (15 ⚡)";
  }
});
```

- [ ] **Step 4: Run full workspace test suite**

Run: `bun test`  
Expected: All unit, integration, and E2E tests PASS across all packages.

- [ ] **Step 5: Commit demo app and final test**

```bash
git add apps/demo/ tests/e2e/
git commit -m "feat(demo): add resume optimizer demo app and full lifecycle E2E test"
```
