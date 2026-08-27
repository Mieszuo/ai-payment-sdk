import React, { useState } from "react";
import { DollarSign, Users, Cpu, TrendingUp } from "lucide-react";

export interface ProfitInput {
  monthlyUsers: number;
  executionsPerUser: number;
  priceCredits: number;
  providerCostDollars: number;
}

export interface ProfitResult {
  totalExecutions: number;
  grossRevenueDollars: number;
  totalProviderCostDollars: number;
  netProfitDollars: number;
  grossMarginPercent: number;
}

export function computeProfit(input: ProfitInput): ProfitResult {
  const totalExecutions = input.monthlyUsers * input.executionsPerUser;
  const revenuePerExecution = input.priceCredits * 0.01;
  const grossRevenueDollars = Number((totalExecutions * revenuePerExecution).toFixed(2));
  const totalProviderCostDollars = Number((totalExecutions * input.providerCostDollars).toFixed(2));
  const netProfitDollars = Number((grossRevenueDollars - totalProviderCostDollars).toFixed(2));
  const grossMarginPercent = grossRevenueDollars > 0
    ? Math.round(((grossRevenueDollars - totalProviderCostDollars) / grossRevenueDollars) * 100)
    : 0;

  return { totalExecutions, grossRevenueDollars, totalProviderCostDollars, netProfitDollars, grossMarginPercent };
}

const models = [
  { label: "GPT-4o Mini", cost: 0.004 },
  { label: "Gemini 1.5 Flash", cost: 0.003 },
  { label: "GPT-4o", cost: 0.03 },
  { label: "Claude 3.5 Sonnet", cost: 0.015 }
];

export const ProfitCalculator: React.FC = () => {
  const [users, setUsers] = useState(1000);
  const [executions, setExecutions] = useState(5);
  const [price, setPrice] = useState(15);
  const [modelIdx, setModelIdx] = useState(0);

  const result = computeProfit({
    monthlyUsers: users,
    executionsPerUser: executions,
    priceCredits: price,
    providerCostDollars: models[modelIdx].cost
  });

  return (
    <section id="economics" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
          <TrendingUp className="w-3.5 h-3.5" />
          Interactive Tool
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-3">Monthly Profit Calculator</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Adjust the sliders to estimate your recurring developer revenue and gross margin spread.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Users slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Monthly Active Users
              </label>
              <span className="text-sm font-mono font-semibold text-white">{users.toLocaleString()}</span>
            </div>
            <input type="range" min={10} max={50000} step={10} value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 rounded-full bg-zinc-800 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
              <span>10</span><span>50,000</span>
            </div>
          </div>

          {/* Executions slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Actions per User / Month
              </label>
              <span className="text-sm font-mono font-semibold text-white">{executions}</span>
            </div>
            <input type="range" min={1} max={100} step={1} value={executions}
              onChange={(e) => setExecutions(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 rounded-full bg-zinc-800 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
              <span>1</span><span>100</span>
            </div>
          </div>

          {/* Price slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Price per Action (Credits)
              </label>
              <span className="text-sm font-mono font-semibold text-amber-400">{price} cr = ${(price * 0.01).toFixed(2)}</span>
            </div>
            <input type="range" min={1} max={100} step={1} value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 rounded-full bg-zinc-800 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
              <span>1 cr</span><span>100 cr</span>
            </div>
          </div>

          {/* Model selector */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Underlying AI Model</label>
            <div className="flex flex-wrap gap-2">
              {models.map((m, i) => (
                <button key={m.label} onClick={() => setModelIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    modelIdx === i
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}>
                  {m.label}
                  <span className="ml-1.5 text-[10px] font-mono opacity-60">${m.cost}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
          <div className="text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Total Executions</span>
            <span className="text-lg font-bold font-mono text-zinc-100">{result.totalExecutions.toLocaleString()}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Gross Revenue</span>
            <span className="text-lg font-bold font-mono text-zinc-100">${result.grossRevenueDollars.toLocaleString()}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Net Profit / mo</span>
            <span className="text-lg font-bold font-mono text-emerald-400">+${result.netProfitDollars.toLocaleString()}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Gross Margin</span>
            <span className={`text-lg font-bold font-mono ${result.grossMarginPercent >= 50 ? "text-emerald-400" : "text-amber-400"}`}>
              {result.grossMarginPercent}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
