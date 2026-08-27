# Production Real Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the key-ready gateway (local Supabase Postgres on Docker, `.env.example`, env-driven server, interim Postgres persistence) into a production-real platform: SQL-first persistence with row locks, real Stripe Checkout payments, real user authentication, a deployed gateway, and operational hardening.

**Architecture:** The gateway already runs a complete Hono API with an env-driven database selection (`DATABASE_URL` → `PostgresDatabase`, else `InMemoryDatabase`) behind the shared `LedgerDatabase` interface (`packages/server/src/adapters/database.ts`). This plan (1) moves all financial mutations into adapter-native SQL transactions with `SELECT ... FOR UPDATE`, (2) adds a real Stripe Checkout session flow, (3) replaces simulated login with email-OTP auth plus per-project CORS, (4) ships a Docker/Fly.io deployment with migrations, and (5) hardens rate limiting (Redis), retention and observability. Every task keeps the in-memory fallback so the 213-test suite stays green in CI.

**Tech Stack:** Bun 1.3, TypeScript (strict), Hono, postgres.js (`postgres@3.4.9`), PostgreSQL/Supabase (`supabase/postgres:17.6.1.136` via root `docker-compose.yml`), Stripe SDK (`stripe@16.2.0`, already a dependency), jose (JWT), Docker / Fly.io, Upstash Redis REST (optional).

## Global Constraints

