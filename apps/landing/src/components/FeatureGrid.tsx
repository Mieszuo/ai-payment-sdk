import React from "react";
import { ShieldCheck, Lock, Database, Gauge, GitBranch, CreditCard } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    iconColor: "text-blue-400",
    title: "Zero-Trust Prompts",
    description: "System prompts and provider API keys live exclusively on the Gateway. Client bundles never see sensitive data."
  },
  {
    icon: Database,
    iconColor: "text-emerald-400",
    title: "Double-Entry Financial Ledger",
    description: "Every credit movement is a balanced double-entry transaction. Mathematical invariant: sum of all entries equals zero."
  },
  {
    icon: Lock,
    iconColor: "text-amber-400",
    title: "Row-Level Locking",
    description: "PostgreSQL SELECT...FOR UPDATE serializes concurrent wallet access, eliminating double-spend race conditions."
  },
  {
    icon: Gauge,
    iconColor: "text-rose-400",
    title: "Margin Guard",
    description: "Hard cost ceiling per action execution. If provider token costs exceed the guard threshold, the request halts before billing."
  },
  {
    icon: GitBranch,
    iconColor: "text-violet-400",
    title: "Immutable Versioning",
    description: "Action versions (v1, v2, v3) are strictly append-only. Rollbacks activate previous versions without mutating audit history."
  },
  {
    icon: CreditCard,
    iconColor: "text-cyan-400",
    title: "Stripe Webhook Defense",
    description: "HMAC-SHA256 signature verification, idempotent replay protection, and balanced double-entry refund transactions."
  }
];

export const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Production-Grade Security & Economics</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Every invariant a fintech-grade payment system requires, built-in from day one.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="glass-panel p-5 hover:border-zinc-700/50 transition-colors group">
            <f.icon className={`w-5 h-5 ${f.iconColor} mb-3`} />
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5 group-hover:text-white transition-colors">{f.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
