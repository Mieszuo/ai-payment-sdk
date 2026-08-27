# Developer Dashboard Design Specification

- **Date:** 2026-08-27
- **Target Application:** `apps/dashboard`
- **Design System:** Vercel / searchlize.com inspired Utility-First Dark Interface (90% Precision / 10% Glass Glow)
- **Tech Stack:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Bun

---

## 1. Overview & Objectives

The Developer Dashboard is the mission-control application for developers administering projects, publishing managed actions, analyzing execution telemetry, and auditing integrity within the AI Payment Platform.

### Core Pillars
1. **Multi-Tenant Project Context**: Strict top-level project scoping (`projectId`), isolating keys, actions, runs, and settings.
2. **One-Time Secret Lifecycle**: Developer secret keys (`sk_live_*`) are displayed in plaintext **only once** upon generation or rotation, then permanently masked (`sk_live_••••••••`).
3. **Action Registry with Margin Economics**: Full prompt authoring with automatic variable detection (`{{cvText}}`), JSON schema validation, token pricing per 1M, credit pricing, and calculated gross margin (`Margin Guard`).
4. **Sandboxed Playground (Mock vs Live)**: Explicit switch between zero-cost `Mock` dry-run validation and `Live` model execution.
5. **Unified Audit Log**: Comprehensive request attempt history tracking `SUCCEEDED`, `FAILED`, and `RATE_LIMITED` events with SHA-256 **Integrity Verification** (non-repudiation terminology removed).
6. **Explicit Environment Mode**: Clear boundary between `Demo Mode` (in-memory simulator) and `Production Mode` (fails with explicit error banner if the gateway is unreachable; no silent fallback to mock data).
7. **Dedicated Settings**: Dedicated administration surface for allowed CORS origins, secret rotation, project metadata, and danger zones.

---

## 2. Visual Design System

### 2.1 Aesthetic Principles: 90% Precision / 10% Glass
- **Focus on Tooling**: Clean, distraction-free developer interface rather than decorative marketing eye candy. High information density, clear contrast, and instant visual hierarchy.
- **Strictly No Emojis**: 100% vector SVG icons from `lucide-react` (`Key`, `Cpu`, `Zap`, `ShieldCheck`, `Terminal`, `Copy`, `Check`, `Activity`, `Sparkles`, `RefreshCw`, `Play`, `Sliders`, `Settings`, `AlertTriangle`).
- **Pill Badges & Sharp Radii**:
  - Main Cards: `rounded-xl` (12px) with `border border-white/[0.08] bg-zinc-950/60 backdrop-blur-md`.
  - Buttons & Inputs: `rounded-lg` (8px) with `bg-zinc-900 border-zinc-800 focus:border-blue-500`.
  - Status Indicators & Pills: `rounded-full` with subtle ambient status dots.