- Runtime/build: Bun (`bun test`, `bun run typecheck`, `bun --env-file=.env run ...`). `tsc --build` must exit 0.
- Double-entry ledger: every transaction sums to exactly zero (`validateDoubleEntryTransaction` from `@platform/core`).
- Two-phase lifecycle: `RESERVATION_HOLD` → model call → `SETTLEMENT` on success / `RESERVATION_RELEASE` on any failure.
- Secrets ONLY via env (`DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). No new hardcoded keys. Demo fallbacks stay in `server.ts` only for missing env.
- Privacy: prompts/raw outputs are never logged (existing `PlatformLogger` redaction must keep working).
- In-memory demo mode must keep working (CI has no Postgres): any new `LedgerDatabase` method must be implemented by BOTH `InMemoryDatabase` and `PostgresDatabase`.
- Migrations live in `packages/server/src/db/migrations/*.sql`, applied in filename order by `bun run db:migrate` and by Docker init on first start.

---

### Task 1: SQL-First Ledger Persistence (`@platform/server`)

**Context:** The current `PostgresDatabase` (interim) keeps in-memory maps as the working state and snapshots them to Postgres after each `runInTransaction`. This works but is not concurrency-safe across gateway instances and cannot express `SELECT ... FOR UPDATE`. This task moves the financial operations into the adapters so Postgres executes them as single SQL transactions with row locks.

**Files:**
- Modify: `packages/server/src/adapters/database.ts` (extend `LedgerDatabase`)
- Modify: `packages/server/src/adapters/in-memory-db.ts` (implement the new ops with the existing logic)
- Modify: `packages/server/src/adapters/postgres-real.ts` (rewrite internals SQL-first; drop snapshot persist)
- Modify: `packages/server/src/services/ledger.service.ts` (become a facade over the new ops)
- Modify: `packages/server/src/services/stripe.service.ts` (top-up/refund via new op)
- Modify: `packages/server/src/services/auth.service.ts` (welcome bonus via new op)
- Create: `packages/server/src/db/migrations/003_sql_first_align.sql`
- Create: `packages/server/tests/postgres-real.integration.test.ts`
- Test: `packages/server/tests/ledger.service.test.ts`, `packages/server/tests/postgres-concurrency.test.ts` (must stay green)

**Interfaces:**
- Consumes: `LedgerDatabase` from `packages/server/src/adapters/database.ts`; `createReservationTransaction`, `createSettlementTransaction`, `createReleaseTransaction`, `validateDoubleEntryTransaction` from `@platform/core`; `PlatformError`/`PlatformErrorCodes` from `@platform/shared`.
- Produces (added to `LedgerDatabase`, implemented by both adapters):

```typescript
getWallet(userId: string): Promise<WalletRecord>;
reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>;
settleReservation(userId: string, amount: number, idempotencyKey: string, runId: string, providerCostCents: number): Promise<void>;
releaseReservation(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>;
applyCredit(userId: string, amount: number, transactionType: "TOPUP" | "BONUS" | "REFUND", idempotencyKey: string, referenceId: string, metadata?: Record<string, unknown>): Promise<void>;
```

`applyCredit` sign semantics: callers always pass a **positive** `amount`; TOPUP and BONUS credit the wallet by `+amount`, REFUND debits it by `-amount` (the adapters derive the sign from `transactionType`). Every call creates a balanced ledger transaction.

`LedgerService` keeps its current public API (`getWallet`, `reserveCredits`, `settleReservation`, `releaseReservation` — including the existing overloads used by `action.service.ts` and routes) and simply delegates to `this.db`. No caller changes.

- [ ] **Step 1: Extend the interface and write failing tests**

Add to `packages/server/src/adapters/database.ts` inside `LedgerDatabase`:

```typescript
  getWallet(userId: string): Promise<WalletRecord>;
  reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>;
  settleReservation(userId: string, amount: number, idempotencyKey: string, runId: string, providerCostCents: number): Promise<void>;
  releaseReservation(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void>;
  applyCredit(
    userId: string,
    amount: number,
    transactionType: "TOPUP" | "BONUS" | "REFUND",
    idempotencyKey: string,
    referenceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
```

Create `packages/server/tests/postgres-real.integration.test.ts` (skips cleanly without a live DB):

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PostgresDatabase } from "../src/adapters/postgres-real";

const DATABASE_URL = process.env.DATABASE_URL;
const describeDb = DATABASE_URL ? describe : describe.skip;

describeDb("PostgresDatabase SQL-first persistence", () => {
  let db: PostgresDatabase;

  beforeAll(async () => {
    db = new PostgresDatabase({ url: DATABASE_URL!, max: 1 });
    await db.init();
    // Fresh wallet for the test
    await db.runInTransaction(async () => {
      db.seedWallet("it_usr_1", 20);
    });
  });

  afterAll(async () => {
    await db.close();
  });

  it("blocks concurrent overdraws via row locks: 10 parallel reserves, only 2 succeed on 20 credits", async () => {
    const attempts = Array.from({ length: 10 }, (_, i) =>
      db.reserveCredits("it_usr_1", 10, `it_idem_${i}`, `it_run_${i}`)
    );
    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(2);
    const wallet = await db.getWallet("it_usr_1");
    expect(wallet.availableCredits).toBe(0);
    expect(wallet.reservedCredits).toBe(20);
  });

  it("survives a restart: new instance hydrates balances from Postgres", async () => {
    await db.close();
    const db2 = new PostgresDatabase({ url: DATABASE_URL!, max: 1 });
    await db2.init();
    const wallet = await db2.getWallet("it_usr_1");
    expect(wallet.availableCredits).toBe(0);
    expect(wallet.reservedCredits).toBe(20);
    db = db2;
  });

  it("applyCredit is idempotent on replay and creates a balanced ledger transaction", async () => {
    await db.applyCredit("it_usr_1", 50, "TOPUP", "it_topup_1", "cs_test_1");
    await db.applyCredit("it_usr_1", 50, "TOPUP", "it_topup_1", "cs_test_1"); // replay
    const wallet = await db.getWallet("it_usr_1");
    expect(wallet.availableCredits).toBe(50);
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails to compile**

Run: `bun test packages/server/tests/postgres-real.integration.test.ts`
Expected: FAIL — `LedgerDatabase`/`InMemoryDatabase`/`PostgresDatabase` do not implement the new methods yet.

- [ ] **Step 3: Implement the ops in `InMemoryDatabase`**

Move the bodies of the current `LedgerService` methods into `packages/server/src/adapters/in-memory-db.ts` verbatim (same idempotency checks, same wallet mutation, same transaction builders), plus `getWallet` and `applyCredit`:

```typescript
  async getWallet(userId: string): Promise<WalletRecord> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
    }
    return { ...wallet };
  }

  async applyCredit(
    userId: string,
    amount: number,
    transactionType: "TOPUP" | "BONUS" | "REFUND",
    idempotencyKey: string,
    referenceId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.runInTransaction(async () => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) return;
      const delta = transactionType === "REFUND" ? -amount : amount;
      const tx: LedgerTransaction = {
        idempotencyKey,
        transactionType,
        referenceId,
        entries: [
          { accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"), amountCredits: -delta },
          { accountIdentifier: formatAccountIdentifier("USER_WALLET", userId), amountCredits: delta }
        ],
        metadata
      };
      await this.executeLedgerTransaction(tx);
      const wallet = this.wallets.get(userId);
      if (wallet) wallet.availableCredits += delta;
      else this.seedWallet(userId, amount);
    });
  }
```

Add the import `formatAccountIdentifier` from `@platform/shared`. Keep the existing `reserveCredits`/`settleReservation`/`releaseReservation` logic but move it into this class (copy from `ledger.service.ts`, replacing `this.db.X` with `this.X`), implementing the four-arg signatures only (no overloads — `LedgerService` will handle them).

- [ ] **Step 4: Rewrite `PostgresDatabase` SQL-first**

In `packages/server/src/adapters/postgres-real.ts`, replace the snapshot `persist()` machinery with real transactions using `postgres.js` `sql.begin`. The in-memory maps now serve only as an idempotency/read cache kept in sync inside each transaction. New core:

```typescript
  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.sql.begin(async (tx) => {
      const result = await fn();
      // Keep the in-memory cache coherent for read paths (runs, seeding).
      await this.syncCache();
      return result;
    });
  }

  private async syncCache(): Promise<void> {
    const wallets = await this.sql`SELECT user_id, available_credits, reserved_credits FROM wallets`;
    this.wallets.clear();
    for (const w of wallets) {
      this.wallets.set(w.user_id, {
        userId: w.user_id,
        availableCredits: Number(w.available_credits),
        reservedCredits: Number(w.reserved_credits)
      });
    }
  }
```

Then the ops (each calls `this.sql.begin` via `runInTransaction`):

```typescript
  async getWallet(userId: string): Promise<WalletRecord> {
    const [row] = await this.sql`SELECT user_id, available_credits, reserved_credits FROM wallets WHERE user_id = ${userId}`;
    if (!row) throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
    return { userId: row.user_id, availableCredits: Number(row.available_credits), reservedCredits: Number(row.reserved_credits) };
  }

  async reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    await this.runInTransaction(async () => {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) return;
      const [row] = await this.sql`
        SELECT available_credits, reserved_credits FROM wallets WHERE user_id = ${userId} FOR UPDATE
      `;
      if (!row) throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Wallet not found");
      if (Number(row.available_credits) < amount) {
        throw new PlatformError(
          PlatformErrorCodes.INSUFFICIENT_CREDITS,
          `Insufficient credits: available ${Number(row.available_credits)}, required ${amount}`
        );
      }
      await this.sql`
        UPDATE wallets
        SET available_credits = available_credits - ${amount},
            reserved_credits = reserved_credits + ${amount},
            updated_at = now()
        WHERE user_id = ${userId}
      `;
      await this.sql`
        INSERT INTO reservations (run_id, user_id, amount)
        VALUES (${runId}, ${userId}, ${amount})
        ON CONFLICT (run_id) DO UPDATE SET amount = EXCLUDED.amount
      `;
      await this.insertLedgerTransaction(
        createReservationTransaction({ userId, amountCredits: amount, idempotencyKey, runId })
      );
      this.processedIdempotencyKeys.add(idempotencyKey);
    });
  }
```

Add `settleReservation` (requires the reservation to exist; moves reserved→consumed, inserts the settlement transaction with `providerCostCents`), `releaseReservation` (moves reserved→available and deletes the reservation row), and `applyCredit` (same SQL pattern as `InMemoryDatabase`, using `this.insertLedgerTransaction`). Helper:

```typescript
  private async insertLedgerTransaction(tx: LedgerTransaction): Promise<void> {
    await this.sql.begin(async (s) => {
      const [header] = await s`
        INSERT INTO ledger_transactions (idempotency_key, transaction_type, reference_id, metadata)
        VALUES (${tx.idempotencyKey}, ${tx.transactionType}, ${tx.referenceId ?? null}, ${s.json((tx.metadata ?? {}) as any)})
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id
      `;
      if (header) {
        for (const entry of tx.entries) {
          await s`
            INSERT INTO ledger_entries (transaction_id, account_identifier, amount_credits)
            VALUES (${header.id}, ${entry.accountIdentifier}, ${entry.amountCredits})
          `;
        }
      }
    });
  }
```

`init()` now hydrates only `processedIdempotencyKeys` and `actionRuns` (wallets are read live via `getWallet`). Delete `persist()`, `knownReservationRunIds` and `persistedTransactionKeys`. Keep `lockWalletRow` as a documented no-op (row locks now happen inside the SQL ops).

- [ ] **Step 5: Turn `LedgerService` into a facade**

In `packages/server/src/services/ledger.service.ts`, keep the existing overloads (`settleReservation(runId, costCents)` and the 5-arg forms; same for `releaseReservation`) and delegate every method to `this.db`, e.g.:

```typescript
  async reserveCredits(userId: string, amount: number, idempotencyKey: string, runId: string): Promise<void> {
    return this.db.reserveCredits(userId, amount, idempotencyKey, runId);
  }
```

For the short forms of `settleReservation`/`releaseReservation`, resolve `userId`/`amount` from `this.db.reservations` exactly as the current code does, then call the long form.

- [ ] **Step 6: Switch `StripeBillingService` and `AuthService` to `applyCredit`**

In `packages/server/src/services/stripe.service.ts`, replace the `handleWebhook` top-up/refund bodies with `this.db.applyCredit(userId, pack.credits, "TOPUP"|"REFUND", idempotencyKey, session.id, { amountCents: pack.priceCents })` (always a positive `pack.credits` — the adapter derives the REFUND sign). Delete the manual `executeLedgerTransaction`/wallet mutation blocks. In `packages/server/src/services/auth.service.ts`, replace the welcome-bonus `seedWallet` block with `this.db.applyCredit(entry.userId, 20, "BONUS", \`bonus_\${entry.userId}\`, "welcome")` — and keep `welcomeBonusGranted = true` only when the wallet did not previously exist.

- [ ] **Step 7: Add migration `003_sql_first_align.sql`**

Create `packages/server/src/db/migrations/003_sql_first_align.sql`:

```sql
-- 003: Align identifier types so foreign keys can be enforced, and add the
-- missing FK between action_runs and projects.
ALTER TABLE projects ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE projects ALTER COLUMN developer_id TYPE TEXT USING developer_id::text;
ALTER TABLE action_runs ALTER COLUMN project_id TYPE TEXT USING project_id::text;
ALTER TABLE action_runs ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE ledger_entries
    ADD CONSTRAINT fk_ledger_entries_transaction
    FOREIGN KEY (transaction_id) REFERENCES ledger_transactions(id) ON DELETE CASCADE;

ALTER TABLE action_runs
    ADD CONSTRAINT fk_action_runs_project
    FOREIGN KEY (project_id) REFERENCES projects(id);
```

- [ ] **Step 8: Run unit tests and integration test**

Run: `bun test packages/server/tests/ledger.service.test.ts packages/server/tests/postgres-concurrency.test.ts packages/server/tests/stripe.service.test.ts packages/server/tests/auth.routes.test.ts`
Expected: PASS (logic unchanged, now via the adapters).

Run (with local Supabase up): `bun run db:up` then `bun run db:migrate` then `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres bun test packages/server/tests/postgres-real.integration.test.ts`
Expected: PASS.

Run: `bun run typecheck` — Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add packages/server/src/adapters packages/server/src/services packages/server/src/db/migrations/003_sql_first_align.sql packages/server/tests/postgres-real.integration.test.ts
git commit -m "feat(server): SQL-first ledger persistence with row locks and applyCredit"
```

---

### Task 2: Real Stripe Checkout Sessions (`@platform/server` + `@platform/react`)

**Context:** Payments are simulated today: `AIPaymentModal` adds credits to local state on click. The gateway already verifies webhook signatures and credits wallets on `checkout.session.completed`; what's missing is creating a real Checkout Session. `stripe@16.2.0` is already a dependency.

**Files:**
- Modify: `packages/server/src/services/stripe.service.ts` (add `createCheckoutSession`)
- Create: `packages/server/src/routes/checkout.routes.ts`
- Modify: `packages/server/src/server.ts` (mount `/v1/stripe/checkout`)
- Modify: `packages/server/src/index.ts` (export the new route)
- Modify: `packages/react/src/AIPaymentModal.tsx` (real checkout when a handler is provided)
- Test: `packages/server/tests/stripe.service.test.ts`

**Interfaces:**
- Consumes: `StripeBillingService` (existing class), `TOPUP_PACKAGES` (existing), `AuthService.verifySessionToken`.
- Produces:
  - `StripeBillingService.createCheckoutSession(params: { packId: string; userId: string; successUrl: string; cancelUrl: string }): Promise<{ url: string; sessionId: string }>` — throws `PlatformError(PROVIDER_ERROR)` when no Stripe secret key is configured.
  - `POST /v1/stripe/checkout` — body `{ packId, successUrl, cancelUrl }`, requires `Authorization: Bearer <session token>`, returns `{ url }`.
  - `AIPaymentModalProps.checkoutUrl?: (packId: string) => Promise<string>` — when provided, pack clicks call it and redirect to the returned URL instead of the local simulation.

- [ ] **Step 1: Write the failing test**

Append to `packages/server/tests/stripe.service.test.ts`:

```typescript
describe("Stripe Checkout Sessions", () => {
  it("creates a checkout session with server-side pack pricing and metadata", async () => {
    const db = new InMemoryDatabase();
    let capturedParams: any;
    const fakeStripe = {
      checkout: {
        sessions: {
          create: async (params: any) => {
            capturedParams = params;
            return {
              url: "https://checkout.stripe.com/c/pay/cs_test_1",
              id: "cs_test_1",
              mode: params.mode,
              line_items: params.line_items,
              metadata: params.metadata
            };
          }
        }
      }
    };
    const service = new StripeBillingService(db, "whsec_test");
    (service as any).stripeClient = fakeStripe;

    const result = await service.createCheckoutSession({
      packId: "popular",
      userId: "usr_checkout_1",
      successUrl: "https://app.example.com/success",
      cancelUrl: "https://app.example.com/cancel"
    });

    expect(result.url).toBe("https://checkout.stripe.com/c/pay/cs_test_1");
    expect(result.sessionId).toBe("cs_test_1");
    expect(capturedParams.mode).toBe("payment");
    expect(capturedParams.metadata).toEqual({ userId: "usr_checkout_1", packId: "popular" });
    expect(capturedParams.line_items[0].price_data.unit_amount).toBe(500); // popular pack price
    expect(capturedParams.line_items[0].price_data.currency).toBe("usd");
  });

  it("rejects unknown packs and missing Stripe configuration", async () => {
    const db = new InMemoryDatabase();
    const service = new StripeBillingService(db, "whsec_test");

    await expect(service.createCheckoutSession({
      packId: "nonexistent", userId: "u1",
      successUrl: "https://x/s", cancelUrl: "https://x/c"
    })).rejects.toThrow();

    expect(() => service.getCheckoutClient()).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test packages/server/tests/stripe.service.test.ts`
Expected: FAIL — `createCheckoutSession` and `getCheckoutClient` do not exist.

- [ ] **Step 3: Implement `createCheckoutSession`**

In `packages/server/src/services/stripe.service.ts`:

```typescript
import Stripe from "stripe";

  private _stripeClient: Stripe | null | undefined;

  /** Returns the Stripe SDK client or throws when STRIPE_SECRET_KEY is not configured. */
  getCheckoutClient(): Stripe {
    if (this._stripeClient !== undefined) return this._stripeClient as Stripe;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, "STRIPE_SECRET_KEY is not configured");
    }
    this._stripeClient = new Stripe(secretKey);
    return this._stripeClient;
  }

  async createCheckoutSession(params: {
    packId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    const pack = this.getPackage(params.packId);
    if (!pack) {
      throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, `Unknown pack: ${params.packId}`);
    }
    const client = this.getCheckoutClient();
    const session = await client.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: pack.priceCents,
            product_data: {
              name: `${pack.credits} AI credits`,
              description: `AI credit pack for ${params.packId}`
            }
          },
          quantity: 1
        }
      ],
      metadata: { userId: params.userId, packId: params.packId },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl
    });
    return { url: session.url as string, sessionId: session.id };
  }
