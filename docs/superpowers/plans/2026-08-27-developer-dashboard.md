# Developer Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, utility-first Developer Dashboard (`apps/dashboard`) in a dark glassmorphism design system inspired by Vercel and searchlize.com (90% precision / 10% glass glow), featuring multi-tenant project management, one-time secret key rotation, action registry with margin economics, a sandboxed mock/live playground, and audit logs with SHA-256 integrity verification.

**Architecture:** A lightweight single-page application built with React 19, Vite, Tailwind CSS, and Lucide Icons in `apps/dashboard`, consuming the Hono Gateway API (`packages/server`) via typed HTTP client with strict separation between `PRODUCTION_MODE` (fail-fast with explicit banners) and `DEMO_MODE` (self-contained local mock store).

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Lucide React (`lucide-react`), TypeScript 5.5+, Bun.

## Global Constraints

- Runtime & Build System: Bun (`bun install`, `bun test`, `bun run typecheck`).
- Strict TypeScript: 100% strict typing without `any` bypasses.
- Aesthetics: 90% Precision / 10% Glass; dark palette (`#000000`/`#09090b`), hairline borders (`border-white/[0.08]`), `rounded-xl` and `rounded-2xl` containers, zero emojis (Lucide icons only).
- Security: Developer secrets (`sk_live_*`) are displayed in plaintext ONLY ONCE upon creation or rotation with irreversible dismissal warning. Subsequently permanently masked as `sk_live_••••••••`.
- Playground: Clear separation between `Mock` (zero cost/credits dry-run) and `Live` (real model provider & test credits) with pre-execution validation checklist.
- Environment: Clear visual indicator of `Connected to Gateway` vs `Demo Mode` vs `Gateway Unavailable` (no silent fallbacks to mock data in production mode).

---

### Task 1: Dashboard App Scaffolding & Design System Tokens (`apps/dashboard`)

**Files:**
- Create: `apps/dashboard/package.json`
- Create: `apps/dashboard/vite.config.ts`
- Create: `apps/dashboard/tsconfig.json`
- Create: `apps/dashboard/index.html`
- Create: `apps/dashboard/src/main.tsx`
- Create: `apps/dashboard/src/index.css`
- Modify: `package.json`
- Test: `apps/dashboard/tests/scaffold.test.ts`

**Interfaces:**
- Produces:
  - Vite application bundle configured with React and Tailwind CSS v4.
  - Root CSS defining `.glass-panel`, `.hairline-border`, `.mono-code`, and dark palette variables.
  - Workspace script `bun run dashboard` launching Vite dev server on port 5174.

- [ ] **Step 1: Write failing scaffold test**

```typescript
// apps/dashboard/tests/scaffold.test.ts
import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Dashboard App Scaffolding", () => {
  it("verifies required configuration and stylesheet files exist", () => {
    const root = join(import.meta.dir, "..");
    expect(existsSync(join(root, "package.json"))).toBe(true);
    expect(existsSync(join(root, "vite.config.ts"))).toBe(true);
    expect(existsSync(join(root, "index.html"))).toBe(true);
    expect(existsSync(join(root, "src/main.tsx"))).toBe(true);
    expect(existsSync(join(root, "src/index.css"))).toBe(true);

    const css = readFileSync(join(root, "src/index.css"), "utf-8");
    expect(css).toContain("glass-panel");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/dashboard/tests/scaffold.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Dashboard scaffolding and styling**

Create `apps/dashboard/package.json`:
```json
{
  "name": "dashboard",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^1.16.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.2"
  }
}
```

Create `apps/dashboard/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174
  }
});
```

Create `apps/dashboard/src/index.css`:
```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  --bg-base: #09090b;
  --panel-bg: rgba(24, 24, 27, 0.65);
  --border-hairline: rgba(255, 255, 255, 0.08);
}

body {
  margin: 0;
  background-color: var(--bg-base);
  color: #f4f4f5;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.glass-panel {
  background-color: var(--panel-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-hairline);
  border-radius: 0.75rem;
}

