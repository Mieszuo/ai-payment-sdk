# Landing Page & Ecosystem Unification (`apps/landing`) Design Specification

**Status:** Approved  
**Author:** AI Payment Platform Core Team  
**Date:** 2026-08-27  
**App Location:** `apps/landing`  
**Dev Port:** `5173` (`bun --filter landing dev` or `bun run landing`)  

---

## 1. Executive Summary & Value Proposition

The **Landing Page** (`apps/landing`) is the public storefront and unified gateway for the entire platform. It ties together the Developer Dashboard (`:5174`), Developer Documentation (`:5175`), and live Gateway (`:3000`) into a coherent developer hub.

### Core Headline & Positioning
> **The Universal AI Wallet & Monetization Engine for Indie Developers**  
> *Add paid AI features to your web and mobile applications in 3 lines of frontend code. Zero backend required, zero Stripe setup, and zero LLM cost liability. Users pay via a universal credit wallet, our Gateway executes models securely, and you earn profit on the margin spread.*

---

## 2. Monorepo Port & Hub Topology

All subpages and applications are interconnected through a unified port and routing scheme:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                MONOREPO ECOSYSTEM HUB                                  │
├───────────────────────┬───────────────────────┬────────────────────────────────────────┤
│ Application           │ Port / URL            │ Purpose & Role                         │
├───────────────────────┼───────────────────────┼────────────────────────────────────────┤
│ apps/landing          │ http://localhost:5173 │ Marketing storefront, live demo, CTAs  │
│ apps/dashboard        │ http://localhost:5174 │ Developer Console, Keys, Telemetry     │
│ apps/docs             │ http://localhost:5175 │ Developer Documentation & Reference    │
│ packages/server       │ http://localhost:3000 │ Gateway REST API & PKCE Auth Server    │
└───────────────────────┴───────────────────────┴────────────────────────────────────────┘
```

---

## 3. Visual Design System

- **Color Palette**: Obsidian black canvas (`#000000` / `#09090b`), dark graphite panels (`#121214`), hairline borders (`border-white/[0.08]`), electric blue accents (`#2563eb` / `#3b82f6`), amber warning highlights (`#f59e0b`), emerald profit indicators (`#10b981`).
- **Typography**: `Inter` for crisp body copy and headings, `JetBrains Mono` for commands, keys, code, and financial figures.
- **Icons & Graphics**: 100% vector SVG icons from `lucide-react`. Zero Unicode emojis in UI and prose.
- **Micro-Interactions**: Smooth backdrop blur, glassmorphism cards (`.glass-panel`), instant clipboard copy indicators, and interactive calculation sliders.

---

## 4. Landing Page Structure & Component Map

### 4.1 Global Sticky Navigation (`LandingHeader.tsx`)
- Logo: Gradient icon + "AI Payment Platform"
- Nav Links: Features, Economics, Architecture, Documentation (`:5175`), Developer Console (`:5174`)
- Action Buttons: `[ Ask AI / Try in ]` (opens agent modal) and `[ Open Console → ]`

### 4.2 Hero Section (`HeroSection.tsx`)
- Pill Badge: `"v1.0 Production Ready • Zero-Backend AI Integration"`
- Main Title: *"Monetize AI Features in 3 Lines of Code. Zero Backend Required."*
- Subtitle: *"Stop building Stripe integrations, user auth, and LLM billing pipelines for every side-project. Users pay via a universal wallet, you set the credit price, and earn automated payouts on the margin spread."*
- CTAs:
  - Primary: `[ Open Developer Console ]` (`http://localhost:5174`)
  - Secondary: `[ Read Documentation ]` (`http://localhost:5175`)
  - Tertiary: `[ Test Interactive Action Demo ↓ ]`
- Package Manager Terminal Switcher: Live reactive tabs (`bun add`, `npm i`, `pnpm add`, `yarn add`) with 1-click copy.