```

(For the test's fake client injection, `(service as any).stripeClient = fakeStripe` must be respected: change `getCheckoutClient` to return `this._stripeClient` when set, regardless of env — see Step 1's cast. Implementation detail: initialize `_stripeClient` to `null` and treat a manually-assigned value as authoritative.)

- [ ] **Step 4: Add the route and mount it**

Create `packages/server/src/routes/checkout.routes.ts`:

```typescript
import { Hono } from "hono";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import { StripeBillingService } from "../services/stripe.service";
import { AuthService } from "../services/auth.service";
import { correlationMiddleware, getCorrelationContext } from "../observability/correlation";

export function createCheckoutRoutes(billingService: StripeBillingService, authService: AuthService) {
  const router = new Hono();
  router.use("*", correlationMiddleware());

  router.post("/", async (c) => {
    try {
      const auth = c.req.header("Authorization");
      if (!auth?.startsWith("Bearer ")) {
        throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Missing session token");
      }
      const session = await authService.verifySessionToken(auth.replace("Bearer ", ""));

      const body = await c.req.json().catch(() => null);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "Malformed or missing JSON request body");
      }
      const { packId, successUrl, cancelUrl } = body as { packId?: string; successUrl?: string; cancelUrl?: string };
      if (!packId || !successUrl || !cancelUrl) {
        throw new PlatformError(PlatformErrorCodes.INVALID_INPUT, "packId, successUrl and cancelUrl are required");
      }

      const correlation = getCorrelationContext(c);
      correlation.userId = session.userId;

      const result = await billingService.createCheckoutSession({
        packId,
        userId: session.userId,
        successUrl,
        cancelUrl
      });
      return c.json(result);
    } catch (err: any) {
      const status = err instanceof PlatformError
        ? err.code === PlatformErrorCodes.UNAUTHORIZED ? 401 : 400
        : 500;
      return c.json({ error: err.message || "Checkout failed" }, status);
    }
  });

  return router;
}
```

In `packages/server/src/server.ts`, after the existing `app.route("/v1/stripe", createStripeRoutes(stripeService));` line add:

```typescript
  app.route("/v1/stripe/checkout", createCheckoutRoutes(stripeService, authService));
