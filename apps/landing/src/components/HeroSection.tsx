import React, { useState } from "react";
import { Terminal, BookOpen, Users, CreditCard, Cpu, ShieldCheck, Copy, Check } from "lucide-react";
import { getEcosystemUrls } from "@ai-credits/shared";
import { TryInAgentsBar } from "./TryInAgentsBar";

type PM = "bun" | "npm" | "pnpm" | "yarn";

export interface HeroSectionProps {
  onOpenModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenModal }) => {
  const [pm, setPm] = useState<PM>("bun");
  const [copied, setCopied] = useState(false);
  const urls = getEcosystemUrls();

  const getCmd = (manager: PM): string => {
    switch (manager) {
      case "bun":
        return "bun add @ai-credits/sdk";
      case "npm":
        return "npm install @ai-credits/sdk";
      case "pnpm":
        return "pnpm add @ai-credits/sdk";
      case "yarn":
        return "yarn add @ai-credits/sdk";
    }
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(getCmd(pm));
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const worksWithPlatforms = [
    {
      name: "Next.js",
      iconUrl: "https://cdn.simpleicons.org/nextdotjs/ffffff",
      fallback: "/logos/nextdotjs.svg",
    },
    {
      name: "React",
      iconUrl: "https://cdn.simpleicons.org/react/61DAFB",
      fallback: "/logos/react.svg",
    },
    {
      name: "Node.js",
      iconUrl: "https://cdn.simpleicons.org/nodedotjs/5FA04E",
      fallback: "/logos/nodedotjs.svg",
    },
    {
      name: "Python",
      iconUrl: "https://cdn.simpleicons.org/python/3776AB",
      fallback: "/logos/python.svg",
    },
    {
      name: "TypeScript",
      iconUrl: "https://cdn.simpleicons.org/typescript/3178C6",
      fallback: "/logos/typescript.svg",
    },
  ];

  return (
    <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 hero-radial-glow overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-blue-950/60 border border-blue-500/30 text-blue-300 shadow-sm shadow-blue-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>The fastest way to add AI payments</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-white block">Zero API keys.</span>
              <span className="text-white">No </span>
              <span className="blue-gradient-text">financial str</span>
              <span className="font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(96,165,250,0.65)]">
                AI
              </span>
              <span className="blue-gradient-text">n.</span>
            </h1>

            {/* Subhead */}
            <p className="text-xl sm:text-2xl font-semibold text-zinc-200">
              Monetize AI features in 3 lines of code.
            </p>

            {/* Description */}
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
              AI Payment Platform handles credits, payments, and AI model costs so you can focus on building amazing products.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenModal}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                <span>Install SDK</span>
              </button>

              <a
                href={urls.docs}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl card-dark-glass hover:bg-slate-800/60 text-sm font-semibold text-zinc-200 hover:text-white transition-all"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>View Documentation</span>
              </a>
            </div>

            {/* Package Manager Install Box (Bun, NPM, PNPM, Yarn) */}
            <div className="pt-2 max-w-md">
              <div className="rounded-xl bg-[#090e1a]/95 border border-zinc-800/90 shadow-lg shadow-black/40 overflow-hidden">
                {/* Top switcher bar */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#060a14] border-b border-zinc-800/80">
                  <div className="flex items-center gap-1.5">
                    {(["bun", "npm", "pnpm", "yarn"] as PM[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPm(p)}
                        className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                          pm === p
                            ? "bg-zinc-800 text-white font-semibold shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer rounded hover:bg-zinc-800/60"
                    title="Copy install command"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Command Line */}
                <div className="px-4 py-3 font-mono text-xs text-zinc-200 flex items-center gap-2 select-all bg-[#040711]">
                  <span className="text-zinc-500 font-bold select-none">&gt;_</span>
                  <code className="text-zinc-100">{getCmd(pm)}</code>
                </div>
              </div>
            </div>

            {/* Works With Tech Stack with REAL Official Logos */}
            <div className="pt-4 flex flex-wrap items-center gap-3.5 text-xs text-zinc-400">
              <span className="text-zinc-500 font-medium mr-1">Works with</span>
              <div className="flex flex-wrap items-center gap-2.5">
                {worksWithPlatforms.map((platform) => (
                  <div
                    key={platform.name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#080e1e]/90 border border-blue-500/20 text-zinc-300 hover:border-blue-400/50 hover:text-white transition-all shadow-sm group"
                  >
                    <img
                      src={platform.iconUrl}
                      alt={platform.name}
                      className="w-3.5 h-3.5 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = platform.fallback;
                      }}
                      loading="lazy"
                    />
                    <span className="font-medium text-xs">{platform.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: 3D Holographic IDE & Connected Architecture Graphic */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px]">
            
            {/* SVG Connector Lines Behind Nodes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Line from IDE to Users (left) */}
              <path d="M 220 200 C 130 200, 100 210, 40 220" fill="none" stroke="url(#lineGlow)" strokeWidth="2" filter="url(#glowEffect)" />
              {/* Line from IDE to Credits (top right) */}
              <path d="M 420 120 C 470 100, 500 80, 540 60" fill="none" stroke="url(#lineGlow)" strokeWidth="2" filter="url(#glowEffect)" />
              {/* Line from IDE to AI Models (middle right) */}
              <path d="M 440 220 C 490 220, 520 210, 550 200" fill="none" stroke="url(#lineGlow)" strokeWidth="2" filter="url(#glowEffect)" />
              {/* Line from IDE to Payments (bottom right) */}
              <path d="M 420 320 C 480 340, 510 360, 540 370" fill="none" stroke="url(#lineGlow)" strokeWidth="2" filter="url(#glowEffect)" />
            </svg>

            {/* Floating Node: Users (Left) */}
            <div className="absolute -left-2 sm:left-2 top-[44%] z-20 flex flex-col items-center">
              <div className="w-11 h-11 rounded-xl bg-[#091124] border border-blue-500/40 p-2 shadow-lg shadow-blue-500/20 neon-border-glow flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] font-medium text-zinc-400 mt-1">Users</span>
            </div>

            {/* Floating Node: Credits (Top Right) */}
            <div className="absolute -right-2 sm:right-4 top-[8%] z-20 flex flex-col items-center">
              <div className="w-11 h-11 rounded-xl bg-[#091124] border border-blue-500/40 p-2 shadow-lg shadow-blue-500/20 neon-border-glow flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] font-medium text-zinc-400 mt-1">Credits</span>
            </div>

            {/* Floating Node: AI Models (Middle Right) */}
            <div className="absolute -right-2 sm:right-2 top-[42%] z-20 flex flex-col items-center">
              <div className="w-11 h-11 rounded-xl bg-[#091124] border border-blue-500/40 p-2 shadow-lg shadow-blue-500/20 neon-border-glow flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] font-medium text-zinc-400 mt-1">AI Models</span>
            </div>

            {/* Floating Node: Payments (Bottom Right) */}
            <div className="absolute -right-2 sm:right-4 top-[76%] z-20 flex flex-col items-center">
              <div className="w-11 h-11 rounded-xl bg-[#091124] border border-blue-500/40 p-2 shadow-lg shadow-blue-500/20 neon-border-glow flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] font-medium text-zinc-400 mt-1">Payments</span>
            </div>

            {/* Center Code Editor Window with 3D depth */}
            <div className="relative z-10 w-full max-w-[440px] rounded-2xl bg-[#080d1a]/95 border border-blue-500/30 shadow-2xl shadow-blue-900/30 backdrop-blur-xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
              
              {/* Window Title Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#060913] border-b border-blue-500/20">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 font-medium">
                  AI Payment Platform SDK
                </span>
                <div className="w-10" />
              </div>

              {/* Syntax Highlighted Code */}
              <div className="p-4 sm:p-5 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto select-all">
                <div className="flex">
                  {/* Line numbers */}
                  <div className="text-zinc-600 select-none pr-4 text-right shrink-0 space-y-0.5">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                    <div>6</div>
                    <div>7</div>
                    <div>8</div>
                    <div>9</div>
                    <div>10</div>
                    <div>11</div>
                    <div>12</div>
                  </div>

                  {/* Code tokens */}
                  <div className="space-y-0.5 min-w-0">
                    <div>
                      <span className="text-purple-400">import</span> &#123; <span className="text-blue-400 font-semibold">AiPay</span> &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">&apos;@ai-credits/sdk&apos;</span>;
                    </div>
                    <div>&nbsp;</div>
                    <div>
                      <span className="text-purple-400">const</span> <span className="text-blue-300">aiPay</span> = <span className="text-purple-400">new</span> <span className="text-yellow-300">AiPay</span>(&#123;
                    </div>
                    <div className="pl-4">
                      <span className="text-zinc-300">apiKey</span>: <span className="text-emerald-400">&apos;pk_live_sec9...&apos;</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-zinc-300">model</span>: <span className="text-emerald-400">&apos;gpt-4o&apos;</span>,
                    </div>
                    <div>&#125;);</div>
                    <div>&nbsp;</div>
                    <div>
                      <span className="text-purple-400">const</span> <span className="text-blue-300">result</span> = <span className="text-purple-400">await</span> <span className="text-blue-300">aiPay</span>.<span className="text-cyan-300">charge</span>(&#123;
                    </div>
                    <div className="pl-4">
                      <span className="text-zinc-300">userId</span>: <span className="text-emerald-400">&apos;user_123&apos;</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-zinc-300">credits</span>: <span className="text-amber-400">10</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-zinc-300">prompt</span>: <span className="text-emerald-400">&apos;Explain quantum physics&apos;</span>,
                    </div>
                    <div>&#125;);</div>
                  </div>
                </div>
              </div>

              {/* Bottom Pedestal Glow with Holographic 3D Delta Mark */}
              <div className="relative pt-6 pb-4 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent flex flex-col items-center justify-center">
                <div className="w-32 h-6 pedestal-glow rounded-full -mb-3" />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-blue-500/30 to-indigo-600/10 border border-blue-400/40 p-2 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <svg className="w-6 h-6 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="m12 3-8.5 15h17L12 3z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* TRY IN AI Agents Bar */}
        <TryInAgentsBar />

      </div>
    </section>
  );
};