### 4.3 "Ask AI / Try in" Agent Bar (`TryInBar.tsx`)
- Embedded directly below the Hero: One-click export for Cursor (`.cursorrules`), Claude Code (`claude mcp add`), ChatGPT (OpenAPI Action Schema), Windsurf, and MCP Servers.

### 4.4 Interactive Profit & Volume Slider Calculator (`ProfitCalculator.tsx`)
- Sliders:
  - Monthly Active Users (e.g. 100 to 50,000)
  - Action Executions per User (e.g. 1 to 50)
  - Price per Action in Credits (e.g. 10 to 50 credits = \$0.10 to \$0.50)
  - Underlying Model (GPT-4o Mini, Gemini 1.5 Flash, GPT-4o)
- Real-time Output:
  - Gross Revenue (\$0.01 per credit)
  - Upstream Provider Cost (deducted automatically)
  - Estimated Monthly Developer Net Profit (e.g. `+$2,140.00 / mo`)
  - Guaranteed Gross Margin (e.g. `94%`)

### 4.5 Before vs After Architectural Comparison (`ArchitectureComparison.tsx`)
- **Traditional Architecture (400+ lines)**: Next.js API route + Stripe webhook handler + PostgreSQL users & subscriptions table + OpenAI API key management + Rate limiting + Error fallback handling.
- **AI Payment Platform (3 lines)**:
  ```typescript
  import { createAI } from "@platform/sdk";
  const ai = createAI({ project: "pk_live_demo123" });
  const result = await ai.action("optimize-resume", { inputs: { cvText } });
  ```

### 4.6 3-Step Developer & User Lifecycle (`HowItWorksSection.tsx`)
- **Step 1: Developer Defines Action (1 min)**: Declare system prompt, template variables `{{var}}`, and price in credits in the Developer Dashboard.
- **Step 2: User Authenticates via Widget (30s)**: Drop `<ai-payment-widget>` onto your page. Users receive 20 free welcome credits on sign-in (RFC 7636 PKCE).
- **Step 3: Automated Settlement & Payouts**: The Gateway locks credits, executes the model with Margin Guard, and settles the margin profit.

### 4.7 Feature Grid & Platform Invariants (`FeatureGrid.tsx`)
- **Zero-Trust Prompts**: Prompts and provider keys are never exposed to the client bundle.
- **Double-Entry Financial Ledger**: Invariant mathematical balance ($\sum = 0$) preventing phantom credits.
- **PostgreSQL Row-Level Locking**: `SELECT ... FOR UPDATE` serialization preventing double-spending race conditions.
- **Margin Guard**: Hard cost ceiling preventing runaway token loops or provider price spikes.
- **Immutable Versioning**: Zero-downtime rollbacks across immutable $v1, v2, v3$ releases.
- **Stripe Webhook Defense**: Cryptographic HMAC-SHA256 signature verification and balanced double-entry refunds (`charge.refunded`).

### 4.8 Interactive Live Action Demo Card (`LiveActionDemo.tsx`)
- An interactive mini-demo directly on the landing page where visitors can type sample text and click "Run optimize-resume" to witness instant simulated execution with latency and cost telemetry!

### 4.9 Global Footer (`LandingFooter.tsx`)
- Ecosystem Sitemap connecting Landing (`:5173`), Dashboard (`:5174`), Docs (`:5175`), and Gateway (`:3000`).

---

## 5. Testing & Verification Strategy

1. `apps/landing/tests/scaffold.test.ts`: Validates project files, package.json, and design tokens.
2. `apps/landing/tests/calculator.test.ts`: Validates mathematical revenue and margin calculation formulas across user/execution sliders.
3. `apps/landing/tests/components.test.ts`: Validates Hero, Try In bar, Architecture comparison, and Live demo cards without emojis.
4. `apps/landing/tests/layout.test.ts`: Validates root Landing App shell and full-page layout mounting.
5. End-to-end typecheck and build: `bun run typecheck` (`tsc --build`) and `bun --filter landing build`.