.hairline-border {
  border-color: var(--border-hairline);
}

.mono-code {
  font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Monaco, Consolas, monospace;
}
```

Create `apps/dashboard/index.html` and `apps/dashboard/src/main.tsx`.  
Update root `package.json` to include `"dashboard": "bun --filter dashboard dev"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/dashboard/tests/scaffold.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard package.json
git commit -m "feat(dashboard): scaffold dashboard app with vite, tailwind v4, and design tokens"
```

---

### Task 2: Type System, Gateway API Client & Mode Switcher (`apps/dashboard`)

**Files:**
- Create: `apps/dashboard/src/types/index.ts`
- Create: `apps/dashboard/src/lib/api.ts`
- Test: `apps/dashboard/tests/api.test.ts`

**Interfaces:**
- Produces:
  - `ProjectConfig`: `{ projectId, name, publicKey, secretKeyMasked, allowedDomains }`
  - `ActionItem`: `{ actionName, version, model, priceCredits, maxProviderCostCents, systemPrompt, userPromptTemplate, rateLimit, status }`
  - `AuditLogEvent`: `{ id, timestamp, status: 'SUCCEEDED' | 'FAILED' | 'RATE_LIMITED', actionName, version, promptHash, inputHash, latencyMs, userId }`
  - `FinancialTelemetry`: `{ totalRuns, creditsConsumed, providerSpendCents, grossMarginPercent, medianLatencyMs }`
  - `DashboardApiClient`: methods `checkGatewayHealth()`, `getActions()`, `publishAction()`, `rotateSecretKey()`, `executeAction()`, `getLogs()`, `getTelemetry()`.
  - Supports explicit `PRODUCTION_MODE` vs `DEMO_MODE`.

- [ ] **Step 1: Write failing API client test**

```typescript
// apps/dashboard/tests/api.test.ts
import { describe, it, expect } from "bun:test";
import { createDashboardApiClient } from "../src/lib/api";

