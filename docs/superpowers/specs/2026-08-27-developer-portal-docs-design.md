# Developer Portal & Documentation (`apps/docs`) Design Specification

**Status:** Approved  
**Author:** AI Payment Platform Core Team  
**Date:** 2026-08-27  
**App Location:** `apps/docs`  
**Dev Port:** `5175` (`bun --filter docs dev` or `bun run docs`)  

---

## 1. Executive Summary & Philosophy

The **Developer Portal & Documentation** (`apps/docs`) is the canonical developer-facing resource for the AI Payment Platform. Rather than serving as an internal architecture dump, it is structured as a **task-oriented, three-tier developer journey**:

```text
1. GUIDES     → "I want to build a working AI feature in 3 minutes."
2. CONCEPTS   → "I want to understand wallets, credits, actions, and settlement."
3. REFERENCE  → "I need the exact SDK parameters, HTTP contracts, and error codes."
   + ADVANCED → "I want deep architectural details on ledgers, PKCE, and row locking."
```

### Design System Invariants
- **Aesthetic**: Dark obsidian palette (`#000000` / `#09090b`), hairline borders (`border-white/[0.08]`), micro glassmorphism (`backdrop-blur-xl`).
- **Icons**: 100% vector icons from `lucide-react`. Zero Unicode emojis in UI and prose.
- **Typography**: `Inter` for prose and headings, `JetBrains Mono` / monospace for code, keys, digests, and HTTP endpoints.
- **AI-Native Interactivity**: Global **"Try in AI"** export modal supplying formatted context for Cursor, Claude Code, ChatGPT, Windsurf, and MCP servers.

---

## 2. Global Navigation & Layout Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] AI Payment Docs   [Search Docs...]   [Try in AI]   Dashboard   GitHub   [Version v1.0]   │
├───────────────────────────────┬─────────────────────────────────────────────────────────────────┤
│ SIDEBAR NAVIGATION (6 Roots)  │ MAIN ARTICLE CONTENT                                            │
│                               │                                                                 │
│ 1. GETTING STARTED            │ # 3-Minute Quickstart                                           │
│    - Introduction             │ Follow this guide to authenticate users, display balance, and  │
│    - Installation             │ execute a managed AI action in 3 minutes.                       │
│    - 3-Minute Quickstart      │                                                                 │
│    - Vanilla TypeScript       │ [Package Manager Switcher: bun | npm | pnpm | yarn]             │
│    - React / Next.js          │ bun add @platform/sdk                                           │
│    - First Managed Action     │                                                                 │
│    - Production Checklist     │ [Interactive Economics Calculator Widget]                       │
│                               │ Action Price: [15] credits | Provider Cost: [$0.004]           │
│ 2. CONCEPTS                   │ Gross Margin: 97.3% (Guarded)                                   │
│    - How Platform Works       │                                                                 │
│    - Projects & Envs          │ ```typescript                                                   │
│    - Wallets & Credits        │ import { createAI } from "@platform/sdk";                       │
│    - Managed Actions          │ const ai = createAI({ project: "pk_live_demo123" });            │
│    - Immutable Versions       │ const res = await ai.action("optimize-resume", { inputs });     │
│    - Two-Phase Settlement     │ ```                                                             │
│    - Public vs Secret Keys    │                                                                 │
│    - Mock vs Live Mode        │ [Previous: Installation]            [Next: Vanilla TypeScript] │
│                               ├─────────────────────────────────────────────────────────────────┤
│ 3. SDK & REACT REFERENCE      │ ON THIS PAGE (Table of Contents)                                │
│ 4. MANAGED ACTIONS ENGINE     │ - Prerequisites                                                 │
│ 5. GATEWAY API REFERENCE      │ - Step 1: Install SDK                                           │
│ 6. ADVANCED & ARCHITECTURE    │ - Step 2: Initialize Client                                     │
│                               │ - Step 3: Run Action                                            │
└───────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 3. Interactive Components Specification

### 3.1 `PackageManagerSwitcher`
- Persistent package manager toggle (`bun`, `npm`, `pnpm`, `yarn`).
- Selecting a tab automatically updates all code blocks across the documentation in real time via React state.

### 3.2 `TryInModal` & Global "Ask AI / Try in"
Triggered from the top navigation bar or quickstart cards. Displays tabs for:
1. **Cursor (`.cursorrules`)**:
   - Ready-to-copy rules file teaching the AI agent about `@platform/sdk`, error handling (`INSUFFICIENT_CREDITS`), and custom actions.
2. **Claude Code (`claude mcp add`)**:
   - CLI command and configuration adding the platform's Managed Actions directly as native Claude tools.
3. **ChatGPT (Custom GPTs / OpenAPI)**:
   - Exportable OpenAPI 3.1 action schema pointing to `/v1/actions/{name}/execute`.
4. **Windsurf (`.windsurfrules`)**:
   - Tailored system prompt and SDK usage rules for Cascade.
5. **Model Context Protocol (MCP Server)**:
   - `mcpServers` JSON block for Claude Desktop or standalone MCP clients.

### 3.3 `EconomicsCalculator`
- Live interactive calculator demonstrating the spread between user price and model cost:
  - Inputs: Action price in credits, Provider unit cost (e.g. GPT-4o-mini, Gemini Flash).
  - Outputs: Revenue value (\$0.01 per credit), provider cost, dollar profit, and Gross Margin %.

### 3.4 `ErrorCodeTable`
Comprehensive error matrix documenting every client and gateway error:
- Columns: Error Code, HTTP Status, Trigger Condition, Recommended Client Recovery Strategy.
- Filterable by category (Client, Gateway, Provider, Auth).

