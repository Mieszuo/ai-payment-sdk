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
  Lock,
  Plus,
  X
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { activeProject, rotateSecretKey, addAllowedDomain, removeAllowedDomain } = useDashboard();
  const [copiedPub, setCopiedPub] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");

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

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain.trim()) {
      addAllowedDomain(newDomain.trim());
      setNewDomain("");
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
              <span className="text-[11px] text-zinc-500 font-mono">Safe for browser</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Used in frontend initialization (<code className="text-zinc-300">createAI</code>, widget, React components).
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeProject.publicKey}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 mono-code select-all focus:outline-none"
              />
              <button
                onClick={handleCopyPublic}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors shrink-0"
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
        <h3 className="text-sm font-semibold text-zinc-100 mb-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          Allowed Origins (CORS)
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Domains permitted to initiate client-side PKCE authorization sessions.
        </p>

        <form onSubmit={handleAddDomain} className="flex gap-2 mb-4 max-w-lg">
          <input
            type="url"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newDomain.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-xs font-semibold text-white transition-all shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Origin</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {activeProject.allowedDomains.map((dom) => (
            <span
              key={dom}
              className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2"
            >
              <Globe className="w-3 h-3 text-zinc-500" />
              {dom}
              {activeProject.allowedDomains.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAllowedDomain(dom)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 rounded"
                  title="Remove domain"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Wallet Architecture & Credit Sharing Mode */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Wallet Architecture &amp; Credit Sharing
          </h3>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {activeProject.walletMode === "universal" ? "Universal AI Wallet" : "Isolated Project Wallet"}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Control whether user credit wallets are globally shared across the AI Payment network or isolated strictly to this application.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Universal Wallet Option */}
          <div
            onClick={() => useDashboard().updateWalletMode("universal")}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeProject.walletMode === "universal"
                ? "bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-950/50"
                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Universal AI Wallet (Recommended)
                </span>
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  High Conversion
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Users can spend their universal credit balance in your app immediately. You earn full developer margin when your AI features are invoked.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Frictionless 1-Click usage</span>
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                activeProject.walletMode === "universal" ? "border-blue-400 bg-blue-500" : "border-zinc-600"
              }`}>
                {activeProject.walletMode === "universal" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>
          </div>

          {/* Isolated Wallet Option */}
          <div
            onClick={() => useDashboard().updateWalletMode("isolated")}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeProject.walletMode === "isolated"
                ? "bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/50"
                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  Isolated Project Wallet (White-label)
                </span>
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Private
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Credits purchased in this project are strictly isolated to this application ID (<code className="text-zinc-300">{activeProject.projectId}</code>).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span>B2B / Custom SaaS mode</span>
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                activeProject.walletMode === "isolated" ? "border-purple-400 bg-purple-500" : "border-zinc-600"
              }`}>
                {activeProject.walletMode === "isolated" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>
          </div>
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
