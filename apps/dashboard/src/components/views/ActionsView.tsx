import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { ActionDrawer } from "../actions/ActionDrawer";
import { ActionItem } from "../../types";
import { calculateMargin } from "../../lib/parser";
import {
  Cpu,
  Plus,
  Zap,
  DollarSign,
  ShieldCheck,
  Clock,
  Terminal,
  Layers,
  Edit3
} from "lucide-react";

export const ActionsView: React.FC = () => {
  const { actions, publishAction, activeProject, setActiveTab } = useDashboard();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);

  const handleCreateNew = () => {
    setSelectedAction(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (action: ActionItem) => {
    setSelectedAction(action);
    setIsDrawerOpen(true);
  };

  const handleSaveAction = async (payload: Partial<ActionItem>) => {
    await publishAction(payload);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Managed Actions Registry</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Publish immutable, version-controlled prompt pipelines with margin guards and rate limits.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Action Version</span>
        </button>
      </div>

      {/* Actions List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => {
          const margin = calculateMargin(action.priceCredits, action.maxProviderCostCents);
          return (
            <div
              key={action.actionName}
              className="glass-panel p-5 flex flex-col justify-between hover:border-white/[0.16] transition-all"
            >
              <div>
                {/* Title & Version */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 mono-code">{action.actionName}</h3>
                      <p className="text-[11px] text-zinc-500 font-mono">v{action.version} • {action.model}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {action.status}
                  </span>
                </div>

                {/* Prompt Template Preview */}
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-3 mb-4">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">User Template</span>
                  <p className="text-xs text-zinc-300 font-mono line-clamp-2 leading-relaxed">
                    {action.userPromptTemplate}
                  </p>
                </div>

                {/* Economics & Rate Limits */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-zinc-800/80 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">Price</span>
                    <span className="text-amber-400 font-semibold mono-code">{action.priceCredits} credits</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Max Cost</span>
                    <span className="text-zinc-200 font-mono">${(action.maxProviderCostCents / 100).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Margin Guard</span>
                    <span className="text-emerald-400 font-semibold font-mono">~{margin}%</span>
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {action.rateLimit?.maxRequests || 10} req / {action.rateLimit?.windowSeconds || 60}s
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(action)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                    title="Publish new version"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab("playground")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-200 font-medium transition-colors"
                  >
                    <Terminal className="w-3 h-3 text-blue-400" />
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Action Drawer */}
      <ActionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveAction}
        initialAction={selectedAction}
      />
    </div>
  );
};
