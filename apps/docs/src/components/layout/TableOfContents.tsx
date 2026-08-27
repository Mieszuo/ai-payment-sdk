import React from "react";
import { ListTree, ArrowUpRight } from "lucide-react";

export const TableOfContents: React.FC = () => {
  return (
    <aside className="w-56 shrink-0 py-6 pl-6 hidden xl:block overflow-y-auto max-h-[calc(100vh-4rem)] sticky top-16 text-xs no-scrollbar">
      <h4 className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px] font-mono mb-3 flex items-center gap-1.5">
        <ListTree className="w-3.5 h-3.5 text-zinc-500" />
        On This Page
      </h4>
      <ul className="space-y-2 text-zinc-500 font-medium">
        <li>
          <a href="#overview" className="hover:text-zinc-300 transition-colors block">
            Overview
          </a>
        </li>
        <li>
          <a href="#examples" className="hover:text-zinc-300 transition-colors block">
            Code Examples
          </a>
        </li>
        <li>
          <a href="#security" className="hover:text-zinc-300 transition-colors block">
            Security &amp; Best Practices
          </a>
        </li>
      </ul>

      <div className="mt-8 pt-4 border-t border-zinc-800/80">
        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noreferrer"
          className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 block hover:border-zinc-700 transition-colors group"
        >
          <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white flex items-center justify-between">
            <span>Developer Console</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-blue-400 transition-colors" />
          </span>
          <p className="text-[10px] text-zinc-500 mt-1">Manage keys and actions in real-time.</p>
        </a>
      </div>
    </aside>
  );
};
