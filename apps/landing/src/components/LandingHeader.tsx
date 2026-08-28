import React, { useState } from "react";
import { Star, Menu, X, Palette, ExternalLink } from "lucide-react";
import { getEcosystemUrls } from "@ai-credits/shared";

export interface LandingHeaderProps {
  activeView?: "landing" | "studio";
  onSelectView?: (view: "landing" | "studio") => void;
  onOpenModal?: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  activeView = "landing",
  onSelectView,
  onOpenModal,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const urls = getEcosystemUrls();

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Docs", href: urls.docs, external: true },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#security" },
    { label: "Changelog", href: "#changelog" },
  ];

  return (
    <header className="border-b border-blue-500/10 bg-[#030712]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <button
            onClick={() => onSelectView?.("landing")}
            className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/25">
              <div className="w-full h-full bg-[#070b15] rounded-[7px] flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-8.5 15h17L12 3z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors">
              AI Payment Platform
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noreferrer" : undefined}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                {l.label}
                {l.external && <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />}
              </a>
            ))}

            <button
              onClick={() => onSelectView?.(activeView === "studio" ? "landing" : "studio")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                activeView === "studio"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <Palette className="w-3 h-3 text-blue-400" />
              Component Studio
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Star on GitHub</span>
            </a>

            <button
              onClick={onOpenModal}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer"
            >
              Get Started
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800/80 bg-[#070b15]/95 px-4 py-4 space-y-2">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-zinc-300 py-1.5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => {
              onSelectView?.("studio");
              setMobileOpen(false);
            }}
            className="block w-full text-left text-sm text-blue-400 font-semibold py-1.5"
          >
            Component Studio
          </button>
          <div className="pt-2 flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Star on GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
