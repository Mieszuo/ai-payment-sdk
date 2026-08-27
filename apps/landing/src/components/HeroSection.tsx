import React, { useState } from "react";
import { Terminal, Copy, Check, ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";

type PM = "bun" | "npm" | "pnpm" | "yarn";

function getCmd(pm: PM): string {
  switch (pm) {
    case "bun": return "bun add @platform/sdk";
    case "npm": return "npm install @platform/sdk";
    case "pnpm": return "pnpm add @platform/sdk";
    case "yarn": return "yarn add @platform/sdk";
  }
}

export const HeroSection: React.FC = () => {
  const [pm, setPm] = useState<PM>("bun");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(getCmd(pm));
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  return (
    <section className="relative hero-glow pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-8">
          v1.0 Production Ready
          <span className="w-1 h-1 rounded-full bg-blue-400" />
          Zero-Backend AI Monetization
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
          <span className="gradient-text">Monetize AI Features in</span>{" "}
          <span className="text-white">3 Lines of Code.</span>
          <br />
          <span className="text-zinc-400 text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 block">Zero Backend Required.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-400 mt-6 max-w-2xl mx-auto leading-relaxed">
          Stop building Stripe integrations, user auth, and LLM billing pipelines for every side-project.
          Users pay via a universal credit wallet, you set the price, and earn automated payouts on the margin spread.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <a href="http://localhost:5174" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="w-4 h-4" />
            Open Developer Console
            <ArrowRight className="w-4 h-4" />
          </a>
          <a href="http://localhost:5175" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium text-zinc-300 transition-colors">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            Read Documentation
          </a>
        </div>

        {/* Terminal Switcher */}
        <div className="mt-10 max-w-md mx-auto">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800">
              <div className="flex items-center gap-1">
                {(["bun", "npm", "pnpm", "yarn"] as PM[]).map((p) => (
                  <button key={p} onClick={() => setPm(p)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                      pm === p ? "bg-zinc-800 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div className="p-3 font-mono text-xs text-zinc-200 flex items-center gap-2 select-all">
              <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <code>{getCmd(pm)}</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