describe("Dashboard API Client & Mode Separation", () => {
  it("operates in Demo Mode when Gateway is offline without throwing unhandled crashes", async () => {
    const client = createDashboardApiClient({
      gatewayUrl: "http://localhost:9999", // dead port
      mode: "DEMO_MODE"
    });

    const actions = await client.getActions("proj_demo");
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].actionName).toBe("optimize-resume");
  });

  it("throws explicit error in Production Mode when Gateway is offline", async () => {
    const client = createDashboardApiClient({
      gatewayUrl: "http://localhost:9999",
      mode: "PRODUCTION_MODE"
    });

    let threw = false;
    try {
      await client.getActions("proj_demo");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Gateway unreachable");
    }
    expect(threw).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/dashboard/tests/api.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Types and DashboardApiClient**

Implement `apps/dashboard/src/types/index.ts` and `apps/dashboard/src/lib/api.ts` with:
- Type definitions.
- Seeded demo store (`optimize-resume`, `generate-cover-letter`, realistic execution audit log events).
- Fail-fast production error propagation.
- SHA-256 utility for client-side integrity validation.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/dashboard/tests/api.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/types/index.ts apps/dashboard/src/lib/api.ts apps/dashboard/tests/api.test.ts
git commit -m "feat(dashboard): implement type definitions, gateway api client, and demo/production mode switcher"
```

---

### Task 3: Shell Navigation, Project Selector & Settings View with One-Time Secret Rotation (`apps/dashboard`)

**Files:**
- Create: `apps/dashboard/src/context/DashboardContext.tsx`
- Create: `apps/dashboard/src/components/layout/AppHeader.tsx`
- Create: `apps/dashboard/src/components/views/SettingsView.tsx`
- Create: `apps/dashboard/src/components/common/SecretKeyModal.tsx`
- Test: `apps/dashboard/tests/settings.test.ts`

**Interfaces:**
- Produces:
  - `DashboardContext`: provides `activeProject`, `projects`, `mode`, `gatewayStatus`, `activeTab`, and action handlers.
  - `AppHeader`: renders project switcher, connection status badge (Connected, Demo Mode, Offline), and tab buttons (`Overview`, `Actions`, `Playground`, `Logs`, `Settings`).
  - `SettingsView`: renders project name, allowed CORS domains, public key copy, permanently masked secret key (`sk_live_••••••••`), and rotate secret key trigger.
  - `SecretKeyModal`: modal displaying the raw secret key **once** with acknowledgement checkbox / button ("I have securely copied this key. I understand it cannot be displayed again.").

- [ ] **Step 1: Write failing Settings and Secret Key test**

```typescript
// apps/dashboard/tests/settings.test.ts
import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { SecretKeyModal } from "../src/components/common/SecretKeyModal";

describe("Secret Key One-Time Modal & Masking", () => {
  it("renders secret key with warning and copy button", () => {
    const html = renderToStaticMarkup(
      React.createElement(SecretKeyModal, {
        rawSecretKey: "sk_live_test_new_secret_key_123",
        isOpen: true,
        onClose: () => {}
      })
    );

    expect(html).toContain("sk_live_test_new_secret_key_123");
    expect(html).toContain("cannot be displayed again");
    expect(html).not.toContain("••••••••");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/dashboard/tests/settings.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement DashboardContext, AppHeader, SettingsView, and SecretKeyModal**

Implement components utilizing Tailwind classes and Lucide vector icons (`ShieldCheck`, `AlertTriangle`, `Copy`, `Check`, `RotateCcw`, `Globe`, `Key`).  
Ensure secret key is permanently masked once modal closes.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/dashboard/tests/settings.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/context/DashboardContext.tsx apps/dashboard/src/components/layout/AppHeader.tsx apps/dashboard/src/components/views/SettingsView.tsx apps/dashboard/src/components/common/SecretKeyModal.tsx apps/dashboard/tests/settings.test.ts
git commit -m "feat(dashboard): implement header shell, project switcher, and settings view with one-time secret rotation"
```

---

### Task 4: Overview View with Financial & Volume Telemetry (`apps/dashboard`)

**Files:**
- Create: `apps/dashboard/src/components/views/OverviewView.tsx`
- Create: `apps/dashboard/src/components/common/MetricCard.tsx`
- Test: `apps/dashboard/tests/overview.test.ts`

**Interfaces:**
- Produces:
  - `OverviewView`: renders 5 KPI cards: Total Executions, Credits Consumed, Provider Spend ($), Gross Margin %, Median Latency (ms).
  - Quickstart section with copyable `@platform/sdk` code snippet.
  - Active Action versions summary table.

- [ ] **Step 1: Write failing Overview test**

```typescript
// apps/dashboard/tests/overview.test.ts
import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { MetricCard } from "../src/components/common/MetricCard";

describe("Overview Telemetry & Metrics", () => {
  it("renders metric cards with formatted financial values", () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricCard, {
        title: "Provider Spend",
        value: "$12.43",
        badge: "8.2% margin guard",
        variant: "default"
      })
    );

    expect(html).toContain("Provider Spend");
    expect(html).toContain("$12.43");
    expect(html).toContain("8.2% margin guard");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/dashboard/tests/overview.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement MetricCard and OverviewView**

Implement `MetricCard.tsx` and `OverviewView.tsx`.  
Connect to `DashboardContext` to display live or demo telemetry metrics with precision styling.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/dashboard/tests/overview.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/components/common/MetricCard.tsx apps/dashboard/src/components/views/OverviewView.tsx apps/dashboard/tests/overview.test.ts
git commit -m "feat(dashboard): implement overview view with financial telemetry, gross margin, and quickstart cards"
```

---

### Task 5: Action Registry with Margin Economics & Variable Parser (`apps/dashboard`)

**Files:**
- Create: `apps/dashboard/src/lib/parser.ts`
- Create: `apps/dashboard/src/components/views/ActionsView.tsx`
- Create: `apps/dashboard/src/components/actions/ActionDrawer.tsx`
- Test: `apps/dashboard/tests/actions.test.ts`

**Interfaces:**
- Produces:
  - `extractTemplateVariables(template: string): string[]`: parses `{{variableName}}` tokens from prompt text.
  - `calculateMargin(priceCredits: number, maxProviderCostCents: number): number`: computes margin percentage.
  - `ActionsView`: lists registered actions with version, model, credit price, and margin badge.
  - `ActionDrawer`: slide-over publisher drawer with model unit costs, dynamic variable preview, JSON schema editor with syntax check, and rate limit fields.

- [ ] **Step 1: Write failing template variable parser and margin test**

```typescript
// apps/dashboard/tests/actions.test.ts
import { describe, it, expect } from "bun:test";
import { extractTemplateVariables, calculateMargin } from "../src/lib/parser";

describe("Action Template Variable Parser & Margin Economics", () => {
  it("extracts unique mustache variables from prompt templates", () => {
    const template = "Analyze CV for candidate {{candidateName}} applying for {{jobTitle}}. CV:\n{{cvText}}\nConfirm with {{candidateName}}.";
    const vars = extractTemplateVariables(template);
    expect(vars).toEqual(["candidateName", "jobTitle", "cvText"]);
  });

  it("calculates minimum gross margin correctly", () => {
    // 15 credits = $0.15 revenue value; maxProviderCostCents = 5 ($0.05) -> (0.15 - 0.05) / 0.15 = 66.67%
    const margin = calculateMargin(15, 5);
    expect(margin).toBe(67);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/dashboard/tests/actions.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement Parser, ActionDrawer, and ActionsView**

Implement:
- `apps/dashboard/src/lib/parser.ts`
- `apps/dashboard/src/components/actions/ActionDrawer.tsx`
- `apps/dashboard/src/components/views/ActionsView.tsx`
Submit newly published versions to `api.publishAction()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/dashboard/tests/actions.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/lib/parser.ts apps/dashboard/src/components/actions/ActionDrawer.tsx apps/dashboard/src/components/views/ActionsView.tsx apps/dashboard/tests/actions.test.ts
git commit -m "feat(dashboard): implement action registry, variable template parser, and publisher with margin economics"
```

---

### Task 6: Live Playground Testbench (Mock vs Live) (`apps/dashboard`)

**Files:**
- Create: `apps/dashboard/src/components/views/PlaygroundView.tsx`
- Create: `apps/dashboard/src/components/playground/DryRunValidator.tsx`
- Test: `apps/dashboard/tests/playground.test.ts`

**Interfaces:**
- Produces:
  - `PlaygroundView`: split-pane testbench:
    - Left pane: Action selector, `Mock` vs `Live` toggle, dynamic input fields derived from template variables, `DryRunValidator` checklist.
    - Right pane: Formatted output, duration (ms), token usage, provider cost, and run ID.

- [ ] **Step 1: Write failing playground test**

```typescript
// apps/dashboard/tests/playground.test.ts
import { describe, it, expect } from "bun:test";
import { validateDryRun } from "../src/components/playground/DryRunValidator";

describe("Playground Dry-Run Validation", () => {
  it("validates input variables against required template fields", () => {
    const requiredVars = ["cvText", "jobTitle"];
    const inputs = { cvText: "Senior TS dev" }; // missing jobTitle

    const result = validateDryRun({ requiredVars, inputs, outputFormat: "json" });
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toEqual(["jobTitle"]);
  });

  it("passes validation when all fields are supplied", () => {
    const requiredVars = ["cvText"];
    const inputs = { cvText: "Senior TS dev" };

    const result = validateDryRun({ requiredVars, inputs, outputFormat: "json" });
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/dashboard/tests/playground.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement DryRunValidator and PlaygroundView**

Implement `DryRunValidator.tsx` and `PlaygroundView.tsx`.  
In `Mock` mode, returns smart structured mock responses instantaneously with 0 credits consumed. In `Live` mode, calls `api.executeAction()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/dashboard/tests/playground.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/components/playground/DryRunValidator.tsx apps/dashboard/src/components/views/PlaygroundView.tsx apps/dashboard/tests/playground.test.ts
git commit -m "feat(dashboard): implement live playground testbench with mock/live execution and dry-run validation"
```

---

### Task 7: Audit Logs & Cryptographic Integrity Verification (`apps/dashboard`)

**Files:**
- Create: `apps/dashboard/src/components/views/AuditLogsView.tsx`
- Create: `apps/dashboard/src/components/logs/IntegrityDrawer.tsx`
- Test: `apps/dashboard/tests/logs.test.ts`

**Interfaces:**
- Produces:
  - `AuditLogsView`: table of request attempts displaying status pill (`SUCCEEDED`, `FAILED`, `RATE_LIMITED`), action name & version, SHA-256 prompt & input digests, latency, timestamp.
  - `IntegrityDrawer`: side inspection verifying input & prompt SHA-256 hashes, execution lifecycle transitions, and correlation IDs (`requestId`, `userId`, `projectId`).

- [ ] **Step 1: Write failing audit logs and integrity test**

```typescript
// apps/dashboard/tests/logs.test.ts
import { describe, it, expect } from "bun:test";
import { verifyHashIntegrity } from "../src/components/logs/IntegrityDrawer";

describe("Audit Logs Integrity Verification", () => {
  it("verifies SHA-256 integrity match between payload and recorded hash", async () => {
    const payload = "Candidate CV:\nSenior Developer";
    const expectedHash = "b7289d04733c7fbeec1a49df67d1ab315a67c51480fef8b89091981a8da0cf6f"; // SHA-256 of payload

    const matches = await verifyHashIntegrity(payload, expectedHash);
    expect(matches).toBe(true);

    const tampered = await verifyHashIntegrity(payload + " tampered", expectedHash);
    expect(tampered).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/dashboard/tests/logs.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement IntegrityDrawer and AuditLogsView**

Implement `IntegrityDrawer.tsx` and `AuditLogsView.tsx`.  
Connect to `api.getLogs()` to render unified request streams and detailed cryptographic audit drawers.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/dashboard/tests/logs.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/src/components/logs/IntegrityDrawer.tsx apps/dashboard/src/components/views/AuditLogsView.tsx apps/dashboard/tests/logs.test.ts
git commit -m "feat(dashboard): implement unified audit logs stream and cryptographic integrity verification drawer"
```

---

### Task 8: End-to-End Build & Monorepo Integration (`apps/dashboard`)

**Files:**
- Create: `apps/dashboard/src/App.tsx`
- Modify: `apps/dashboard/src/main.tsx`
- Test: `apps/dashboard/tests/e2e-dashboard.test.ts`

**Interfaces:**
- Connects all 5 views (`Overview`, `Actions`, `Playground`, `Audit Logs`, `Settings`) into the root `App.tsx` shell.
- Full workspace verification: `bun test`, `bun run typecheck`, `bun run build`.

- [ ] **Step 1: Write E2E integration test**

```typescript
// apps/dashboard/tests/e2e-dashboard.test.ts
import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { App } from "../src/App";

describe("Dashboard Full Shell Integration", () => {
  it("renders the root application shell with all navigation tabs and header", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    expect(html).toContain("AI Payment Gateway");
    expect(html).toContain("Overview");
    expect(html).toContain("Actions");
    expect(html).toContain("Playground");
    expect(html).toContain("Audit Logs");
    expect(html).toContain("Settings");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/dashboard/tests/e2e-dashboard.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement App.tsx and mount all views**

Implement `App.tsx` coordinating the views and state from `DashboardContext`.  
Ensure build scripts in `apps/dashboard/package.json` compile cleanly.

- [ ] **Step 4: Run full workspace verification**

Run: `bun test`  
Expected: All tests pass across the monorepo.

Run: `bun run typecheck`  
Expected: `tsc --build` exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard
git commit -m "feat(dashboard): wire root application shell, mount all views, and complete dashboard integration"
```