---

## 4. Documentation Content Taxonomy (All 6 Sections)

### Section 1: Getting Started
- **Introduction**: Platform value proposition, zero-backend frontend integration, managed action security.
- **Installation**: Multi-package manager install commands (`@platform/sdk`, `@platform/react`).
- **3-Minute Quickstart**: End-to-end tutorial (Setup $\to$ Auth $\to$ Action $\to$ Display).
- **Vanilla TypeScript**: Standalone HTML/TS setup with `<ai-payment-widget>`.
- **React / Next.js**: App Router & Pages Router setup with `<AIProvider>`.
- **First Managed Action**: Step-by-step creation and calling of `optimize-resume`.
- **Production Checklist**: Allowed CORS domains, secret key safeguarding, rate limit verification.

### Section 2: Concepts
- **How the Platform Works**: The 5-party model (Developer, User, Browser Widget, Gateway, LLM Provider).
- **Projects & Environments**: Project IDs, Sandbox vs Production isolation.
- **Users & Wallets**: Universal AI Wallets, balance synchronization, welcome credits.
- **Managed Actions**: Encapsulated prompt pipelines shielded from client tampering.
- **Immutable Versions & Rollbacks**: Version tagging ($v1, v2, v3$), non-destructive rollbacks, audit immutability.
- **Two-Phase Reservations & Settlement**: Credit reservation before provider call, settlement upon completion, auto-rollback on failure.
- **Public vs Secret Keys**: `pk_live_*` (client safe) vs `sk_live_*` (confidential publishing).
- **Mock Mode vs Live Mode**: Offline testing with zero latency/cost vs real provider execution.

### Section 3: SDK & React Reference
- **`@platform/sdk`**:
  - `createAI(options)`: `project`, `baseUrl`, `mock`, `storage`.
  - `ai.action(name, { inputs, mode })`: Execution params, return values, type safety.
  - `ai.getWallet()` & `ai.subscribeBalance(callback)`: Real-time credit monitoring.
  - **Complete Error Reference**: `INSUFFICIENT_CREDITS`, `RATE_LIMITED`, `UNAUTHORIZED`, `INVALID_INPUT`, `ACTION_NOT_FOUND`, `PROVIDER_ERROR`, `OUTPUT_VALIDATION_FAILED`, `ABORTED`.
- **`@platform/react`**:
  - `<AIProvider project="..." baseUrl="...">`
  - `useAI()`, `useWallet()`, `useAction(actionName)`
- **`<ai-payment-widget>`**: Shadow DOM custom element attributes, methods, and styling variables.

### Section 4: Managed Actions Engine
- **Defining Actions**: Action configuration object, model selection.
- **Prompt Templates & Variables**: Mustache variables `{{varName}}`, sanitization, syntax.
- **Input & Output JSON Schemas**: Enforcing structured model output via JSON schema contracts.
- **Pricing & Margin Guard**: Setting prices, defining max provider cost, automated cost bounding.
- **Rate Limiting**: Sliding-window rate limiters, HTTP 429 response, `Retry-After` header.
- **Fallback Models**: Resilient provider fallback (e.g. Gemini 1.5 Flash $\to$ GPT-4o Mini).
- **Publishing & Rollbacks**: CLI & Developer API publishing, immutable version numbers.

### Section 5: Gateway API Reference
- **Authentication**: `POST /v1/auth/authorize` (code challenge), `POST /v1/auth/token` (verifier exchange).
- **Action Execution**: `POST /v1/actions/:name/execute` (headers, payload, correlation ID).
- **Wallet**: `GET /v1/wallet` (bearer auth, available and reserved credits).
- **Developer Management**: `POST /v1/developer/actions`, `GET /v1/developer/actions/:name`.
- **Stripe Webhooks**: `POST /v1/stripe/webhook` (HMAC signature header, supported events).
- **Standard Envelope & Headers**: `x-request-id`, `Retry-After`, standardized error JSON format.

### Section 6: Advanced & Architecture
- **Zero-Trust Security Model**: Client never handles raw API keys or provider tokens.
- **RFC 7636 PKCE Implementation**: SHA-256 code challenge generation and verification.
- **Double-Entry Ledger Invariants**: Mathematical balance guarantee ($\sum \text{amountCredits} = 0$).
- **PostgreSQL Row-Level Locking**: `SELECT ... FOR UPDATE` preventing parallel balance overdraw.
- **Stripe Webhook Signatures & Refund Accounting**: HMAC verification and balanced double-entry `REFUND` transactions.
- **Cryptographic Audit Trail**: Deterministic SHA-256 prompt and input digests in `action_runs`.

---

## 5. Monorepo Integration & Verification

- **Workspace**: `apps/docs`
- **Port**: `5175`
- **Dependencies**: React 19, `react-dom`, `lucide-react`, `tailwindcss` (v4), `@tailwindcss/vite`, `vite`, `typescript`.
- **Cross-Links**:
  - Developer Dashboard header updated with direct "Documentation" link to `http://localhost:5175`.
  - Root `package.json` updated with `"docs": "bun --filter docs dev"`.
- **Automated Verification**:
  - `apps/docs/tests/docs-scaffold.test.ts`: Validates app structure, router, and design tokens.
  - `apps/docs/tests/try-in-modal.test.ts`: Validates AI agent context export formatting (Cursor, Claude, ChatGPT, MCP).
  - `apps/docs/tests/economics-calc.test.ts`: Validates margin calculator math and bounds.
  - `apps/docs/tests/content.test.ts`: Validates complete rendering of all 6 sections and sub-articles.
  - Full build verification: `bun --filter docs build` and `tsc --build`.
