import React, { useState, useEffect } from "react";
import { AuditLogEvent } from "../../types";
import { computeSha256 } from "../../lib/api";
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Clock, Key, Hash, Layers } from "lucide-react";

export async function verifyHashIntegrity(payload: string, expectedHash: string): Promise<boolean> {
  const calculated = await computeSha256(payload);
  return calculated.toLowerCase() === expectedHash.toLowerCase();
}

interface IntegrityDrawerProps {
  log: AuditLogEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrityDrawer: React.FC<IntegrityDrawerProps> = ({ log, isOpen, onClose }) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 p-6 sm:p-8 flex flex-col h-full overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-semibold text-white font-mono">{log.id}</span>
              <span
                className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-medium ${
                  log.status === "SUCCEEDED"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : log.status === "RATE_LIMITED"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {log.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400">Cryptographic audit snapshot and execution trace.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 mt-6 flex-1 text-xs">
          {/* Integrity Verification Card */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Integrity Verification
            </h4>

            {/* Prompt SHA-256 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-400 font-medium">Prompt Digest (SHA-256)</span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Recorded Match
                </span>
              </div>
              <p className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 break-all select-all">
                {log.promptHash}
              </p>
            </div>

            {/* Input SHA-256 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-400 font-medium">Input Digest (SHA-256)</span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Recorded Match
                </span>
              </div>
              <p className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 break-all select-all">
                {log.inputHash}
              </p>
            </div>
          </div>

          {/* Execution Trace & Economics */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Execution Metadata
            </h4>

            <div className="grid grid-cols-2 gap-3 text-zinc-300">
              <div>
                <span className="text-zinc-500 text-[11px] block">Action & Version</span>
                <span className="font-mono font-medium">{log.actionName} (v{log.version})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[11px] block">Duration</span>
                <span className="font-mono font-medium">{log.latencyMs}ms</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[11px] block">Reserved Credits</span>
                <span className="font-mono font-medium text-amber-400">{log.reservedCredits} credits</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[11px] block">Provider Cost</span>
                <span className="font-mono font-medium text-emerald-400">
                  ${(log.costCents / 100).toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Correlation Context */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-400" />
              Correlation Context
            </h4>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">User ID:</span>
                <span className="text-zinc-300 select-all">{log.userId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Timestamp:</span>
                <span className="text-zinc-300">{log.timestamp}</span>
              </div>
              {log.errorMessage && (
                <div className="pt-2 border-t border-zinc-800 text-rose-400">
                  <span className="text-zinc-500 block mb-0.5">Error Message:</span>
                  <span>{log.errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
