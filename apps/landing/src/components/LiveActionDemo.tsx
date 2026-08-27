import React, { useState } from "react";
import { Play, Loader2, CheckCircle2, Clock, Cpu } from "lucide-react";

export const LiveActionDemo: React.FC = () => {
  const [input, setInput] = useState("Senior Full-Stack Engineer with 6 years experience in fintech and distributed systems.");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ latency: number; credits: number; cost: string } | null>(null);

  const handleRun = () => {
    setRunning(true);
    setResult(null);
    setMetrics(null);

    const latency = 800 + Math.random() * 600;

    setTimeout(() => {
      setResult(JSON.stringify({
        summary: "Highly experienced full-stack engineer with deep fintech domain expertise. Strong candidate for Staff/Principal-level roles requiring distributed systems architecture and financial compliance knowledge.",
        keywords: ["distributed systems", "fintech", "full-stack", "TypeScript", "PostgreSQL"],
        score: 87
      }, null, 2));
      setMetrics({ latency: Math.round(latency), credits: 15, cost: "$0.004" });
      setRunning(false);
    }, latency);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Try It Live</h2>
        <p className="text-sm text-zinc-400 mt-2">
          Simulate a managed action execution directly on this page. No signup required.
        </p>
      </div>

      <div className="glass-panel p-6">
        {/* Input */}
        <div className="mb-4">
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Input: CV Summary Text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono leading-relaxed resize-none focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> optimize-resume v3</span>
            <span>GPT-4o Mini</span>
            <span className="text-amber-400">15 credits</span>
          </div>
          <button
            onClick={handleRun}
            disabled={running || !input.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-xs font-semibold text-white transition-all shadow-sm"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Executing..." : "Run Action (Simulated)"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-3.5 py-1.5 bg-zinc-900/60 border-b border-zinc-800 text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Response Output
              </div>
              <pre className="p-3.5 font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre select-all">
                {result}
              </pre>
            </div>

            {metrics && (
              <div className="flex items-center justify-center gap-6 text-[11px] font-mono text-zinc-400 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {metrics.latency}ms</span>
                <span className="text-amber-400">{metrics.credits} credits deducted</span>
                <span>Provider cost: {metrics.cost}</span>
                <span className="text-emerald-400">Margin: 97%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
