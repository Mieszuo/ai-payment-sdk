# Developer Dashboard Design Specification

- **Date:** 2026-08-27
- **Target Application:** `apps/dashboard`
- **Design System:** Vercel / searchlize.com inspired Dark Glassmorphism
- **Tech Stack:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Bun

---

## 1. Overview & Objectives

The Developer Dashboard is the mission control center for developers integrating the AI Payment Platform into their applications. It provides:
1. **API Key & Project Administration**: Secure visibility and rotation of client public keys (`pk_live_*`) and server secret keys (`sk_live_*`).
2. **Managed Action Registry**: Authoring, versioning ($v1, v2, \dots$), and parameterizing managed AI actions (prompts, pricing in credits, margin guards, and rate limits).
3. **Live Playground / Testbench**: In-browser sandbox to test actions against the live Gateway or smart mock engine, validating inputs, outputs, token consumption, and latency.
4. **Cryptographic Audit Logs (`action_runs`)**: Real-time inspection of action execution snapshots, status transitions, SHA-256 prompt & input hashes, providing complete auditing transparency.

---

## 2. Visual Design System

### 2.1 Aesthetic Principles
- **Vercel / searchlize.com Aesthetic**: High-contrast, dark minimalist canvas with razor-sharp micro-borders, translucent glassmorphism surfaces, and gentle ambient backdrops.
- **Strictly No Emojis**: Replaced entirely by vector SVG icons from `lucide-react` (`Key`, `Cpu`, `Zap`, `ShieldCheck`, `Terminal`, `Copy`, `Check`, `Activity`, `Sparkles`, `RefreshCw`, `Play`).
- **Pill Badges & Smooth Radii**:
  - Cards & Panels: `rounded-2xl` (16px) with `backdrop-blur-xl`.
  - Inputs, Buttons & Selects: `rounded-xl` (12px).
  - Status Indicators & Tags: `rounded-full` with micro-borders and soft ambient dots.

### 2.2 Color Palette & Surfaces
- **Canvas Base**: Deep pure obsidian black `#000000` / `#050505` with subtle gradient radial glows.
- **Glassmorphism Panels**: `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(20px)`.
- **Borders**: Thin, high-precision `border-white/[0.08]` (transitioning to `border-white/[0.18]` on hover and `border-blue-500/50` on focus).
- **Accents**:
  - Brand Glow: Vercel cyan/blue gradient (`#0070f3` to `#7928ca`).
  - Success State: Emerald `#10b981` (`bg-emerald-500/10 border-emerald-500/20 text-emerald-400`).
  - Warning State: Amber `#f59e0b` (`bg-amber-500/10 border-amber-500/20 text-amber-400`).
  - Error State: Rose `#f43f5e` (`bg-rose-500/10 border-rose-500/20 text-rose-400`).
- **Typography**:
  - Sans: `Inter`, system-ui with disciplined font weights (`font-normal`, `font-medium`, `font-semibold`).
  - Monospace: `JetBrains Mono` / `SF Mono` for API keys, prompt variables `{{variable}}`, hashes, and JSON code snippets.

---

## 3. Architecture & Views (`apps/dashboard`)

### 3.1 Application Shell & Navigation
- **Header**:
  - Brand identity with micro-glow logo.
  - Live Gateway Connection Badge: Polled indicator (`Connected` with pulsing emerald dot vs `Demo Mode` with amber dot).
  - Tabbed Top Navigation Bar: `Overview`, `Actions`, `Playground`, `Logs`.
  - Project Selector & Quick Secret Key Indicator.

### 3.2 View 1: Overview & API Keys
- **Telemetry Grid**:
  - Total Executions counter.
  - Active Actions registered.
  - Estimated Provider Spend (in cents and credit equivalent).
  - Average Latency (ms).
- **API Credentials Card**:
  - `pk_live_demo123`: Copyable public key with 1-click clipboard notification.
  - `sk_live_demo_secret_456`: Secret key with masked dots (`••••••••`), reveal toggle, and copy button.
  - Implementation Quickstart snippet showing `@platform/sdk` initialization.

### 3.3 View 2: Actions Registry
- **Action Cards Grid**:
  - List of active actions (`optimize-resume`, `generate-cover-letter`).
  - Metadata badges: Version ($v1, v2$), Model (`gpt-4o-mini`, `gemini-1.5-flash`), Price in credits (⚡ 15), Margin Guard (\$0.05).
- **Action Publisher Slide-Over Drawer**:
  - Action Name input.
  - Model selection dropdown.
  - Price (⚡ credits) & Max Provider Cost (\$ cents).
  - Rate Limiting settings (max requests per window).
  - System Prompt textarea.
  - User Prompt Template editor with interactive highlight of `{{templateVariables}}`.
  - JSON Output Schema validator toggle.
  - Submit action: calls `POST /v1/developer/actions` with `sk_live_*`.

### 3.4 View 3: Live Playground (Testbench)
- **Split-Pane Layout**:
  - **Left Pane (Request Config)**:
    - Action and Version picker.
    - Dynamic input fields automatically derived from template variables (e.g. `cvText`).
    - Run button (`Execute Action`) with execution spinner.
  - **Right Pane (Response & Metrics)**:
    - Formatted JSON response viewer with syntax highlighting.
    - Real-time telemetry badges: Duration (ms), Tokens used (`prompt_tokens`, `completion_tokens`), Cost in cents, and `Run ID`.

### 3.5 View 4: Audit Logs (`action_runs`)
- **Real-Time Logs Table**:
  - Columns: Timestamp, Status Pill (`SUCCEEDED`, `FAILED`, `RATE_LIMITED`), Action & Version, Prompt SHA-256 Digest (shortened), Input SHA-256 Digest (shortened), User ID, Latency.
- **Audit Detail Drawer**:
  - Clicking any row opens full inspection:
    - Cryptographic non-repudiation verification: Complete SHA-256 prompt and input hashes.
    - Correlation tags: `requestId`, `userId`, `projectId`, `actionName`.
    - Lifecycle transition audit (`RESERVED` $\to$ `RUNNING` $\to$ `SUCCEEDED`).

---

## 4. Data Flow & Hybrid Runtime Mode

```
+-------------------------------------------------------+
|              apps/dashboard (React 19)                |
|                                                       |
|   +-----------------------------------------------+   |
|   |         Gateway Client (src/lib/api.ts)       |   |
|   +-----------------------------------------------+   |
|            |                                |         |
|     (If Gateway Online)            (If Gateway Offline)|
|            |                                |         |
|            v                                v         |
|   +-------------------+           +-----------------+ |
|   | Hono HTTP Gateway |           | Seeded Offline  | |
|   | (localhost:3000)  |           | Demo Store      | |
|   +-------------------+           +-----------------+ |
+-------------------------------------------------------+
```

1. **Auto-Discovery**: On mount, the dashboard probes `GET http://localhost:3000/`.
2. **Online Mode**: When reachable, all queries and mutations interact directly with the live Hono backend.
3. **Offline Demo Mode**: When the gateway is stopped, the dashboard seamlessly switches to pre-populated mock data, ensuring a flawless interactive presentation at all times without broken UI states.

---

## 5. Verification & Testing

- Build check: `bun run --filter dashboard build` creates clean production bundle.
- Component & rendering check: Unit tests for state management, drawer toggles, and template variable extraction.
- Strict TypeScript: `tsc --build` with 0 diagnostic errors.
- Visual inspection: Verified in browser with glassmorphism styling, responsiveness, and zero console warnings.
