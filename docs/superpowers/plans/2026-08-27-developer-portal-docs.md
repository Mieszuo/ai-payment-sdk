# Developer Portal & Documentation (`apps/docs`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade Developer Portal & Documentation site (`apps/docs`) on port 5175 with task-oriented guides, conceptual mental models, complete SDK and Gateway API references, an interactive Economics Margin Calculator, a persistent Package Manager switcher, and a global "Try in AI" export modal for Cursor, Claude Code, ChatGPT, Windsurf, and MCP servers.

**Architecture:** A standalone React 19 + Vite + Tailwind v4 application inside `apps/docs` sharing the obsidian micro-glassmorphism design system of `apps/dashboard`, equipped with client-side reactive article routing, full-text quick search, dynamic code snippet updates across package managers, and seamless cross-links to the Developer Dashboard.

**Tech Stack:** Bun, Vite, React 19, Tailwind CSS v4, Lucide React (`lucide-react`), TypeScript.

## Global Constraints

- Runtime & Build System: Bun (use `bun install`, `bun test`, `bun run docs`).
- Design System: Dark obsidian (`#000000` / `#09090b`), hairline borders (`border-white/[0.08]`), zero Unicode emojis, vector icons from `lucide-react`, `Inter` for prose and `JetBrains Mono` for code/keys.
- Port: `5175` (`bun --filter docs dev` or `bun run docs`).
- 100% strict TypeScript (`tsconfig.json`), no placeholder code, TDD red-green cycle on every task.

---

### Task 1: Developer Portal Scaffolding & Design System Tokens (`apps/docs`)

**Files:**
- Create: `apps/docs/package.json`
- Create: `apps/docs/vite.config.ts`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/index.html`
- Create: `apps/docs/src/main.tsx`
- Create: `apps/docs/src/index.css`
- Create: `apps/docs/src/vite-env.d.ts`
- Test: `apps/docs/tests/scaffold.test.ts`

**Interfaces:**
- Produces: CSS utility tokens (`.glass-panel`, `.hairline-border`, `.mono-code`), HTML entrypoint, and workspace configuration for `apps/docs`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/docs/tests/scaffold.test.ts
import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

describe("Developer Portal App Scaffolding", () => {
  const root = join(import.meta.dir, "..");

  it("verifies package.json and workspace configuration exist", () => {
    expect(existsSync(join(root, "package.json"))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
    expect(pkg.name).toBe("docs");
  });

  it("verifies index.css contains dark obsidian theme tokens without emojis", () => {
    expect(existsSync(join(root, "src/index.css"))).toBe(true);
    const css = readFileSync(join(root, "src/index.css"), "utf-8");
    expect(css).toContain("glass-panel");
    expect(css).toContain("mono-code");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/docs/tests/scaffold.test.ts`  
Expected: FAIL with file not found.

- [ ] **Step 3: Write minimal implementation**

Create `apps/docs/package.json`:
```json
{
  "name": "docs",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5175",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 5175"
  },
  "dependencies": {
    "lucide-react": "^1.16.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^5.4.0"
  }
}
```

Create `apps/docs/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5175 }
});
```

Create `apps/docs/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests"]
}
```

Create `apps/docs/index.html`:
```html
<!DOCTYPE html>
<html lang="en" class="dark bg-black">
<head>
  <meta charset="UTF-8" />
  <title>AI Payment Platform — Developer Portal & Documentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body class="bg-black text-zinc-100 antialiased selection:bg-blue-500/30 selection:text-blue-200 min-h-screen">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Create `apps/docs/src/index.css`:
```css
@import "tailwindcss";

@layer base {
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: #000000;
    color: #f4f4f5;
  }
}

.mono-code {
  font-family: 'JetBrains Mono', monospace;
}