### 2.2 Color Palette & Surfaces
- **Canvas Base**: Pure obsidian black `#000000` / `#09090b`.
- **Borders**: Hairline `border-white/[0.08]` (hover: `border-white/[0.16]`, focus: `border-blue-500`).
- **Accents**:
  - Primary Brand: Vercel monochrome / blue highlight (`#0070f3`).
  - Active/Success: Emerald `#10b981` (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`).
  - Warning/Rate-Limited: Amber `#f59e0b` (`bg-amber-500/10 text-amber-400 border-amber-500/20`).
  - Failed/Error: Rose `#f43f5e` (`bg-rose-500/10 text-rose-400 border-rose-500/20`).
- **Typography**:
  - UI Sans: `Inter`, system-ui with crisp weights (`font-normal`, `font-medium`, `font-semibold`).
  - Monospace: `JetBrains Mono` / `SF Mono` for IDs, keys, hashes, schema editors, and JSON payloads.

---

## 3. Architecture & Views (`apps/dashboard`)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] AI Payment Gateway   [Connected]   Project: Searchlize  [User]   │
├────────────────────────────────────────────────────────────────────────┤
│ Overview  │  Actions  │  Playground  │  Audit Logs  │  Settings         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                              ACTIVE VIEW                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Top Navigation & Shell
- **Header**:
  - Logo with subtle highlight.
  - Connection status badge:
    - `Connected to Gateway` (Pulsing emerald dot, `http://localhost:3000`)
    - `Demo Mode` (Amber badge, self-contained local mock store)
    - `Gateway Unavailable` (Red badge with reconnect button in Production Mode)
  - Project Selector dropdown (`Searchlize`, `Resume AI`, `+ New Project`).
- **Tab Navigation**: `Overview`, `Actions`, `Playground`, `Audit Logs`, `Settings`.

---

### 3.2 View 1: Overview & Financial Telemetry
- **Financial & Volume Telemetry Cards**:
  1. **Total Executions**: Count + % change vs previous period.
  2. **Credits Consumed**: Total credits spent across all actions.
  3. **Provider Spend**: Exact dollar cost incurred from LLM providers (e.g. `$12.43`).
  4. **Gross Margin**: Calculated platform margin `%` ($1 - \frac{\text{Provider Cost}}{\text{Credit Revenue Value}}$).
  5. **Average Latency**: Rolling median response latency (e.g. `842ms`).
- **Quick Links & Health**:
  - Active action versions in production.
  - Rate limit rejections in last 24 hours.

---

### 3.3 View 2: Actions Registry & Margin Economics
- **Actions List**:
  - Card list showing: Action Name, Active Version ($v1, v2$), Model (`gpt-4o-mini`, `gemini-1.5-flash`), Price in credits (⚡ 15), Max Provider Cost ($0.05), Calculated Margin (`~66%`), and Status (`Active`).
- **Action Publisher / Version Editor (Slide-Over Drawer)**:
  - **Action Metadata**: Name, description.
  - **Model Selection & Unit Economics**:
    - Selector displays model unit costs:
      - `GPT-4o-mini`: Input $0.15 / 1M, Output $0.60 / 1M.
      - `Gemini 1.5 Flash`: Input $0.075 / 1M, Output $0.30 / 1M.
    - Interactive economics card:
      ```text
      Price:              15 credits ($0.15 equivalent)
      Max Provider Cost:  $0.05
      Calculated Margin:  ~66% minimum margin guard
      ```
  - **Prompt Engineering**:
    - System Prompt textarea.
    - User Prompt Template editor:
      - Automatically parses `{{variables}}` from template text (e.g. `{{cvText}}`, `{{jobTitle}}`).
      - Lists detected variables below the editor with configurable data types (`string`, `number`, `boolean`).
  - **Output Specification**:
    - Radio toggle: `Text` vs `Structured JSON`.
    - JSON Schema editor with instant JSON syntax & schema validation indicator (`Valid JSON Schema`).
  - **Rate Limiting**:
    - `maxRequests` per `windowSeconds` (e.g. 10 req / 60s).

---

### 3.4 View 3: Live Playground (Mock vs Live)
- **Split-Pane Layout**:
  - **Left Pane (Request Configuration)**:
    - Action and Version picker.
    - **Execution Mode Toggle**:
      - `[ Mock ]`: Zero provider cost, zero credits consumed, deterministic structural validation.
      - `[ Live ]`: Real model execution, uses developer test credits, live provider latency.
    - **Dry-Run Validation Checklist**:
      - Input schema `Valid`
      - Detected variables populated
      - Output schema `Valid`
      - Model availability `OK`
      - Margin guard `Verified`
    - Dynamic variable input fields.
    - `[ Execute Action ]` button.
  - **Right Pane (Response & Telemetry)**:
    - Syntax-highlighted JSON or text output.
    - Performance telemetry badges:
      - `Duration: 842ms`
      - `Tokens: 1,284 (Prompt: 920, Completion: 364)`
      - `Cost: $0.0031`
      - `Run ID: ar_7f2aff...`
      - `Integrity Digest: e4a8b1...`

---

### 3.5 View 4: Audit Logs & Integrity Verification
- **Unified Request Event Stream**:
  - Tracks both `action_runs` (`SUCCEEDED`, `FAILED`) and upstream gateway events (`RATE_LIMITED`).
  - Table Columns:
    - `Timestamp`: ISO time with relative tooltip.
    - `Status`: Pill badge (`SUCCEEDED` [emerald], `FAILED` [rose], `RATE_LIMITED` [amber]).
    - `Action`: Name and version (e.g. `optimize-resume v3`).
    - `Prompt Digest`: SHA-256 hash prefix (`db1b957f...`).
    - `Input Digest`: SHA-256 hash prefix (`1cfd8acc...`).
    - `Latency`: Total execution duration.
- **Audit Detail Drawer (Integrity Verification)**:
  - Clicking any row opens side inspection:
    - **Integrity Verification Card**:
      ```text
      Prompt SHA-256:   db1b957f0e7f9a22417819e9... [Verified match]
      Input SHA-256:    1cfd8acc9c6008548d2aba5f... [Verified match]
      ```
    - Correlation tags: `requestId`, `userId`, `projectId`, `actionName`.
    - Lifecycle timestamps: `reservedAt`, `executedAt`, `settledAt`.

---

### 3.6 View 5: Project Settings & Key Management
- **General Project Settings**:
  - Project Name & ID (`proj_demo`).
  - Allowed CORS Origins / Domains (`https://myapp.com`, `http://localhost:5173`).
- **API Keys & Credentials**:
  - **Public Key (`pk_live_*`)**:
    - Visible in full (`pk_live_demo123`), 1-click clipboard copy.
  - **Secret Key (`sk_live_*`)**:
    - Masked permanently after initial creation: `sk_live_••••••••••••••••••••`.
    - `[Copy Key]` button (copies masked or active token).
    - `[Rotate Secret Key]` button:
      - Opens Confirmation Dialog: *"Rotating will immediately invalidate the existing secret key."*
      - On rotation: Displays the newly generated `sk_live_...` **once** with an alert:
        > *"Copy this secret key now. You will not be able to view it again."*
- **Danger Zone**:
  - Flush action cache.
  - Delete project.

---

## 4. State Management & Runtime Modes

### 4.1 Mode Separation
- **`DEMO_MODE`**:
  - Used for standalone reviews, presentations, and local offline testing.
  - Operates on an in-memory seed store; changes persist locally in `localStorage`.
  - Shows clear `Demo Mode` pill in the header.
- **`PRODUCTION_MODE`**:
  - Connects to Gateway URL (`http://localhost:3000` or production host).
  - If the Gateway is unreachable, displays an **explicit error banner**: *"Unable to reach AI Payment Gateway at http://localhost:3000"*, with a retry action.
  - **NEVER** silently falls back to mock data during real operations to prevent developer confusion.

---

## 5. Verification Plan

1. **Static Type Safety**: `tsc --build` in `apps/dashboard` passes with 0 diagnostics.
2. **Build Verification**: `bun run --filter dashboard build` generates clean production assets in `dist/`.
3. **Playground Verification**: Both `Mock` and `Live` modes execute and render formatted outputs with telemetry.
4. **Secret Key Verification**: Rotation dialog reveals secret key once, enforces dismissal acknowledgement, and masks subsequent displays.
5. **Action Publisher Verification**: Variable parsing from `{{vars}}`, margin calculation, and submission to `/v1/developer/actions`.
