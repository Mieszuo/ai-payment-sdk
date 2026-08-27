import React from "react";
import { Zap, ExternalLink, BookOpen, LayoutDashboard, Terminal } from "lucide-react";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-zinc-900 py-12 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
                <Zap className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="text-sm font-bold text-white">AI Payment Platform</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The universal AI wallet and monetization engine for indie developers and software teams.
            </p>
          </div>

          {/* Ecosystem */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 font-mono">Ecosystem</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="http://localhost:5175" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> Documentation <ExternalLink className="w-2.5 h-2.5 text-zinc-600" />
                </a>
              </li>
              <li>
                <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="w-3 h-3" /> Developer Console <ExternalLink className="w-2.5 h-2.5 text-zinc-600" />
                </a>
              </li>
              <li>
                <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" /> Gateway API <ExternalLink className="w-2.5 h-2.5 text-zinc-600" />
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 font-mono">Resources</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a href="http://localhost:5175#introduction" className="hover:text-white transition-colors">Getting Started</a></li>
              <li><a href="http://localhost:5175#sdk-core" className="hover:text-white transition-colors">SDK Reference</a></li>
              <li><a href="http://localhost:5175#api-overview" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="http://localhost:5175#sdk-errors" className="hover:text-white transition-colors">Error Codes</a></li>
            </ul>
          </div>

          {/* Quick Start */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 font-mono">Quick Start</h4>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-300 space-y-1">
              <p className="text-zinc-500"># Install SDK</p>
              <p>bun add @platform/sdk</p>
              <p className="text-zinc-500 mt-2"># Run all apps</p>
              <p>bun run landing</p>
              <p>bun run dashboard</p>
              <p>bun run docs</p>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-600">
          <span>AI Payment Platform</span>
          <span className="font-mono text-[11px]">Built with Bun, React 19, Tailwind v4 & Hono</span>
        </div>
      </div>
    </footer>
  );
};
