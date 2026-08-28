import React, { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";

export const SimpleIntegrationSection: React.FC = () => {
  const [copiedStep1, setCopiedStep1] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText("npm install @ai-credits/sdk");
      }
      setCopiedStep1(true);
      setTimeout(() => setCopiedStep1(false), 2000);
    } catch {
      setCopiedStep1(true);
    }
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
          Simple Integration
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          3 lines of code. That&apos;s it.
        </h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
          Get started in under 2 minutes.
        </p>
      </div>

      {/* 3 Step Integration Cards Grid with Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        
        {/* Step 1: Install SDK */}
        <div className="rounded-2xl card-dark-glass p-6 relative flex flex-col justify-between border border-blue-500/20 hover:border-blue-500/40 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-blue-500/40 shrink-0">
                1
              </div>
              <h3 className="text-sm font-semibold text-white">Install SDK</h3>
            </div>

            <div className="bg-[#050811] border border-blue-500/20 rounded-xl p-3.5 flex items-center justify-between font-mono text-xs text-zinc-200">
              <code>npm install @ai-credits/sdk</code>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Copy command"
              >
                {copiedStep1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-4">Available for Bun, Node.js, and browser environments.</p>
        </div>

        {/* Step 2: Initialize */}
        <div className="rounded-2xl card-dark-glass p-6 relative flex flex-col justify-between border border-blue-500/20 hover:border-blue-500/40 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-blue-500/40 shrink-0">
                2
              </div>
              <h3 className="text-sm font-semibold text-white">Initialize</h3>
            </div>

            <div className="bg-[#050811] border border-blue-500/20 rounded-xl p-3.5 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto">
              <p><span className="text-purple-400">import</span> &#123; <span className="text-blue-400">AiPay</span> &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">&apos;@ai-credits/sdk&apos;</span>;</p>
              <p className="mt-1"><span className="text-purple-400">const</span> <span className="text-blue-300">aiPay</span> = <span className="text-purple-400">new</span> <span className="text-yellow-300">AiPay</span>();</p>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-4">Auto-detects credentials with zero boilerplate.</p>
        </div>

        {/* Step 3: Start Charging */}
        <div className="rounded-2xl card-dark-glass p-6 relative flex flex-col justify-between border border-blue-500/20 hover:border-blue-500/40 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-blue-500/40 shrink-0">
                3
              </div>
              <h3 className="text-sm font-semibold text-white">Start charging</h3>
            </div>

            <div className="bg-[#050811] border border-blue-500/20 rounded-xl p-3.5 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto">
              <p><span className="text-purple-400">const</span> <span className="text-blue-300">result</span> = <span className="text-purple-400">await</span> <span className="text-blue-300">aiPay</span>.<span className="text-cyan-300">charge</span>(&#123;</p>
              <p className="pl-3"><span className="text-zinc-300">userId</span>: <span className="text-emerald-400">&apos;user_123&apos;</span>,</p>
              <p className="pl-3"><span className="text-zinc-300">credits</span>: <span className="text-amber-400">10</span>,</p>
              <p className="pl-3"><span className="text-zinc-300">prompt</span>: <span className="text-emerald-400">&apos;Your prompt here&apos;</span></p>
              <p>&#125;);</p>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-4">Atomic reservations, automatic payout reconciliation.</p>
        </div>

      </div>

      {/* Floating Bottom Pill */}
      <div className="mt-12 flex justify-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full card-dark-glass border border-blue-500/30 text-xs font-medium text-zinc-300 shadow-lg shadow-blue-950/40">
          <span>More time building. Less time managing infrastructure.</span>
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        </div>
      </div>

    </section>
  );
};
