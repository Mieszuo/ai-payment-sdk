import React, { useState } from "react";
import { useDocs } from "../../context/DocsContext";
import { PackageManager } from "../../types";
import { Copy, Check, Terminal } from "lucide-react";

export function getInstallCommand(pm: PackageManager, pkgName: string): string {
  switch (pm) {
    case "bun":
      return `bun add ${pkgName}`;
    case "npm":
      return `npm install ${pkgName}`;
    case "pnpm":
      return `pnpm add ${pkgName}`;
    case "yarn":
      return `yarn add ${pkgName}`;
  }
}

export const PackageManagerSwitcher: React.FC<{ pkgName?: string }> = ({ pkgName = "@ai-credits/sdk" }) => {
  const { packageManager, setPackageManager } = useDocs();
  const [copied, setCopied] = useState(false);

  const currentCmd = getInstallCommand(packageManager, pkgName);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(currentCmd);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const managers: PackageManager[] = ["bun", "npm", "pnpm", "yarn"];

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden my-4">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800">
        <div className="flex items-center gap-1">
          {managers.map((pm) => (
            <button
              key={pm}
              onClick={() => setPackageManager(pm)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                packageManager === pm
                  ? "bg-zinc-800 text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {pm}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div className="p-3 font-mono text-xs text-zinc-200 flex items-center gap-2 select-all">
        <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <code>{currentCmd}</code>
      </div>
    </div>
  );
};
