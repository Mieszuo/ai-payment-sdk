import React from "react";
import { Code2, ArrowRight } from "lucide-react";

export const ArchitectureComparison: React.FC = () => {
  return (
    <section id="architecture" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
          <Code2 className="w-3.5 h-3.5" />
          Before vs After
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-3">Traditional Stack vs AI Credits</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Replace hundreds of lines of billing infrastructure with 3 lines of frontend code.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before */}
        <div className="glass-panel p-5 border-rose-500/20 bg-rose-950/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">Traditional Architecture</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">~400 lines</span>
          </div>
          <pre className="font-mono text-[11px] text-zinc-400 leading-relaxed overflow-x-auto whitespace-pre">{`// Next.js API route for AI action
// + Stripe webhook handler
// + PostgreSQL users & billing tables
// + OpenAI API key vault
// + Rate limiting middleware
// + Error fallback pipeline
// + CORS & CSRF protection
// + Session management & JWT
// + Credit balance tracking
// + Refund & chargeback handling
// + Audit logging
// + Provider cost monitoring

app.post("/api/ai/execute", async (req, res) => {
  const user = await verifySession(req);
  const balance = await db.query("SELECT ...");
  if (balance < price) return res.status(402)...
  await db.query("BEGIN; UPDATE wallets...");
  const result = await openai.chat.completions...
  await db.query("INSERT INTO audit_logs...");
  await db.query("COMMIT");
  // ... 380 more lines of glue code
});`}</pre>
        </div>

        {/* After */}
        <div className="glass-panel p-5 border-emerald-500/20 bg-emerald-950/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">AI Credits</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">3 lines</span>
          </div>
          <pre className="font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre">{`import { createAI } from "@ai-credits/sdk";

const ai = createAI({ project: "pk_live_demo123" });

const result = await ai.action("optimize-resume", {
  inputs: { cvText: "Senior Engineer..." }
});

// That's it.
// Auth, billing, rate limits, audit logs,
// provider keys, and margin protection
// are all handled by the Gateway.`}</pre>

          <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400/80">
            <ArrowRight className="w-3.5 h-3.5 inline mr-1.5" />
            Zero backend. Zero Stripe integration. Zero provider key exposure. All security invariants enforced server-side.
          </div>
        </div>
      </div>
    </section>
  );
};
