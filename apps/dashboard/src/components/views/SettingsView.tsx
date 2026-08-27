import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { SecretKeyModal } from "../common/SecretKeyModal";
import {
  Key,
  ShieldCheck,
  Copy,
  Check,
  RotateCcw,
  Globe,
  AlertTriangle,
  Lock,
  ExternalLink
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { activeProject, rotateSecretKey } = useDashboard();
  const [copiedPub, setCopiedPub] = useState(false);
  const [copiedSec, setCopiedSec] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);

  const handleCopyPublic = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(activeProject.publicKey);
      }
      setCopiedPub(true);
      setTimeout(() => setCopiedPub(false), 2000);
    } catch {
      setCopiedPub(true);
    }
  };

  const handleRotate = async () => {
    if (!confirm("Are you sure you want to rotate your secret key? Any existing backend integrations using the previous secret will immediately fail.")) {
      return;
    }
    setIsRotating(true);
    try {
      const res = await rotateSecretKey();
      setNewSecretKey(res.newSecretKey);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">Project Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure API credentials, security policies, and environment parameters for {activeProject.name}.
        </p>
      </div>

      {/* Project Identity Card */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          General Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project Name</label>
            <input
              type="text"
              readOnly
              value={activeProject.name}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 mono-code focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project Identifier (ID)</label>
            <input
              type="text"
              readOnly
              value={activeProject.projectId}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mono-code focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* API Keys & Credentials */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          API Keys & Credentials
        </h3>

        <div className="space-y-4">
          {/* Public Key */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-xs font-semibold text-zinc-200">Public Key (Client App ID)</span>
                <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                  pk_live_*
                </span>
              </div>
              <span className="text-[11px] text-zinc-500">Safe for client-side bundle</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Used by <code>&lt;ai-payment-widget&gt;</code> and <code>@platform/sdk</code> to authenticate users and trigger action executions.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeProject.publicKey}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 mono-code select-all focus:outline-none"
              />
              <button
                onClick={handleCopyPublic}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700 shrink-0"
              >
                {copiedPub ? (
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
          </div>

          {/* Secret Key */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-xs font-semibold text-zinc-200">Developer Secret Key</span>
                <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  sk_live_*
                </span>
              </div>
              <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" /> Confidential
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Authorizes action publishing and administrative changes. Never expose in frontend code.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeProject.secretKeyMasked}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 mono-code select-none focus:outline-none"
              />
              <button
                onClick={handleRotate}
                disabled={isRotating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-xs font-medium text-amber-300 transition-colors border border-amber-500/30 shrink-0 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
                <span>Rotate Secret Key</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Allowed CORS Domains */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          Allowed Origins (CORS)
        </h3>
        <p className="text-xs text-zinc-400 mb-3">
          Domains permitted to initiate client-side PKCE authorization sessions.
        </p>
        <div className="flex flex-wrap gap-2">
          {activeProject.allowedDomains.map((dom) => (
            <span
              key={dom}
              className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5"
            >
              <Globe className="w-3 h-3 text-zinc-500" />
              {dom}
            </span>
          ))}
        </div>
      </div>

      {/* One-time Secret Key Modal */}
      {newSecretKey && (
        <SecretKeyModal
          rawSecretKey={newSecretKey}
          isOpen={true}
          onClose={() => setNewSecretKey(null)}
        />
      )}
    </div>
  );
};