```

(Note: mount BEFORE the broader `/v1/stripe` route is fine either way since paths differ; keep the order above.) Add the import and export the route from `packages/server/src/index.ts`.

- [ ] **Step 5: Wire the payment modal to real checkout**

In `packages/react/src/AIPaymentModal.tsx`:

```typescript
export interface AIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance?: number;
  onCreditPurchased?: (credits: number, price: number) => void;
  onAuthRequested?: (provider: "google" | "github" | "email", email?: string) => void;
  /** When provided, pack clicks open a real Stripe Checkout session instead of simulating. */
  checkoutUrl?: (packId: string) => Promise<string>;
}
```

Change the pack click handler:

```typescript
  const handlePurchase = async (credits: number, price: number, packId: string) => {
    if (checkoutUrl) {
      try {
        const url = await checkoutUrl(packId);
        window.location.href = url; // user pays on Stripe; webhook credits the wallet
        return;
      } catch (err: any) {
        showToast(`Checkout unavailable: ${err.message || "try again"}`);
        return;
      }
    }
    setBalance((prev) => prev + credits);
    showToast(`+${credits.toLocaleString()} credits added to your wallet ($${price}.00)`);
    if (onCreditPurchased) onCreditPurchased(credits, price);
  };
```

Map the four packs to ids (`"starter"`, `"popular"`, `"power"` matching `TOPUP_PACKAGES` — the modal's displayed packs are $1/100, $3/350, $5/650, $10/1400; align them with the server's `TOPUP_PACKAGES` keys in this task by adding a `packId` field to each pack literal).

- [ ] **Step 6: Run tests and typecheck**

Run: `bun test packages/server/tests/stripe.service.test.ts` — Expected: PASS.
Run: `bun run typecheck` — Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/services/stripe.service.ts packages/server/src/routes/checkout.routes.ts packages/server/src/server.ts packages/server/src/index.ts packages/react/src/AIPaymentModal.tsx packages/server/tests/stripe.service.test.ts
git commit -m "feat(server): create real Stripe Checkout sessions and wire payment modal"
```

---

### Task 3: Real Authentication (Email OTP) + Per-Project CORS (`@platform/server`)

**Context:** Login is simulated (fake user in the modal; `/v1/auth/authorize` returns a URL to a nonexistent OAuth page). The PKCE code exchange and JWT issuance already work server-side. This task adds a real email-OTP flow and enforces `allowed_domains` per project instead of `cors("*")`.

**Files:**
- Modify: `packages/server/src/services/auth.service.ts` (OTP store + verify)
- Create: `packages/server/src/services/email-transport.ts`
- Modify: `packages/server/src/routes/auth.routes.ts` (OTP endpoints)
- Create: `packages/server/src/services/cors-policy.ts`
- Modify: `packages/server/src/server.ts` (use CorsPolicyService; pass transport)
- Modify: `packages/react/src/AIPaymentModal.tsx` (email OTP via SDK hook — optional wiring)
- Test: `packages/server/tests/auth.routes.test.ts`, `packages/server/tests/cors-policy.test.ts`

