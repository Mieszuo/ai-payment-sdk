import React from "react";
import { useDocs } from "../../context/DocsContext";
import { ALL_ARTICLES, getArticleById } from "../../content";
import { ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";

export const ArticleView: React.FC = () => {
  const { activeArticleId, setActiveArticleId } = useDocs();
  const article = getArticleById(activeArticleId) || ALL_ARTICLES[0];

  const currentIndex = ALL_ARTICLES.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? ALL_ARTICLES[currentIndex - 1] : null;
  const nextArticle = currentIndex < ALL_ARTICLES.length - 1 ? ALL_ARTICLES[currentIndex + 1] : null;

  return (
    <div className="flex-1 max-w-3xl py-6 lg:px-8 min-w-0 animate-in fade-in duration-200">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono mb-4">
        <span>Docs</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="capitalize">{article.sectionId.replace("-", " ")}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-300 truncate">{article.title}</span>
      </div>

      {/* Header */}
      <div className="pb-6 border-b border-zinc-800/80 mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">{article.title}</h1>
        <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{article.description}</p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none text-zinc-300">{article.content}</div>

      {/* Bottom Pager */}
      <div className="mt-12 pt-6 border-t border-zinc-800/80 flex items-center justify-between gap-4 text-xs">
        {prevArticle ? (
          <button
            onClick={() => setActiveArticleId(prevArticle.id)}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group max-w-[48%]"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0" />
            <div className="truncate">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block">Previous</span>
              <span className="font-semibold text-zinc-200 group-hover:text-white truncate block">
                {prevArticle.title}
              </span>
            </div>
          </button>
        ) : (
          <div />
        )}

        {nextArticle ? (
          <button
            onClick={() => setActiveArticleId(nextArticle.id)}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-right transition-colors group max-w-[48%] ml-auto"
          >
            <div className="truncate">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block">Next</span>
              <span className="font-semibold text-zinc-200 group-hover:text-white truncate block">
                {nextArticle.title}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
