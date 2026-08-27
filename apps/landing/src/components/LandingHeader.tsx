import React, { useState } from "react";
import { Zap, ExternalLink, LayoutDashboard, BookOpen, Menu, X, Palette } from "lucide-react";
import { getEcosystemUrls } from "@ai-credits/shared";

export interface LandingHeaderProps {
  activeView?: "landing" | "studio";
  onSelectView?: (view: "landing" | "studio") => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  activeView = "landing",
  onSelectView
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const urls = getEcosystemUrls();

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Economics", href: "#economics" },
    { label: "Architecture", href: "#architecture" }
  ];

  return (
    <header className="border-b border-white/[0.06] bg-black/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => onSelectView?.("landing")}
            className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">AI Credits</span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            <button
              onClick={() => onSelectView?.("landing")}
              className={`transition-colors cursor-pointer ${
                activeView === "landing" ? "text-white font-semibold" : "hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSelectView?.("studio")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === "studio"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              Component Studio
            </button>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</a>
            ))}
            <a href={urls.docs} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
              Documentation <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <a href={urls.dashboard} target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
              Developer Console
            </a>
            <a href={urls.docs} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-sm">
              <BookOpen className="w-3.5 h-3.5" />
              Get Started
            </a>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black/95 px-4 py-4 space-y-2">
          <button
            onClick={() => { onSelectView?.("landing"); setMobileOpen(false); }}
            className="block w-full text-left text-sm text-zinc-300 py-2 hover:text-white"
          >
            Overview
          </button>
          <button
            onClick={() => { onSelectView?.("studio"); setMobileOpen(false); }}
            className="block w-full text-left text-sm text-blue-400 font-semibold py-2"
          >
            Component Studio
          </button>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block text-sm text-zinc-300 py-2 hover:text-white">{l.label}</a>
          ))}
          <a href={urls.dashboard} target="_blank" rel="noreferrer"
            className="block text-sm text-zinc-300 py-2 hover:text-white">Developer Console</a>
          <a href={urls.docs} target="_blank" rel="noreferrer"
            className="block text-sm text-blue-400 font-semibold py-2">Documentation</a>
        </div>
      )}
    </header>
  );
};