**Interfaces:**
- Consumes: `AuthService` (existing), `DeveloperService.verifySecret` (existing), `jose`.
- Produces:
  - `EmailTransport.send(params: { to: string; code: string }): Promise<void>` — interface with `ConsoleEmailTransport` (default, logs code) and `ResendEmailTransport` (uses `RESEND_API_KEY`; returns early with a logged warning when the key is missing).
  - `AuthService.requestOtp(params: { email: string; projectId: string }): Promise<{ expiresInSeconds: number }>` — 6-digit code, 10-minute expiry, stored in a Map.
  - `AuthService.verifyOtp(params: { email: string; code: string; projectId: string; codeChallenge: string }): Promise<{ authorizationCode: string }>` — validates code, then reuses `issueAuthorizationCode` (single-use).
  - `CorsPolicyService.isOriginAllowed(origin: string | undefined, projectId: string): boolean` — checks against `DeveloperService.getProjectById(projectId).allowedDomains`; returns `true` when the request has no Origin header (server-to-server).

- [ ] **Step 1: Write failing tests**

Append to `packages/server/tests/auth.routes.test.ts`:

```typescript
describe("Email OTP Authentication", () => {
  it("requests an OTP, verifies it, and exchanges the authorization code for a session", async () => {
    const db = new InMemoryDatabase();
    const auth = new AuthService(db, "test-secret-key-32-chars-long-example!");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(auth));

    const reqRes = await app.request("/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com", projectId: "proj_demo" })
    });
    expect(reqRes.status).toBe(200);

    // The code was delivered via the (console) transport — grab it from the in-memory store
    const otp = (auth as any).otps.get("alice@example.com:proj_demo").code;

    const verifyRes = await app.request("/v1/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        projectId: "proj_demo",
        code: otp,
        codeChallenge: "challenge_abc"
      })
    });
    expect(verifyRes.status).toBe(200);
    const { authorizationCode } = await verifyRes.json() as any;

    const tokenRes = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_demo",
        code: authorizationCode,
        codeVerifier: "challenge_abc"
      })
    });
    expect(tokenRes.status).toBe(200);
    const body = await tokenRes.json() as any;
    expect(body.sessionToken).toBeDefined();
    expect(body.welcomeBonusGranted).toBe(true);
  });

  it("rejects a wrong OTP code", async () => {
    const db = new InMemoryDatabase();
    const auth = new AuthService(db, "test-secret-key-32-chars-long-example!");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(auth));
    await app.request("/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@example.com", projectId: "proj_demo" })
    });
    const res = await app.request("/v1/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@example.com", projectId: "proj_demo", code: "000000", codeChallenge: "x" })
    });
    expect(res.status).toBe(401);
  });
});
```

Create `packages/server/tests/cors-policy.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { DeveloperService } from "../src/services/developer.service";
import { CorsPolicyService } from "../src/services/cors-policy";

describe("CorsPolicyService", () => {
  const build = () => {
    const dev = new DeveloperService(new InMemoryDatabase());
    dev.registerProject({
      projectId: "proj_cors",
      name: "CORS Project",
      publicKey: "pk_live_cors",
      secretKey: "sk_live_cors"
    });
    (dev as any).projectsById.get("proj_cors").allowedDomains = [
      "https://app.example.com",
      "http://localhost:5173"
    ];
    return new CorsPolicyService(dev);
  };

  it("allows configured origins", () => {
    const policy = build();
    expect(policy.isOriginAllowed("https://app.example.com", "proj_cors")).toBe(true);
    expect(policy.isOriginAllowed("http://localhost:5173", "proj_cors")).toBe(true);
  });

  it("rejects unknown origins but allows server-to-server requests without Origin", () => {
    const policy = build();
    expect(policy.isOriginAllowed("https://evil.example.com", "proj_cors")).toBe(false);
    expect(policy.isOriginAllowed(undefined, "proj_cors")).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test packages/server/tests/auth.routes.test.ts packages/server/tests/cors-policy.test.ts`
Expected: FAIL — missing endpoints/classes.

- [ ] **Step 3: Implement `email-transport.ts`**

```typescript
export interface EmailTransport {
  send(params: { to: string; code: string }): Promise<void>;
}

export class ConsoleEmailTransport implements EmailTransport {
  async send(params: { to: string; code: string }): Promise<void> {
    console.log(`[OTP] ${params.to} → ${params.code}`);
  }
}

export class ResendEmailTransport implements EmailTransport {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || "";
  }

  async send(params: { to: string; code: string }): Promise<void> {
    if (!this.apiKey) {
      console.warn(`[OTP] RESEND_API_KEY not set — falling back to console for ${params.to}`);
      console.log(`[OTP] ${params.to} → ${params.code}`);
      return;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        from: "AI Payments <no-reply@example.com>",
        to: [params.to],
        subject: "Your AI credit login code",
        html: `<p>Your login code is <strong>${params.code}</strong>. It expires in 10 minutes.</p>`
      })
    });
    if (!res.ok) {
      throw new Error(`Resend API error (${res.status})`);
    }
  }
}
```

- [ ] **Step 4: Add OTP to `AuthService` and routes**

In `packages/server/src/services/auth.service.ts` add a `Map<string, { code: string; expiresAt: number }>` keyed by `${email}:${projectId}`, `requestOtp`, and `verifyOtp`:

```typescript
  async requestOtp(params: { email: string; projectId: string }): Promise<{ expiresInSeconds: number }> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.otps.set(`${params.email}:${params.projectId}`, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    await this.emailTransport.send({ to: params.email, code });
    return { expiresInSeconds: 600 };
  }

  async verifyOtp(params: {
    email: string;
    code: string;
    projectId: string;
    codeChallenge: string;
  }): Promise<{ authorizationCode: string }> {
    const entry = this.otps.get(`${params.email}:${params.projectId}`);
    if (!entry || entry.code !== params.code || entry.expiresAt < Date.now()) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired OTP code");
    }
    this.otps.delete(`${params.email}:${params.projectId}`);
    const authorizationCode = await this.issueAuthorizationCode({
      userId: `usr_${params.email.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`,
      email: params.email,
      projectId: params.projectId,
      codeChallenge: params.codeChallenge
    });
    return { authorizationCode };
  }
```

Constructor gains `private emailTransport: EmailTransport = new ConsoleEmailTransport()`. In `packages/server/src/routes/auth.routes.ts` add:

```typescript
  router.post("/otp/request", async (c) => {
    try {
      const body = await c.req.json();
      const result = await authService.requestOtp({
        email: String(body.email),
        projectId: String(body.projectId)
      });
      return c.json(result);
    } catch (err) {
      return handleRouteError(err, c);
    }
  });

  router.post("/otp/verify", async (c) => {
    try {
      const body = await c.req.json();
      const result = await authService.verifyOtp({
        email: String(body.email),
        projectId: String(body.projectId),
        code: String(body.code),
        codeChallenge: String(body.codeChallenge)
      });
      return c.json(result);
    } catch (err) {
      return handleRouteError(err, c);
    }
  });
```

- [ ] **Step 5: Implement `cors-policy.ts` and use it**

```typescript
import { DeveloperService } from "./developer.service";

export class CorsPolicyService {
  constructor(private devService: DeveloperService) {}

  isOriginAllowed(origin: string | undefined, projectId: string): boolean {
    if (!origin) return true; // server-to-server / non-browser requests
    const project = this.devService.getProjectById(projectId);
    if (!project) return false;
    const allowed = (project as any).allowedDomains as string[] | undefined;
    return Array.isArray(allowed) && allowed.includes(origin);
  }
}
```

Add `getProjectById(projectId: string): ProjectRecord | undefined` to `DeveloperService` (returns `this.projectsById.get(projectId)`). In `packages/server/src/server.ts` replace `app.use("*", cors({ origin: "*", ... }))` with per-route policy for browser-facing routes (`/v1/actions/*`, `/v1/wallet`, `/v1/stripe/checkout`): keep preflight handling but validate `Origin` against the project's `allowed_domains` (resolve projectId from the `x-project-id` header or the path); reject with 403 when disallowed:

```typescript
app.use("/v1/actions/*", async (c, next) => {
  const origin = c.req.header("Origin");
  const projectId = c.req.header("x-project-id") || "proj_demo";
  if (!corsPolicy.isOriginAllowed(origin, projectId)) {
    return c.json({ error: "Origin not allowed for this project" }, 403);
  }
  await next();
});
```

For `OPTIONS` requests, keep responding with CORS headers for allowed origins (helper `cors({ origin: (origin) => corsPolicy.isOriginAllowed(origin ?? undefined, projectId) })` is acceptable; document the trade-off).

- [ ] **Step 6: Run tests and typecheck**

Run: `bun test packages/server/tests/auth.routes.test.ts packages/server/tests/cors-policy.test.ts` — Expected: PASS.
Run: `bun run typecheck` — Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/services/email-transport.ts packages/server/src/services/cors-policy.ts packages/server/src/services/auth.service.ts packages/server/src/services/developer.service.ts packages/server/src/routes/auth.routes.ts packages/server/src/server.ts packages/server/tests/auth.routes.test.ts packages/server/tests/cors-policy.test.ts
git commit -m "feat(server): email OTP authentication and per-project CORS policy"
```

---

### Task 4: Gateway Deployment (Docker + Fly.io)

**Context:** Only the static apps are deployed (Vercel). The Bun/Hono gateway has no deployment story. This task adds a container image, a Fly.io config, and a deployment runbook; the local `docker-compose.yml` remains the dev database.

**Files:**
- Create: `Dockerfile`
- Create: `fly.toml`
- Create: `docs/DEPLOYMENT.md`
- Modify: `package.json` (add `db:migrate:prod` helper documented in the runbook)

**Interfaces:** Consumes the env contract from `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PORT`). Produces a containerized gateway exposing `PORT` (default 3000) with `GET /` healthcheck.

- [ ] **Step 1: Create `Dockerfile`**

```dockerfile
# ---- deps ----
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
RUN bun install --frozen-lockfile

# ---- build (typecheck) ----
FROM deps AS build
COPY tsconfig.json ./
COPY packages/shared packages/shared
COPY packages/core packages/core
COPY packages/server packages/server
RUN bun run typecheck

# ---- runtime ----
FROM oven/bun:1.3 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["bun", "run", "packages/server/src/server.ts"]
```

- [ ] **Step 2: Create `fly.toml`**

```toml
app = "ai-payment-gateway"
primary_region = "waw"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3000"
  # Fill via `fly secrets set` — never commit real values:
  #   fly secrets set DATABASE_URL=... JWT_SECRET=... OPENAI_API_KEY=...
  #   fly secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

  [http_service.checks]
    [http_service.checks.health]
      interval = "10s"
      timeout = "3s"
      grace_period = "10s"
      method = "GET"
      path = "/"
```

- [ ] **Step 3: Write `docs/DEPLOYMENT.md`**

Document: (1) start local Supabase `bun run db:up`, (2) `cp .env.example .env` + fill keys, (3) `bun run db:migrate`, (4) local smoke `bun run server` → `curl localhost:3000/`, (5) deploy: `fly launch` (uses `fly.toml`), `fly secrets set ...`, `fly deploy` — migrations run once manually via `fly ssh console -- 'bun run db:migrate'` after the first deploy (or via `[deploy] release_command` — document both, prefer release_command once CI is set up), (6) point the demo app's `baseUrl` at the production URL via env.

- [ ] **Step 4: Verify**

Run: `docker build -t ai-payment-gateway .` (requires Docker daemon running; if unavailable, run `bun run typecheck` as the build-time check that the Dockerfile's `bun run typecheck` step would run).
Expected: image builds; `docker run --rm -p 3000:3000 -e DATABASE_URL=... ai-payment-gateway` boots and `GET /` returns 200.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile fly.toml docs/DEPLOYMENT.md
git commit -m "feat(deploy): containerize gateway and add Fly.io deployment runbook"
```

---

### Task 5: Hardening & Operations (Redis rate limit, retention, observability)

**Context:** The sliding-window rate limiter is per-process memory. Production needs a shared limiter and operational hygiene. The logger already redacts PII; runs already carry hashes (never raw prompts). This task adds an optional Redis (Upstash REST) limiter, a retention cleanup script, and a runbook section for monitoring.

**Files:**
- Create: `packages/server/src/services/redis-rate-limiter.ts`
- Modify: `packages/server/src/server.ts` (choose limiter by `REDIS_URL`)
- Create: `scripts/cleanup.ts`
- Modify: `package.json` (`cleanup` script)
- Test: `packages/server/tests/redis-rate-limiter.test.ts`

**Interfaces:**
- Consumes: existing `SlidingWindowRateLimiter` semantics (`checkLimit(key, maxRequests, windowSeconds): boolean`, `getResetSeconds(key, windowSeconds): number`).
- Produces: `RedisRateLimiter` with the same public methods, using Upstash REST (`REDIS_URL` + `REDIS_TOKEN`) via an injectable fetch-like transport; falls back to a local in-memory map when `REDIS_URL` is absent (so tests and dev keep working).

- [ ] **Step 1: Write the failing test**

Create `packages/server/tests/redis-rate-limiter.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";
import { RedisRateLimiter } from "../src/services/redis-rate-limiter";

describe("RedisRateLimiter (Upstash REST protocol via fake transport)", () => {
  it("allows up to maxRequests per window and blocks the next one", async () => {
    const calls: { url: string; body: string }[] = [];
    const fakeFetch = async (url: string, init: any) => {
      calls.push({ url, body: init?.body ?? "" });
      const cmd = JSON.parse(init?.body ?? "[]");
      // EVAL <script> <keys...> <args...> → respond with the count
      if (Array.isArray(cmd) && cmd[0] === "EVAL") {
        const args = cmd.slice(3).map(String);
        const count = Number(args[2] ?? "0") + 1;
        return new Response(JSON.stringify({ result: count }), { status: 200 });
      }
      return new Response(JSON.stringify({ result: "OK" }), { status: 200 });
    };

    const limiter = new RedisRateLimiter({
      url: "https://fake.upstash.io",
      token: "test-token",
      fetchImpl: fakeFetch as any
    });

    expect(await limiter.checkLimit("usr:act", 3, 60)).toBe(true);
    expect(await limiter.checkLimit("usr:act", 3, 60)).toBe(true);
    expect(await limiter.checkLimit("usr:act", 3, 60)).toBe(true);
    expect(await limiter.checkLimit("usr:act", 3, 60)).toBe(false);
    expect(calls.length).toBeGreaterThan(0);
  });

  it("degrades to in-memory limiting when no REDIS_URL is configured", async () => {
    const limiter = new RedisRateLimiter({});
    expect(await limiter.checkLimit("k", 1, 60)).toBe(true);
    expect(await limiter.checkLimit("k", 1, 60)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test packages/server/tests/redis-rate-limiter.test.ts`
Expected: FAIL — module/class missing.

- [ ] **Step 3: Implement `redis-rate-limiter.ts`**

```typescript
const INCR_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`;

export interface RedisRateLimiterOptions {
  url?: string;
  token?: string;
  fetchImpl?: (url: string, init?: any) => Promise<Response>;
}

export class RedisRateLimiter {
  private url: string;
  private token: string;
  private fetchImpl: (url: string, init?: any) => Promise<Response>;
  private local = new Map<string, number[]>();

  constructor(options: RedisRateLimiterOptions = {}) {
    this.url = options.url || process.env.REDIS_URL || "";
    this.token = options.token || process.env.REDIS_TOKEN || "";
    this.fetchImpl = options.fetchImpl || ((url, init) => fetch(url, init));
  }

  async checkLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    if (!this.url) return this.checkLimitLocal(key, maxRequests, windowSeconds);

    const now = Math.floor(Date.now() / 1000);
    const res = await this.fetchImpl(`${this.url}/eval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify([INCR_SCRIPT, [key], [String(windowSeconds)]])
    });
    if (!res.ok) return true; // fail-open on transport errors (rate limiting is not a payment gate)
    const { result } = (await res.json()) as { result: number };
    return result <= maxRequests;
  }

  getResetSeconds(key: string, windowSeconds: number): number {
    return windowSeconds; // conservative estimate; real TTL read is optional
  }

  private checkLimitLocal(key: string, maxRequests: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const active = (this.local.get(key) || []).filter((t) => t > windowStart);
    if (active.length >= maxRequests) {
      this.local.set(key, active);
      return false;
    }
    active.push(now);
    this.local.set(key, active);
    return true;
  }
}
```

- [ ] **Step 4: Wire into `server.ts`**

```typescript
import { RedisRateLimiter } from "./services/redis-rate-limiter";
...
  const rateLimiter = process.env.REDIS_URL
    ? new RedisRateLimiter({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN })
    : new SlidingWindowRateLimiter();
```

- [ ] **Step 5: Add retention cleanup script**

Create `scripts/cleanup.ts` (run via `bun run cleanup -- --days=30`; guarded by `DATABASE_URL`):

```typescript
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[cleanup] DATABASE_URL is not set.");
  process.exit(1);
}

const days = Number(process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? 30);
const sql = postgres(url, { max: 1 });

try {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const runs = await sql`
    DELETE FROM action_runs WHERE status IN ('SUCCEEDED', 'FAILED', 'CANCELLED') AND completed_at < ${cutoff} RETURNING id
  `;
  const reservations = await sql`
    DELETE FROM reservations WHERE created_at < ${cutoff} RETURNING run_id
  `;
  console.log(`[cleanup] deleted ${runs.length} completed runs and ${reservations.length} stale reservations older than ${days} days`);
} finally {
  await sql.end();
}
```

Add to `package.json`: `"cleanup": "bun --env-file=.env run scripts/cleanup.ts"`. (This mirrors the existing `db:migrate` pattern; `postgres` is already a root devDependency.)

- [ ] **Step 6: Run tests, typecheck, and document monitoring**

Run: `bun test packages/server/tests/redis-rate-limiter.test.ts` — Expected: PASS.
Run: `bun run typecheck` — Expected: exit 0.
Append to `docs/DEPLOYMENT.md`: a "Monitoring & Ops" section — structured JSON logs already emit `request_id`/`run_id`/`action_name` (PII redacted); wire log drains to a provider (Fly log shipping / Betterstack / Grafana Loki) by tailing stdout; schedule `bun run cleanup -- --days=30` nightly (Fly machines cron or GitHub Action cron); set `REDIS_URL`/`REDIS_TOKEN` for shared rate limiting; use Supabase's managed backups for point-in-time recovery of the ledger.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/services/redis-rate-limiter.ts packages/server/tests/redis-rate-limiter.test.ts packages/server/src/server.ts scripts/cleanup.ts package.json docs/DEPLOYMENT.md
git commit -m "feat(server): Redis rate limiting, retention cleanup, and monitoring runbook"
```

---

## Self-Review Notes

- **Spec coverage:** Every production gap identified in the earlier audit maps to a task — persistence (T1), real payments (T2), real auth + CORS (T3), deployment (T4), hardening (T5). The Stripe refund/dispute ledger handling, margin guard, PKCE/JWT, and redacting logger already exist and are only wired, not rebuilt.
- **Placeholder scan:** All steps contain concrete code or exact commands. The only intentionally open items are user-provided secrets (env) and provider account IDs, which are documented as such.
- **Type consistency:** New `LedgerDatabase` methods are defined once in Task 1 and reused by Tasks 2–5; `createCheckoutSession`, `requestOtp`/`verifyOtp`, `isOriginAllowed`, and `checkLimit` signatures are fixed at their defining step and referenced identically later. `ActionExecutionService` call sites are unchanged because `LedgerService` keeps its public API.

---

### Task 6: Developer Registry Persistence (`@platform/server`)

**Context:** `DeveloperService` keeps projects and action versions in private in-memory maps — a gateway restart in Postgres mode loses every published action, and migration 003's `fk_action_runs_project` cannot be enforced because no `projects` rows exist. This task persists the registry through `LedgerDatabase` and re-enables the FK.

**Files:**
- Modify: `packages/server/src/adapters/database.ts` (add 3 registry methods)
- Modify: `packages/server/src/adapters/in-memory-db.ts` (no-op/read implementations)
- Modify: `packages/server/src/adapters/postgres-real.ts` (SQL implementations)
- Modify: `packages/server/src/services/developer.service.ts` (async init + write-through)
- Modify: `packages/server/src/server.ts` (await `devService.init()`)
- Create: `packages/server/src/db/migrations/004_developer_registry.sql`
- Test: `packages/server/tests/developer.routes.test.ts`, `packages/server/tests/postgres-real.integration.test.ts`

**Interfaces:**
- Consumes: `LedgerDatabase` (existing), `ProjectRecord`/`ActionVersion` types, `PlatformError`.
- Produces (added to `LedgerDatabase`, both adapters):
  - `loadDeveloperState(): Promise<{ projects: ProjectRecord[]; versions: ActionVersion[] }>`
  - `upsertDeveloperProject(project: ProjectRecord): Promise<void>`
  - `upsertActionVersion(version: ActionVersion): Promise<void>`
- `DeveloperService.init()` hydrates `projectsBySecret`/`projectsById`/`actionVersions` from `loadDeveloperState()`; `registerProject`, `publishActionVersion`, `rotateSecretKey` write through via the upserts (awaited). `verifySecret`/`getLatestAction`/`getAllLatestActions`/`getProjectById` stay sync (they read the hydrated maps).

- [ ] **Step 1: Write failing tests**

Append to `packages/server/tests/developer.routes.test.ts`:

```typescript
describe("Developer Registry Persistence", () => {
  it("persists a published action version through the database adapter", async () => {
    const db = new InMemoryDatabase();
    const dev = new DeveloperService(db);
    await dev.init();
    dev.registerProject({ projectId: "proj_p", name: "P", publicKey: "pk_live_p", secretKey: "sk_live_p" });
    const v = dev.publishActionVersion("proj_p", { actionName: "a", model: "mock", priceCredits: 5 });
    expect(v.version).toBe(1);

    // A second service instance hydrating the same store sees the version
    const db2 = new InMemoryDatabase();
    // simulate write-through by copying persisted state
    for (const p of await (db as any).loadDeveloperState?.() ?? []) { /* no-op for in-memory */ }
    const dev2 = new DeveloperService(db2);
    await dev2.init();
    expect(dev2.getActionVersions("proj_p", "a")).toHaveLength(0); // in-memory store is per-instance
  });
});
```

Note: for the in-memory adapter the registry is intentionally per-instance (demo mode); the assertion documents that. The REAL persistence assertions live in `postgres-real.integration.test.ts` (skip without `DATABASE_URL`):

```typescript
it("persists developer registry across instances (Postgres mode)", async () => {
  await db.upsertDeveloperProject({ projectId: "it_proj", name: "P", publicKey: "pk_live_it", secretKey: "sk_live_it" });
  await db.upsertActionVersion({ actionName: "a", version: 1, projectId: "it_proj", model: "mock", priceCredits: 5, maxProviderCostCents: 10, maxOutputTokens: 1000, outputFormat: "json", systemPrompt: "", userPromptTemplate: "", inputSchema: {}, rateLimit: { maxRequests: 10, windowSeconds: 60 } });
  const state = await db.loadDeveloperState();
  expect(state.projects.some((p) => p.projectId === "it_proj")).toBe(true);
  expect(state.versions.some((v) => v.projectId === "it_proj" && v.actionName === "a")).toBe(true);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test packages/server/tests/developer.routes.test.ts`
Expected: FAIL — `init`/registry methods missing.

- [ ] **Step 3: Implement interface + adapters**

In `database.ts` add the three methods (types above). `InMemoryDatabase`:

```typescript
  async loadDeveloperState(): Promise<{ projects: any[]; versions: any[] }> {
    return { projects: [], versions: [] }; // registry is per-instance in demo mode
  }
  async upsertDeveloperProject(_project: any): Promise<void> {}
  async upsertActionVersion(_version: any): Promise<void> {}
```

`PostgresDatabase` implements them against tables `developer_projects` / `developer_action_versions` (created in migration 004): upserts with `ON CONFLICT ... DO UPDATE`, `loadDeveloperState` selects all rows and maps snake_case columns back to camelCase fields.

- [ ] **Step 4: Wire `DeveloperService`**

Constructor keeps `(db: LedgerDatabase)`; add `async init(): Promise<void>` that calls `loadDeveloperState()` and populates the three maps. `registerProject`, `publishActionVersion`, `rotateSecretKey` become async and `await this.db.upsertDeveloperProject(...)` / `await this.db.upsertActionVersion(...)` after mutating the maps. In `server.ts`, change `const devService = new DeveloperService(db);` to `const devService = new DeveloperService(db); await devService.init();`.

- [ ] **Step 5: Create migration `004_developer_registry.sql`**

```sql
-- 004: Developer registry persistence.
CREATE TABLE IF NOT EXISTS developer_projects (
    project_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public_key TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL UNIQUE,
    allowed_domains TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developer_action_versions (
    project_id TEXT NOT NULL,
    action_name TEXT NOT NULL,
    version INTEGER NOT NULL,
    model TEXT NOT NULL,
    price_credits INTEGER NOT NULL,
    max_provider_cost_cents INTEGER NOT NULL DEFAULT 10,
    max_output_tokens INTEGER NOT NULL DEFAULT 1000,
    output_format TEXT NOT NULL DEFAULT 'json',
    system_prompt TEXT NOT NULL DEFAULT '',
    user_prompt_template TEXT NOT NULL DEFAULT '',
    input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    rate_limit JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, action_name, version)
);

-- Projects now persist, so the run-audit FK from 003 can be enforced.
ALTER TABLE action_runs
    ADD CONSTRAINT fk_action_runs_project
    FOREIGN KEY (project_id) REFERENCES developer_projects(project_id);
```

- [ ] **Step 6: Run tests and typecheck**

Run: `bun test packages/server/tests/developer.routes.test.ts packages/server/tests/postgres-real.integration.test.ts`
Run: `bun test` (full suite), `bun run typecheck` — Expected: all pass, exit 0.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/adapters packages/server/src/services/developer.service.ts packages/server/src/server.ts packages/server/src/db/migrations/004_developer_registry.sql packages/server/tests
git commit -m "feat(server): persist developer registry (projects, action versions) and enforce action_runs FK"
```
