import React, { useState } from "react";
import { Zap, ExternalLink, LayoutDashboard, BookOpen, Menu, X } from "lucide-react";

export const LandingHeader: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">AI Payment Platform</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</a>
            ))}
            <a href="http://localhost:5175" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
              Documentation <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <a href="http://localhost:5174" target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
              Developer Console
            </a>
            <a href="http://localhost:5175" target="_blank" rel="noreferrer"
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
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block text-sm text-zinc-300 py-2 hover:text-white">{l.label}</a>
          ))}
          <a href="http://localhost:5175" target="_blank" rel="noreferrer"
            className="block text-sm text-zinc-300 py-2 hover:text-white">Documentation</a>
          <a href="http://localhost:5174" target="_blank" rel="noreferrer"
            className="block text-sm text-zinc-300 py-2 hover:text-white">Developer Console</a>
        </div>
      )}
    </header>
  );
};
