import React from "react";
import { Zap, ExternalLink, BookOpen, LayoutDashboard, Play } from "lucide-react";
import { getEcosystemUrls } from "@ai-credits/shared";

export const LandingFooter: React.FC = () => {
  const urls = getEcosystemUrls();

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
                <a href={urls.docs} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> Documentation <ExternalLink className="w-2.5 h-2.5 text-zinc-600" />
                </a>
              </li>
              <li>
                <a href={urls.dashboard} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="w-3 h-3" /> Developer Console <ExternalLink className="w-2.5 h-2.5 text-zinc-600" />
                </a>
              </li>
              <li>
                <a href={urls.demo} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-blue-400" /> Live Demo App <ExternalLink className="w-2.5 h-2.5 text-zinc-600" />
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 font-mono">Resources</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a href={`${urls.docs}#introduction`} className="hover:text-white transition-colors">Getting Started</a></li>
              <li><a href={`${urls.docs}#sdk-core`} className="hover:text-white transition-colors">SDK Reference</a></li>
              <li><a href={`${urls.docs}#api-overview`} className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href={`${urls.docs}#sdk-errors`} className="hover:text-white transition-colors">Error Codes</a></li>
            </ul>
          </div>

          {/* Quick Start */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 font-mono">Quick Start</h4>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-zinc-300 space-y-1">
              <p className="text-zinc-500"># Install SDK</p>
              <p>bun add @ai-credits/sdk</p>
              <p className="text-zinc-500 mt-2"># Import & Monetize</p>
              <p className="text-blue-400">const ai = createAI({'{'}</p>
              <p className="text-blue-400 pl-2">project: &quot;pk_live_*&quot;</p>
              <p className="text-blue-400">{'}'});</p>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-4">
          <p>&copy; {new Date().getFullYear()} AI Payment Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
