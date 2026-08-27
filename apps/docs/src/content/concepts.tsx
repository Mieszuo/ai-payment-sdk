import React from "react";
import { DocArticle } from "../types";
import { CodeSnippet } from "../components/common/CodeSnippet";
import { Layers, ShieldCheck, Key, RefreshCw, Cpu, Lock, ArrowRight } from "lucide-react";

export const conceptsArticles: DocArticle[] = [
  {
    id: "how-it-works",
    sectionId: "concepts",
    title: "How the Platform Works",
    description: "The mental model and interaction lifecycle across client, gateway, and ledger.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300 leading-relaxed">
          The AI Payment Platform coordinates five primary entities:
        </p>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed space-y-2">
          <p>1. Developer    → Defines &amp; publishes immutable Managed Action on Gateway</p>
          <p>2. User         → Holds a Universal AI Wallet with available credits</p>
          <p>3. Client SDK   → Initiates execution with public key (pk_live_*)</p>
          <p>4. Gateway API  → Reserves credits, populates prompt, calls AI model</p>
          <p>5. Ledger       → Settles transaction and cryptographically logs audit record</p>
        </div>

        <p className="text-xs text-zinc-400">
          This separation guarantees that client applications cannot manipulate model prompts or bypass credit pricing.
        </p>
      </div>
    )
  },
  {
    id: "projects",
    sectionId: "concepts",
    title: "Projects & Environments",
    description: "Multi-tenant project isolation and sandbox versus production execution.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          Every application in the platform belongs to an isolated <strong>Project</strong> (e.g. <code>proj_demo</code>). Projects maintain their own:
        </p>
        <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1.5">
          <li>Distinct Public Keys (<code>pk_live_*</code>) and Secret Keys (<code>sk_live_*</code>)</li>
          <li>Independent Managed Action Registries and version history</li>
          <li>Allowed CORS origin whitelists</li>
          <li>Independent rate limiting quotas and analytics telemetry</li>
        </ul>
      </div>
    )
  },
  {
    id: "wallets-credits",
    sectionId: "concepts",
    title: "Users & Credit Economics",
    description: "How universal user wallets and credits translate to real-world value.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          Credits represent the unit of energy consumed when invoking Managed Actions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <span className="text-xs font-semibold text-zinc-200">1 Credit Benchmark</span>
            <p className="text-sm text-amber-400 font-mono font-semibold mt-1">1 credit = $0.01 USD</p>
            <p className="text-[11px] text-zinc-400 mt-2">Standard platform conversion baseline used for user top-ups and developer gross margin calculations.</p>
          </div>
          <div className="glass-panel p-4">
            <span className="text-xs font-semibold text-zinc-200">Welcome Bonus</span>
            <p className="text-sm text-emerald-400 font-mono font-semibold mt-1">20 Free Credits</p>
            <p className="text-[11px] text-zinc-400 mt-2">Granted automatically upon first user authentication to enable instant frictionless testing.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "managed-actions-concept",
    sectionId: "concepts",
    title: "Managed Actions",
    description: "Immutable, version-controlled prompt pipelines protected by the Gateway.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          A <strong>Managed Action</strong> encapsulates a full AI pipeline into a single slug (e.g. <code>optimize-resume</code>):
        </p>
        <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1.5">
          <li><strong>System &amp; User Prompts:</strong> Stored on the Gateway, never leaked to the client browser.</li>
          <li><strong>Template Variables:</strong> Extracted dynamically using mustache tags (<code>{"{{cvText}}"}</code>).</li>
          <li><strong>JSON Schema Contract:</strong> Enforces structured model outputs.</li>
          <li><strong>Price &amp; Margin Guard:</strong> Protects against provider cost overruns.</li>
        </ul>
      </div>
    )
  },
  {
    id: "action-versions",
    sectionId: "concepts",
    title: "Action Versions & Zero-Downtime Rollbacks",
    description: "Immutable version numbering and instant rollbacks without destroying audit history.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          Action versions are strictly immutable. Publishing with the same <code>actionName</code> creates an incrementing version (<code>v1 &gt; v2 &gt; v3</code>).
        </p>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 space-y-1.5">
          <p className="text-zinc-500"># Publishing timeline:</p>
          <p>v1 (Published 2026-08-01) → Immutable snapshot</p>
          <p>v2 (Published 2026-08-15) → Active in production</p>
          <p>v3 (Published 2026-08-27) → Current active version</p>
          <p className="text-emerald-400">Rollback to v2: Activates v2 without mutating historical audit records.</p>
        </div>
      </div>
    )
  },
  {
    id: "reservations-settlement",
    sectionId: "concepts",
    title: "Two-Phase Reservations & Settlement",
    description: "How credit balance is protected during asynchronous AI model streaming.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          To prevent race conditions and balance overdraws, the platform executes a <strong>Two-Phase Reservation</strong>:
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-zinc-200">Phase 1: Reservation (Pre-Flight)</span>
            <p className="text-zinc-400 mt-1">The Gateway locks the user wallet row (<code>SELECT ... FOR UPDATE</code>) and moves credits from <code>availableCredits</code> to <code>reservedCredits</code>. If balance is insufficient, the request halts with <code>HTTP 402</code> before making any provider API call.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-zinc-200">Phase 2: Settlement (Post-Flight)</span>
            <p className="text-zinc-400 mt-1">Upon successful model completion, <code>reservedCredits</code> are transferred to platform clearing via a balanced double-entry transaction. If the model fails or times out, reserved credits automatically revert to <code>availableCredits</code>.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "public-vs-secret-keys",
    sectionId: "concepts",
    title: "Public vs Secret Keys",
    description: "Security boundary between client-facing pk_live_* and administrative sk_live_* keys.",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl glass-panel border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-200">Public Key</span>
              <code className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">pk_live_*</code>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Safe to expose in frontend client code. Can only initiate user PKCE sessions and trigger published actions within whitelisted CORS domains. Cannot modify actions or view audit secrets.
            </p>
          </div>

          <div className="p-4 rounded-xl glass-panel border border-amber-500/20 bg-amber-950/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-200">Secret Key</span>
              <code className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">sk_live_*</code>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Confidential administrative key. Authorizes publishing new action versions and administrative project changes. Never expose in frontend code.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "mock-vs-live",
    sectionId: "concepts",
    title: "Mock Mode vs Live Mode",
    description: "Zero-latency offline simulation for local testing and dry runs.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          The SDK and Gateway support two distinct execution modes:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="glass-panel p-4">
            <span className="font-semibold text-zinc-200">Mock Mode</span>
            <p className="text-zinc-400 mt-1">Returns instantaneous simulated JSON outputs with zero provider costs and zero credits deducted. Ideal for automated testing and CI/CD pipelines.</p>
          </div>
          <div className="glass-panel p-4">
            <span className="font-semibold text-zinc-200">Live Mode</span>
            <p className="text-zinc-400 mt-1">Invokes live upstream OpenAI or Gemini models, deducting user credits and computing provider token expenses in real time.</p>
          </div>
        </div>
      </div>
    )
  }
];
