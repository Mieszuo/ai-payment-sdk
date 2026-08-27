import React from "react";
import { useDocs } from "../../context/DocsContext";
import { Bot } from "lucide-react";

export const TryInBar: React.FC = () => {
  const { setIsTryInModalOpen } = useDocs();

  return (
    <div className="my-6 p-4 rounded-xl glass-panel border border-blue-500/20 bg-blue-950/10 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-left">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-zinc-200">Building with an AI Agent?</h4>
          <p className="text-[11px] text-zinc-400">Export rules and tools directly into Cursor, Claude Code, or ChatGPT.</p>
        </div>
      </div>
      <button
        onClick={() => setIsTryInModalOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-sm shrink-0"
      >
        Try in AI Assistant
      </button>
    </div>
  );
};
