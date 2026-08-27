import React from "react";
import { useDocs } from "../../context/DocsContext";
import { ALL_SECTIONS } from "../../content";
import { BookOpen, ChevronRight, Layers, Cpu, Terminal, ShieldCheck, Zap } from "lucide-react";

export const DocsSidebar: React.FC = () => {
  const { activeArticleId, setActiveArticleId } = useDocs();

  return (
    <aside className="w-64 shrink-0 py-6 pr-6 border-r border-zinc-800/80 hidden lg:block overflow-y-auto max-h-[calc(100vh-4rem)] sticky top-16 no-scrollbar">
      <nav className="space-y-6">
        {ALL_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 font-mono px-3">
              {section.title}
            </h4>
            <div className="space-y-0.5">
              {section.articles.map((article) => {
                const isActive = activeArticleId === article.id;
                return (
                  <button
                    key={article.id}
                    onClick={() => setActiveArticleId(article.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between group ${
                      isActive
                        ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                    }`}
                  >
                    <span className="truncate">{article.title}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