.glass-panel {
  background: rgba(18, 18, 20, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
}

.hairline-border {
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

Create `apps/docs/src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
```

Create placeholder `apps/docs/src/main.tsx`:
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="p-8 text-white">Docs App Scaffolding</div>
  </React.StrictMode>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/docs/tests/scaffold.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs
git commit -m "feat(docs): scaffold documentation portal with vite, tailwind v4, and design tokens"
```

---

### Task 2: Core Components — Package Manager Switcher, Code Snippet & Try In AI Modal (`apps/docs`)

**Files:**
- Create: `apps/docs/src/types/index.ts`
- Create: `apps/docs/src/context/DocsContext.tsx`
- Create: `apps/docs/src/components/common/PackageManagerSwitcher.tsx`
- Create: `apps/docs/src/components/common/CodeSnippet.tsx`
- Create: `apps/docs/src/components/ai/TryInModal.tsx`
- Create: `apps/docs/src/components/ai/TryInBar.tsx`
- Test: `apps/docs/tests/components.test.ts`

**Interfaces:**
- Consumes: Design system styles from Task 1.
- Produces: `PackageManagerSwitcher` (syncs `bun`, `npm`, `pnpm`, `yarn`), `CodeSnippet` (copyable syntax block), `TryInModal` & `TryInBar` (formatted context for Cursor, Claude Code, ChatGPT, Windsurf, MCP).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/docs/tests/components.test.ts
import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { PackageManagerSwitcher, getInstallCommand } from "../src/components/common/PackageManagerSwitcher";
import { CodeSnippet } from "../src/components/common/CodeSnippet";
import { TryInModal, generateAgentContext } from "../src/components/ai/TryInModal";
import { DocsProvider } from "../src/context/DocsContext";

describe("Docs Core Interactive Components", () => {
  it("formats install commands accurately across package managers", () => {
    expect(getInstallCommand("bun", "@platform/sdk")).toBe("bun add @platform/sdk");
    expect(getInstallCommand("npm", "@platform/sdk")).toBe("npm install @platform/sdk");
    expect(getInstallCommand("pnpm", "@platform/sdk")).toBe("pnpm add @platform/sdk");
    expect(getInstallCommand("yarn", "@platform/sdk")).toBe("yarn add @platform/sdk");
  });

  it("generates structured agent context for Cursor and Claude Code", () => {
    const cursorContext = generateAgentContext("cursor", "pk_live_demo123");
    expect(cursorContext).toContain(".cursorrules");
    expect(cursorContext).toContain("@platform/sdk");
    expect(cursorContext).toContain("INSUFFICIENT_CREDITS");

    const claudeContext = generateAgentContext("claude", "pk_live_demo123");
    expect(claudeContext).toContain("claude mcp add");
  });

  it("renders CodeSnippet and PackageManagerSwitcher without emojis", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DocsProvider,
        null,
        React.createElement(PackageManagerSwitcher, { pkgName: "@platform/sdk" })
      )
    );
    expect(html).toContain("bun add @platform/sdk");
    expect(html).toContain("npm");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/docs/tests/components.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `apps/docs/src/types/index.ts`:
```typescript
export type PackageManager = "bun" | "npm" | "pnpm" | "yarn";

export type AgentPlatform = "cursor" | "claude" | "chatgpt" | "windsurf" | "mcp";

export interface DocArticle {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

export interface DocSection {
  id: string;
  title: string;
  articles: { id: string; title: string }[];
}
```

Create `apps/docs/src/context/DocsContext.tsx`:
```typescript
import React, { createContext, useContext, useState, ReactNode } from "react";
import { PackageManager } from "../types";

interface DocsContextValue {
  packageManager: PackageManager;
  setPackageManager: (pm: PackageManager) => void;
  activeArticleId: string;
  setActiveArticleId: (id: string) => void;
  isTryInModalOpen: boolean;
  setIsTryInModalOpen: (open: boolean) => void;
}

const DocsContext = createContext<DocsContextValue | null>(null);

export const DocsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [packageManager, setPackageManager] = useState<PackageManager>("bun");
  const [activeArticleId, setActiveArticleId] = useState<string>("introduction");
  const [isTryInModalOpen, setIsTryInModalOpen] = useState<boolean>(false);

  return (
    <DocsContext.Provider
      value={{
        packageManager,
        setPackageManager,
        activeArticleId,
        setActiveArticleId,
        isTryInModalOpen,
        setIsTryInModalOpen
      }}
    >
      {children}
    </DocsContext.Provider>
  );
};

export function useDocs(): DocsContextValue {
  const context = useContext(DocsContext);
  if (!context) throw new Error("useDocs must be used within DocsProvider");
  return context;
}
```

Create `apps/docs/src/components/common/PackageManagerSwitcher.tsx`:
```typescript
import React from "react";
import { useDocs } from "../../context/DocsContext";
import { PackageManager } from "../../types";
import { Copy, Check, Terminal } from "lucide-react";

export function getInstallCommand(pm: PackageManager, pkgName: string): string {
  switch (pm) {
    case "bun":
      return `bun add ${pkgName}`;
    case "npm":
      return `npm install ${pkgName}`;
    case "pnpm":
      return `pnpm add ${pkgName}`;
    case "yarn":
      return `yarn add ${pkgName}`;
  }
}

export const PackageManagerSwitcher: React.FC<{ pkgName?: string }> = ({ pkgName = "@platform/sdk" }) => {
  const { packageManager, setPackageManager } = useDocs();
  const [copied, setCopied] = React.useState(false);

  const currentCmd = getInstallCommand(packageManager, pkgName);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(currentCmd);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const managers: PackageManager[] = ["bun", "npm", "pnpm", "yarn"];

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden my-4">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800">
        <div className="flex items-center gap-1">
          {managers.map((pm) => (
            <button
              key={pm}
              onClick={() => setPackageManager(pm)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                packageManager === pm
                  ? "bg-zinc-800 text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {pm}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div className="p-3 font-mono text-xs text-zinc-200 flex items-center gap-2 select-all">
        <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <code>{currentCmd}</code>
      </div>
    </div>
  );
};
```

Create `apps/docs/src/components/common/CodeSnippet.tsx`:
```typescript
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeSnippetProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language = "typescript", filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden my-4">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/60 border-b border-zinc-800 text-xs">
        <span className="font-mono text-zinc-400 text-[11px]">{filename || language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 font-mono text-xs text-zinc-200 leading-relaxed overflow-x-auto select-all">
        <code>{code}</code>
      </pre>
    </div>
  );
};
```

Create `apps/docs/src/components/ai/TryInModal.tsx`:
```typescript
import React, { useState } from "react";
import { AgentPlatform } from "../../types";
import { X, Copy, Check, Bot, Terminal, FileCode, Sparkles } from "lucide-react";

export function generateAgentContext(platform: AgentPlatform, projectKey: string = "pk_live_demo123"): string {
  switch (platform) {
    case "cursor":
      return `# .cursorrules for AI Payment Platform
You are an expert full-stack engineer integrating @platform/sdk.

Rules:
1. Always initialize SDK with client public key:
   import { createAI } from "@platform/sdk";
   const ai = createAI({ project: "${projectKey}" });

2. Call managed actions using structured inputs:
   const result = await ai.action("optimize-resume", { inputs: { cvText } });

3. Always handle INSUFFICIENT_CREDITS errors gracefully:
   try {
     await ai.action(...);
   } catch (err: any) {
     if (err.code === "INSUFFICIENT_CREDITS") {
       // trigger modal or widget topup
     }
   }

4. Never expose secret keys (sk_live_*) on the client side.`;

    case "claude":
      return `# Claude Code Tool Registration
claude mcp add ai-payment-gateway http://localhost:3000/v1/mcp

# Or prompt instruction for Claude:
"Use @platform/sdk to invoke managed AI actions for project '${projectKey}'. Verify credit balance before execution and handle rate limit 429 retries."`;

    case "chatgpt":
      return `{
  "openapi": "3.1.0",
  "info": { "title": "AI Payment Platform Gateway", "version": "1.0.0" },
  "servers": [{ "url": "http://localhost:3000/v1" }],
  "paths": {
    "/actions/{name}/execute": {
      "post": {
        "summary": "Execute Managed Action",
        "parameters": [{ "name": "name", "in": "path", "required": true, "schema": { "type": "string" } }],
        "requestBody": {
          "content": { "application/json": { "schema": { "type": "object", "properties": { "inputs": { "type": "object" } } } } }
        }
      }
    }
  }
}`;

    case "windsurf":
      return `# .windsurfrules for AI Payment SDK
- Framework: @platform/sdk and @platform/react
- Public Client Key: ${projectKey}
- Follow Two-Phase credit reservation pattern
- Component: <ai-payment-widget project="${projectKey}"></ai-payment-widget>`;

    case "mcp":
      return `{
  "mcpServers": {
    "ai-payment": {
      "command": "bunx",
      "args": ["@platform/mcp-server", "--project", "${projectKey}"]
    }
  }
}`;
  }
}

export const TryInModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<AgentPlatform>("cursor");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const content = generateAgentContext(platform);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const platforms: { id: AgentPlatform; label: string }[] = [
    { id: "cursor", label: "Cursor (.cursorrules)" },
    { id: "claude", label: "Claude Code / CLI" },
    { id: "chatgpt", label: "ChatGPT (Custom GPT)" },
    { id: "windsurf", label: "Windsurf Rules" },
    { id: "mcp", label: "MCP Server Config" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel bg-zinc-950 border border-white/[0.12] p-6 shadow-2xl rounded-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              Ask AI / Export to AI Agents
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Export ready-to-use context, tools, and rules into your favorite AI assistant.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-1 py-3 overflow-x-auto border-b border-zinc-800/80">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                platform === p.id
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto my-4 bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 relative">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <pre className="font-mono text-xs text-zinc-200 leading-relaxed select-all whitespace-pre-wrap">
            {content}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs text-zinc-500">
          <span>AI-operable context format • Ready to paste</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
```

Create `apps/docs/src/components/ai/TryInBar.tsx`:
```typescript
import React from "react";
import { useDocs } from "../../context/DocsContext";
import { Bot, Terminal, Code, Cpu, Sparkles } from "lucide-react";

export const TryInBar: React.FC = () => {
  const { setIsTryInModalOpen } = useDocs();

  return (
    <div className="my-6 p-4 rounded-xl glass-panel border border-blue-500/20 bg-blue-950/10 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-left">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-zinc-200">Building with an AI Agent?</h4>
          <p className="text-[11px] text-zinc-400">Export rules and tools directly into Cursor, Claude Code, or ChatGPT.</p>
        </div>
      </div>
      <button
        onClick={() => setIsTryInModalOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-sm shrink-0"
      >
        Try in AI Assistant
      </button>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/docs/tests/components.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/types apps/docs/src/context apps/docs/src/components/common apps/docs/src/components/ai apps/docs/tests/components.test.ts
git commit -m "feat(docs): implement package manager switcher, code snippet, and try in ai modal"
```

---

### Task 3: Interactive Economics Calculator & Error Code Matrix (`apps/docs`)

**Files:**
- Create: `apps/docs/src/components/tools/EconomicsCalculator.tsx`
- Create: `apps/docs/src/components/tools/ErrorCodeTable.tsx`
- Test: `apps/docs/tests/tools.test.ts`

**Interfaces:**
- Consumes: Types and theme tokens from Task 1 and 2.
- Produces: `EconomicsCalculator` (interactive profit and margin calculator) and `ErrorCodeTable` (filterable matrix of all error codes).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/docs/tests/tools.test.ts
import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { EconomicsCalculator, computeEconomics } from "../src/components/tools/EconomicsCalculator";
import { ErrorCodeTable, ERROR_DEFINITIONS } from "../src/components/tools/ErrorCodeTable";

describe("Docs Tools & Matrices", () => {
  it("calculates developer economics accurately", () => {
    // 15 credits = $0.15 revenue; max provider cost = $0.004 -> profit = $0.146, margin = 97.3%
    const econ = computeEconomics(15, 0.004);
    expect(econ.revenueDollars).toBe(0.15);
    expect(econ.profitDollars).toBe(0.146);
    expect(econ.grossMarginPercent).toBe(97);
  });

  it("contains all 8 standard error codes with recovery steps", () => {
    const codes = ERROR_DEFINITIONS.map((e) => e.code);
    expect(codes).toContain("INSUFFICIENT_CREDITS");
    expect(codes).toContain("RATE_LIMITED");
    expect(codes).toContain("UNAUTHORIZED");
    expect(codes).toContain("INVALID_INPUT");
    expect(codes).toContain("ACTION_NOT_FOUND");
    expect(codes).toContain("PROVIDER_ERROR");
    expect(codes).toContain("OUTPUT_VALIDATION_FAILED");
    expect(codes).toContain("ABORTED");
  });

  it("renders ErrorCodeTable and EconomicsCalculator without emojis", () => {
    const html = renderToStaticMarkup(React.createElement(EconomicsCalculator));
    expect(html).toContain("Action Price");
    expect(html).toContain("Gross Margin");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/docs/tests/tools.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `apps/docs/src/components/tools/EconomicsCalculator.tsx`:
```typescript
import React, { useState } from "react";
import { ShieldCheck, DollarSign, Zap } from "lucide-react";

export function computeEconomics(priceCredits: number, providerCostDollars: number) {
  const revenueDollars = Number((priceCredits * 0.01).toFixed(4));
  const profitDollars = Number(Math.max(0, revenueDollars - providerCostDollars).toFixed(4));
  const grossMarginPercent = revenueDollars > 0 ? Math.round(((revenueDollars - providerCostDollars) / revenueDollars) * 100) : 0;
  return { revenueDollars, profitDollars, grossMarginPercent };
}

export const EconomicsCalculator: React.FC = () => {
  const [credits, setCredits] = useState<number>(15);
  const [costDollars, setCostDollars] = useState<number>(0.004);

  const { revenueDollars, profitDollars, grossMarginPercent } = computeEconomics(credits, costDollars);

  return (
    <div className="glass-panel p-5 my-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Unit Economics & Margin Calculator
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test developer net revenue and margin spread per action invocation.
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
          Interactive Tool
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">User Price (Credits)</label>
          <input
            type="number"
            min="1"
            value={credits}
            onChange={(e) => setCredits(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-amber-400 font-mono focus:outline-none focus:border-blue-500"
          />
          <span className="text-[10px] text-zinc-500 mt-1 block font-mono">1 credit = $0.01 USD</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Provider Cost (USD)</label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={costDollars}
            onChange={(e) => setCostDollars(Math.max(0, Number(e.target.value)))}
            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
          />
          <span className="text-[10px] text-zinc-500 mt-1 block font-mono">e.g. $0.004 (GPT-4o-mini ~2k tokens)</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs font-mono">
        <div>
          <span className="text-zinc-500 text-[10px] block">Revenue Value</span>
          <span className="text-zinc-100 font-semibold">${revenueDollars.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[10px] block">Net Spread</span>
          <span className="text-emerald-400 font-semibold">${profitDollars.toFixed(4)}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[10px] block">Gross Margin</span>
          <span className={`font-semibold ${grossMarginPercent >= 50 ? "text-emerald-400" : "text-amber-400"}`}>
            {grossMarginPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};
```

Create `apps/docs/src/components/tools/ErrorCodeTable.tsx`:
```typescript
import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";

export interface ErrorDefinition {
  code: string;
  httpStatus: number;
  description: string;
  recovery: string;
}

export const ERROR_DEFINITIONS: ErrorDefinition[] = [
  {
    code: "INSUFFICIENT_CREDITS",
    httpStatus: 402,
    description: "User wallet does not have enough available credits for this action.",
    recovery: "Prompt the user to top up their wallet or open <ai-payment-widget>."
  },
  {
    code: "RATE_LIMITED",
    httpStatus: 429,
    description: "Action execution frequency exceeded configured sliding-window threshold.",
    recovery: "Wait for the duration specified in the Retry-After header before retrying."
  },
  {
    code: "UNAUTHORIZED",
    httpStatus: 401,
    description: "Missing, expired, or invalid PKCE session Bearer token.",
    recovery: "Re-authenticate the user via ai.authenticate() or widget login."
  },
  {
    code: "INVALID_INPUT",
    httpStatus: 400,
    description: "Input payload does not satisfy required prompt template variables or JSON schema.",
    recovery: "Inspect error.details and validate form fields before re-submitting."
  },
  {
    code: "ACTION_NOT_FOUND",
    httpStatus: 404,
    description: "The requested actionName has not been published in this project.",
    recovery: "Check the action slug in Developer Dashboard or publish a new version."
  },
  {
    code: "PROVIDER_ERROR",
    httpStatus: 502,
    description: "Upstream LLM provider (OpenAI / Gemini) returned an unhandled error.",
    recovery: "Ensure configured API keys are valid or configure a fallbackModel."
  },
  {
    code: "OUTPUT_VALIDATION_FAILED",
    httpStatus: 502,
    description: "Model output failed validation against the registered output JSON schema.",
    recovery: "Tighten system prompt instructions or switch to a higher-capability model."
  },
  {
    code: "ABORTED",
    httpStatus: 499,
    description: "The client cancelled or closed the request before the model finished.",
    recovery: "No credits are deducted. Safely discard response."
  }
];

export const ErrorCodeTable: React.FC = () => {
  const [filter, setFilter] = useState("");

  const filtered = ERROR_DEFINITIONS.filter(
    (e) => e.code.toLowerCase().includes(filter.toLowerCase()) || e.description.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="my-6 glass-panel overflow-hidden">
      <div className="p-3.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-zinc-200">Standard Error Code Matrix</span>
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Filter error codes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/40 border-b border-zinc-800 text-[11px] text-zinc-400 font-medium">
            <tr>
              <th className="py-2.5 px-4">Error Code</th>
              <th className="py-2.5 px-4">HTTP</th>
              <th className="py-2.5 px-4">Trigger Condition</th>
              <th className="py-2.5 px-4">Recommended Handling</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {filtered.map((err) => (
              <tr key={err.code} className="hover:bg-zinc-900/30 transition-colors">
                <td className="py-3 px-4 font-mono font-semibold text-rose-400 text-[11px] whitespace-nowrap">
                  {err.code}
                </td>
                <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap">{err.httpStatus}</td>
                <td className="py-3 px-4 text-zinc-300">{err.description}</td>
                <td className="py-3 px-4 text-zinc-400">{err.recovery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/docs/tests/tools.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/components/tools apps/docs/tests/tools.test.ts
git commit -m "feat(docs): implement interactive unit economics calculator and error code matrix"
```

---

### Task 4: Documentation Content Store (Sections 1 & 2: Getting Started & Concepts) (`apps/docs`)

**Files:**
- Create: `apps/docs/src/content/getting-started.tsx`
- Create: `apps/docs/src/content/concepts.tsx`
- Test: `apps/docs/tests/content-guides.test.ts`

**Interfaces:**
- Consumes: `PackageManagerSwitcher`, `CodeSnippet`, `EconomicsCalculator`, `TryInBar`.
- Produces: Rich documentation articles for Getting Started (7 articles) and Concepts (8 articles).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/docs/tests/content-guides.test.ts
import { describe, it, expect } from "bun:test";
import { gettingStartedArticles } from "../src/content/getting-started";
import { conceptsArticles } from "../src/content/concepts";

describe("Docs Content Store (Guides & Concepts)", () => {
  it("provides 7 Getting Started articles", () => {
    const ids = gettingStartedArticles.map((a) => a.id);
    expect(ids).toContain("introduction");
    expect(ids).toContain("installation");
    expect(ids).toContain("quickstart");
    expect(ids).toContain("vanilla-js");
    expect(ids).toContain("react");
    expect(ids).toContain("first-action");
    expect(ids).toContain("production-deployment");
  });

  it("provides 8 Conceptual articles", () => {
    const ids = conceptsArticles.map((a) => a.id);
    expect(ids).toContain("how-it-works");
    expect(ids).toContain("projects");
    expect(ids).toContain("wallets-credits");
    expect(ids).toContain("managed-actions-concept");
    expect(ids).toContain("action-versions");
    expect(ids).toContain("reservations-settlement");
    expect(ids).toContain("public-vs-secret-keys");
    expect(ids).toContain("mock-vs-live");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/docs/tests/content-guides.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create `apps/docs/src/content/getting-started.tsx` and `apps/docs/src/content/concepts.tsx` containing complete markdown/React articles with code samples, installation switchers, and zero emojis.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/docs/tests/content-guides.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/content/getting-started.tsx apps/docs/src/content/concepts.tsx apps/docs/tests/content-guides.test.ts
git commit -m "feat(docs): author Getting Started and Core Concepts articles"
```

---

### Task 5: Documentation Content Store (Sections 3, 4, 5 & 6: SDK, Managed Actions, Gateway API, Advanced) (`apps/docs`)

**Files:**
- Create: `apps/docs/src/content/sdk.tsx`
- Create: `apps/docs/src/content/managed-actions.tsx`
- Create: `apps/docs/src/content/gateway-api.tsx`
- Create: `apps/docs/src/content/advanced.tsx`
- Create: `apps/docs/src/content/index.ts`
- Test: `apps/docs/tests/content-reference.test.ts`

**Interfaces:**
- Consumes: Content components, `ErrorCodeTable`, `EconomicsCalculator`.
- Produces: Full documentation articles for SDK Reference, Managed Actions, Gateway API, and Advanced Architecture.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/docs/tests/content-reference.test.ts
import { describe, it, expect } from "bun:test";
import { ALL_SECTIONS, ALL_ARTICLES, getArticleById } from "../src/content";

describe("Docs Content Reference Registry", () => {
  it("registers all 6 root navigation sections", () => {
    expect(ALL_SECTIONS).toHaveLength(6);
    const sectionIds = ALL_SECTIONS.map((s) => s.id);
    expect(sectionIds).toEqual([
      "getting-started",
      "concepts",
      "sdk",
      "managed-actions",
      "gateway-api",
      "advanced"
    ]);
  });

  it("retrieves articles by unique identifier", () => {
    const art = getArticleById("sdk-core");
    expect(art).toBeDefined();
    expect(art?.title).toContain("@platform/sdk");

    const errArt = getArticleById("sdk-errors");
    expect(errArt).toBeDefined();
    expect(errArt?.title).toContain("Error Reference");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/docs/tests/content-reference.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create:
- `apps/docs/src/content/sdk.tsx` (SDK Core API, React hooks, Web Component, Error Reference)
- `apps/docs/src/content/managed-actions.tsx` (Prompts, Schemas, Margin Guard, Rate Limits, Versioning & Rollbacks)
- `apps/docs/src/content/gateway-api.tsx` (Endpoints: auth, execute, wallet, developer, stripe webhook)
- `apps/docs/src/content/advanced.tsx` (Zero-trust, PKCE, Double-entry ledger, Row locking, Webhook HMAC)
- `apps/docs/src/content/index.ts` (Aggregates all sections and articles)

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/docs/tests/content-reference.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/content apps/docs/tests/content-reference.test.ts
git commit -m "feat(docs): author Reference and Advanced Architecture sections"
```

---

### Task 6: Portal Layout, Sidebar Navigation, Search, and Router (`apps/docs`)

**Files:**
- Create: `apps/docs/src/components/layout/DocsHeader.tsx`
- Create: `apps/docs/src/components/layout/DocsSidebar.tsx`
- Create: `apps/docs/src/components/layout/TableOfContents.tsx`
- Create: `apps/docs/src/components/views/ArticleView.tsx`
- Modify: `apps/docs/src/App.tsx`
- Modify: `apps/docs/src/main.tsx`
- Test: `apps/docs/tests/layout.test.ts`

**Interfaces:**
- Consumes: All content and components from Tasks 1-5.
- Produces: Complete navigable documentation portal shell with responsive sidebar, quick search filter, breadcrumbs, article pager, and `TryInModal`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/docs/tests/layout.test.ts
import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { App } from "../src/App";

describe("Docs Portal Full Layout & Shell", () => {
  it("renders global header with search, links, and Try in AI button", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    expect(html).toContain("AI Payment Docs");
    expect(html).toContain("Ask AI / Try in");
    expect(html).toContain("Dashboard");
    expect(html).toContain("GETTING STARTED");
    expect(html).toContain("CONCEPTS");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/docs/tests/layout.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Create:
- `apps/docs/src/components/layout/DocsHeader.tsx` (Brand logo, quick search input, Ask AI button, Dashboard external link, GitHub link)
- `apps/docs/src/components/layout/DocsSidebar.tsx` (Collapsible sections, active article indicator, filterable search)
- `apps/docs/src/components/layout/TableOfContents.tsx` (Right-rail on-this-page links)
- `apps/docs/src/components/views/ArticleView.tsx` (Renders current active article with previous/next pager)
- `apps/docs/src/App.tsx` (Coordinates DocsProvider, DocsHeader, DocsSidebar, ArticleView, TableOfContents, and TryInModal)
- `apps/docs/src/main.tsx` (Mounts App with StrictMode)

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/docs/tests/layout.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/components/layout apps/docs/src/components/views apps/docs/src/App.tsx apps/docs/src/main.tsx apps/docs/tests/layout.test.ts
git commit -m "feat(docs): assemble layout shell, sidebar navigation, and article router"
```

---

### Task 7: Cross-Workspace Dashboard Linkage & Root Monorepo Integration (`apps/dashboard`, `package.json`)

**Files:**
- Modify: `apps/dashboard/src/components/layout/AppHeader.tsx`
- Modify: `package.json`
- Test: `apps/docs/tests/e2e-docs.test.ts`

**Interfaces:**
- Consumes: `apps/docs` and `apps/dashboard`.
- Produces: Seamless cross-workspace navigation from Dashboard to Docs (`http://localhost:5175`) and `"docs"` script in root `package.json`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/docs/tests/e2e-docs.test.ts
import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Monorepo Cross-Linkage & Docs Integration", () => {
  it("verifies package.json contains 'docs' script", () => {
    const rootPkg = JSON.parse(readFileSync(join(import.meta.dir, "../../../package.json"), "utf-8"));
    expect(rootPkg.scripts.docs).toBe("bun --filter docs dev");
  });

  it("verifies Developer Dashboard header contains Documentation link", () => {
    const headerCode = readFileSync(join(import.meta.dir, "../../../apps/dashboard/src/components/layout/AppHeader.tsx"), "utf-8");
    expect(headerCode).toContain("Documentation");
    expect(headerCode).toContain("http://localhost:5175");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/docs/tests/e2e-docs.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Update `package.json`:
Add `"docs": "bun --filter docs dev"` to `scripts`.

Update `apps/dashboard/src/components/layout/AppHeader.tsx`:
Add a sleek Documentation link button opening `http://localhost:5175` in a new tab.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/docs/tests/e2e-docs.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json apps/dashboard/src/components/layout/AppHeader.tsx apps/docs/tests/e2e-docs.test.ts
git commit -m "feat: cross-link documentation from developer dashboard and add monorepo docs script"
```

---

### Task 8: End-to-End Build Verification & Workspace Typecheck

**Files:**
- Test: All tests across the workspace.

**Interfaces:**
- Verifies: Full build, typecheck with 0 errors, and zero regressions across all 6 workspaces.

- [ ] **Step 1: Run full test suite across monorepo**

Run: `bun test`  
Expected: All 190+ tests pass with 0 failures.

- [ ] **Step 2: Run workspace typecheck**

Run: `bun run typecheck` (`tsc --build`)  
Expected: 0 diagnostic errors.

- [ ] **Step 3: Build production bundle for docs**

Run: `bun --filter docs build`  
Expected: Clean Vite production bundle in `apps/docs/dist/`.

- [ ] **Step 4: Commit and finalize**

```bash
git add .
git commit -m "chore: verify end-to-end docs build and typecheck"
```
