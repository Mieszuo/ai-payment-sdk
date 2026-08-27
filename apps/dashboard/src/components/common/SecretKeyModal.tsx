import React, { useState } from "react";
import { Key, Copy, Check, AlertTriangle, X } from "lucide-react";

interface SecretKeyModalProps {
  rawSecretKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SecretKeyModal: React.FC<SecretKeyModalProps> = ({
  rawSecretKey,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(rawSecretKey);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel bg-zinc-950 border border-amber-500/30 p-6 shadow-2xl rounded-2xl relative">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Save Your Secret Key</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              This secret key cannot be displayed again after closing this window.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Key className="w-4 h-4 text-zinc-500 shrink-0" />
              <code className="text-xs text-amber-300 mono-code truncate select-all font-medium">
                {rawSecretKey}
              </code>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700"
            >
              {copied ? (
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

        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-xs text-amber-300/80 mb-5">
          Please store this secret in your environment variables or password manager. It gives administrative access to publish action versions.
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-300 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0 focus:ring-offset-0"
          />
          <span>I have securely copied and saved this secret key</span>
        </label>

        <div className="flex justify-end gap-3">
          <button
            disabled={!acknowledged}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all shadow-sm"
          >
            I Understand, Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
