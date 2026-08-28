import { DocArticle } from "../types";
import { PackageManagerSwitcher } from "../components/common/PackageManagerSwitcher";
import { CodeSnippet } from "../components/common/CodeSnippet";
import { TryInBar } from "../components/ai/TryInBar";
import { EconomicsCalculator } from "../components/tools/EconomicsCalculator";
import { ShieldCheck, Zap, Cpu, CheckCircle2 } from "lucide-react";

export const gettingStartedArticles: DocArticle[] = [
  {
    id: "introduction",
    sectionId: "getting-started",
    title: "Introduction",
    description: "Overview of the AI Credits platform and Managed Actions architecture.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300 leading-relaxed">
          The <strong>AI Credits</strong> platform enables developers to monetize AI workflows in client-side web and mobile apps with <strong>zero backend infrastructure</strong>. By decoupling client interfaces from confidential model prompts and billing logic, developers publish version-controlled <strong>Managed Actions</strong> that users execute using a universal, double-entry credit wallet.
        </p>

        <TryInBar />

        <h3 className="text-base font-semibold text-white pt-2">Why Universal AI Wallet?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="p-4 rounded-xl glass-panel border border-zinc-800">
            <ShieldCheck className="w-5 h-5 text-blue-400 mb-2" />
            <h4 className="text-xs font-semibold text-zinc-200">Zero-Trust Prompts</h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Clients never touch OpenAI/Gemini API keys or system prompts. Prompts live securely on the Gateway.
            </p>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-zinc-800">
            <Zap className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="text-xs font-semibold text-zinc-200">Instant Monetization</h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Charge credits per action run. Integrated with Stripe Checkout, webhooks, and automatic refund ledgering.
            </p>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-zinc-800">
            <Cpu className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="text-xs font-semibold text-zinc-200">Guarded Economics</h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Built-in Margin Guard bounds model cost overruns, ensuring consistent gross profit on every execution.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "installation",
    sectionId: "getting-started",
    title: "Installation",
    description: "Install client SDK packages for TypeScript and React applications.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          Install the client SDK using your preferred package manager:
        </p>

        <PackageManagerSwitcher pkgName="@ai-credits/sdk" />

        <h4 className="text-xs font-semibold text-zinc-200 pt-2">For React and Next.js applications:</h4>
        <PackageManagerSwitcher pkgName="@ai-credits/react @ai-credits/sdk" />
      </div>
    )
  },
  {
    id: "quickstart",
    sectionId: "getting-started",
    title: "3-Minute Quickstart",
    description: "Authenticate a user, display credit balance, and execute your first action.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          This 3-step walkthrough takes you from zero to executing a paid AI action in under 3 minutes.
        </p>

        <h3 className="text-sm font-semibold text-white">Step 1: Initialize Client</h3>
        <CodeSnippet
          filename="src/ai.ts"
          code={`import { createAI } from "@ai-credits/sdk";

// Initialize with your project's client-safe public key
export const ai = createAI({
  project: "pk_live_demo123"
});`}
        />

        <h3 className="text-sm font-semibold text-white">Step 2: Check Wallet Balance</h3>
        <CodeSnippet
          filename="src/wallet.ts"
          code={`import { ai } from "./ai";

const wallet = await ai.getWallet();
console.log(\`Available credits: \${wallet.availableCredits}\`);`}
        />

        <h3 className="text-sm font-semibold text-white">Step 3: Execute Managed Action</h3>
        <CodeSnippet
          filename="src/action.ts"
          code={`import { ai } from "./ai";

const result = await ai.action("optimize-resume", {
  inputs: {
    cvText: "Senior Software Engineer with 6 years experience in fintech."
  }
});

console.log(result.output);`}
        />
      </div>
    )
  },
  {
    id: "vanilla-js",
    sectionId: "getting-started",
    title: "Vanilla JavaScript / TypeScript",
    description: "Embed the zero-dependency Web Component in any HTML page.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          The SDK bundles an isolated Shadow DOM custom element <code>&lt;ai-credits-widget&gt;</code> that works in any framework or vanilla HTML page.
        </p>

        <CodeSnippet
          language="html"
          filename="index.html"
          code={`<!DOCTYPE html>
<html>
<head>
  <script type="module" src="https://esm.sh/@ai-credits/sdk"></script>
</head>
<body>
  <!-- Drop-in Payment & Auth Widget -->
  <ai-credits-widget project="pk_live_demo123"></ai-credits-widget>

  <script type="module">
    import { createAI } from "@ai-credits/sdk";
    const ai = createAI({ project: "pk_live_demo123" });
    
    // Automatically hooks into user session
    const res = await ai.action("optimize-resume", {
      inputs: { cvText: "Lead Developer" }
    });
  </script>
</body>
</html>`}
        />
      </div>
    )
  },
  {
    id: "react",
    sectionId: "getting-started",
    title: "React / Next.js Setup",
    description: "Integrate @ai-credits/react hooks with Next.js App Router or Vite.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          Wrap your root layout with <code>AIProvider</code> to enable reactive hooks across components:
        </p>

        <CodeSnippet
          filename="app/providers.tsx"
          code={`"use client";
import React from "react";
import { AIProvider } from "@ai-credits/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AIProvider project="pk_live_demo123">
      {children}
    </AIProvider>
  );
}`}
        />

        <h3 className="text-sm font-semibold text-white pt-2">Use in UI Components:</h3>
        <CodeSnippet
          filename="components/ResumeOptimizer.tsx"
          code={`"use client";
import React, { useState } from "react";
import { useAction, useWallet } from "@ai-credits/react";

export function ResumeOptimizer() {
  const { availableCredits } = useWallet();
  const { execute, isPending, data, error } = useAction("optimize-resume");
  const [cvText, setCvText] = useState("");

  const handleRun = async () => {
    await execute({ cvText });
  };

  return (
    <div>
      <p>Balance: {availableCredits} credits</p>
      <textarea value={cvText} onChange={(e) => setCvText(e.target.value)} />
      <button onClick={handleRun} disabled={isPending || availableCredits < 15}>
        {isPending ? "Analyzing..." : "Optimize Resume (15 credits)"}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}`}
        />
      </div>
    )
  },
  {
    id: "first-action",
    sectionId: "getting-started",
    title: "Your First Managed Action",
    description: "Step-by-step lifecycle of creating, testing, and invoking a managed action.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          Managed actions are published on the Gateway with your developer secret key (<code>sk_live_*</code>).
        </p>

        <EconomicsCalculator />

        <h3 className="text-sm font-semibold text-white">Publishing via Developer API:</h3>
        <CodeSnippet
          filename="scripts/publish.ts"
          code={`const res = await fetch("http://localhost:3000/v1/developer/actions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk_live_demo_secret_456"
  },
  body: JSON.stringify({
    actionName: "optimize-resume",
    model: "gpt-4o-mini",
    priceCredits: 15,
    maxProviderCostCents: 5,
    systemPrompt: "You are an executive career recruiter.",
    userPromptTemplate: "Candidate CV:\\n{{cvText}}\\nRole:\\n{{targetRole}}",
    rateLimit: { maxRequests: 10, windowSeconds: 60 }
  })
});`}
        />
      </div>
    )
  },
  {
    id: "production-deployment",
    sectionId: "getting-started",
    title: "Production Deployment Checklist",
    description: "Security rules, environment variables, and CORS policies for launching live.",
    content: (
      <div className="space-y-6">
        <p className="text-sm text-zinc-300">
          Before taking your application live to users, ensure the following production security invariants:
        </p>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">Public vs Secret Key Separation</h4>
              <p className="text-[11px] text-zinc-400">Only <code>pk_live_*</code> belongs in frontend bundles. <code>sk_live_*</code> must remain strictly on your CI/CD or backend.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">Configure Allowed Origins (CORS)</h4>
              <p className="text-[11px] text-zinc-400">In Developer Dashboard &gt; Settings, add your production domain to prevent unauthorized PKCE token exchanges.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-zinc-200">Configure Stripe Webhook Secret</h4>
              <p className="text-[11px] text-zinc-400">Set <code>STRIPE_WEBHOOK_SECRET=whsec_...</code> on your Gateway instance to enforce HMAC-SHA256 signature verification.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
];
