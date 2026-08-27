import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { MetricCard } from "../common/MetricCard";
import {
  Activity,
  Zap,
  DollarSign,
  TrendingUp,
  Clock,
  Copy,
  Check,
  Cpu,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";

export const OverviewView: React.FC = () => {
  const { telemetry, actions, activeProject, setActiveTab } = useDashboard();
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const quickstartSnippet = `import { createAI } from "@platform/sdk";

const ai = createAI({
  project: "${activeProject.publicKey}"
});

// Execute Managed Action
const result = await ai.action("optimize-resume", {
  inputs: { cvText: "Senior TS Developer" }
});

console.log(result.output);`;

  const handleCopySnippet = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(quickstartSnippet);
      }
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      setCopiedSnippet(true);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">System Overview</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time financial telemetry, execution volume, and health metrics for {activeProject.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("playground")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-sm"
          >
            <span>Open Playground</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Telemetry Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Executions"
          value={telemetry.totalRuns.toLocaleString()}
          subtitle="Lifetime action requests"
          icon={<Activity className="w-4 h-4" />}
          badge="+12.4%"
        />
        <MetricCard
          title="Credits Consumed"
          value={`⚡ ${telemetry.creditsConsumed.toLocaleString()}`}
          subtitle="Total platform energy"
          icon={<Zap className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard
          title="Provider Spend"
          value={`$${(telemetry.providerSpendCents / 100).toFixed(2)}`}
          subtitle="Direct LLM model cost"
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard
          title="Gross Margin"
          value={`${telemetry.grossMarginPercent}%`}
          subtitle="Platform net spread"
          icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
          badge="Guarded"
        />
        <MetricCard
          title="Median Latency"
          value={`${telemetry.medianLatencyMs}ms`}
          subtitle="End-to-end response time"
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Active Actions & Quickstart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Actions Summary (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              Active Actions in Production
            </h3>
            <button
              onClick={() => setActiveTab("actions")}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Manage Actions →
            </button>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {actions.map((action) => (
              <div key={action.actionName} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-xs">
                    v{action.version}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200 mono-code">{action.actionName}</h4>
                    <p className="text-[11px] text-zinc-500 font-mono">{action.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-amber-400 mono-code">{action.priceCredits} ⚡</span>
                    <p className="text-[10px] text-zinc-500">Max ${ (action.maxProviderCostCents / 100).toFixed(2) }</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {action.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quickstart Integration Snippet (1 col) */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Quickstart Integration
              </h3>
              <button
                onClick={handleCopySnippet}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Drop `@platform/sdk` into your web application to connect users and execute actions.
            </p>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-[11px] text-zinc-300 mono-code overflow-x-auto select-all leading-relaxed">
              {quickstartSnippet}
            </pre>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Client Key: <code className="text-zinc-400 font-mono">{activeProject.publicKey.slice(0, 14)}...</code></span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
