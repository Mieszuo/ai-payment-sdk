import React from "react";
import { DocsProvider, useDocs } from "./context/DocsContext";
import { DocsHeader } from "./components/layout/DocsHeader";
import { DocsSidebar } from "./components/layout/DocsSidebar";
import { TableOfContents } from "./components/layout/TableOfContents";
import { ArticleView } from "./components/views/ArticleView";
import { TryInModal } from "./components/ai/TryInModal";

const DocsShell: React.FC = () => {
  const { isTryInModalOpen, setIsTryInModalOpen } = useDocs();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <DocsHeader />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex">
        <DocsSidebar />
        <main className="flex-1 flex min-w-0 justify-center">
          <ArticleView />
        </main>
        <TableOfContents />
      </div>

      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Credits • Developer Documentation</span>
          <span className="font-mono text-[11px] text-zinc-600">Built with Bun, React 19 &amp; Tailwind v4</span>
        </div>
      </footer>

      <TryInModal isOpen={isTryInModalOpen} onClose={() => setIsTryInModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DocsProvider>
      <DocsShell />
    </DocsProvider>
  );
};
