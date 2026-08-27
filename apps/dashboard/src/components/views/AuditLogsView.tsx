import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { IntegrityDrawer } from "../logs/IntegrityDrawer";
import { AuditLogEvent } from "../../types";
import { Activity, ShieldCheck, Filter, ChevronRight, Hash, Clock } from "lucide-react";

export const AuditLogsView: React.FC = () => {
  const { logs, activeProject } = useDashboard();
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogEvent | null>(null);

  const filteredLogs = logs.filter((l) => {
    if (filter === "ALL") return true;
    return l.status === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Audit Logs</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Unified request stream with immutable SHA-256 cryptographic integrity verification.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs self-start sm:self-auto">
          {["ALL", "SUCCEEDED", "RATE_LIMITED", "FAILED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filter === st
                  ? "bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st === "ALL" ? "All Requests" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Unified Request Stream ({filteredLogs.length})
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Live Telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[11px] font-medium text-zinc-400">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Prompt Digest</th>
                <th className="py-3 px-4">Input Digest</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 italic">
                    No log events found matching filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-zinc-900/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                          log.status === "SUCCEEDED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : log.status === "RATE_LIMITED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-200 font-medium whitespace-nowrap">
                      {log.actionName} <span className="text-zinc-500 font-normal">v{log.version}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {log.promptHash.slice(0, 10)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {log.inputHash.slice(0, 10)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                      {log.latencyMs}ms
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 whitespace-nowrap">
                      {log.costCents > 0 ? `$${(log.costCents / 100).toFixed(4)}` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Integrity Inspection Drawer */}
      <IntegrityDrawer
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
