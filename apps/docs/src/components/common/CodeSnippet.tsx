import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeSnippetProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language = "typescript", filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden my-4">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/60 border-b border-zinc-800 text-xs">
        <span className="font-mono text-zinc-400 text-[11px]">{filename || language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 font-mono text-xs text-zinc-200 leading-relaxed overflow-x-auto select-all">
        <code>{code}</code>
      </pre>
    </div>
  );
};
