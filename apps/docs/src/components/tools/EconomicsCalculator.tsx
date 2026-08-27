import React, { useState } from "react";
import { DollarSign } from "lucide-react";

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
