import React, { useState } from "react";
import {
  OpenAILogo,
  GeminiLogo,
  DeepSeekLogo,
  ClaudeLogo,
  CreditCounter,
  CreditPacksGrid,
  PaywallGuard,
} from "@ai-credits/react";
import {
  Sparkles,
  Copy,
  Check,
  Zap,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

export type Accent = {
  id: string;
  name: string;
  hex: string;
  glow: string;
};

const ACCENTS: Accent[] = [
  { id: "indigo", name: "Indigo", hex: "#6366f1", glow: "rgba(99, 102, 241, 0.25)" },
  { id: "blue", name: "Blue", hex: "#3b82f6", glow: "rgba(59, 130, 246, 0.25)" },
  { id: "purple", name: "Purple", hex: "#a855f7", glow: "rgba(168, 85, 247, 0.25)" },
  { id: "emerald", name: "Emerald", hex: "#10b981", glow: "rgba(16, 185, 129, 0.25)" },
  { id: "rose", name: "Rose", hex: "#f43f5e", glow: "rgba(244, 63, 94, 0.25)" },
];

type ActiveTab = "overview" | "counter" | "pricing" | "paywall" | "modal";

export const ComponentStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [accent, setAccent] = useState<Accent>(ACCENTS[1]);
  const [balance, setBalance] = useState(140);
  const [selectedModel, setSelectedModel] = useState<"openai" | "gemini" | "deepseek" | "claude">("openai");
  const [codeCopied, setCodeCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case "counter":
        return `<CreditCounter 
  balance={${balance}} 
  theme="glass" 
  onTopUpClick={() => setModalOpen(true)} 
/>`;
      case "pricing":
        return `<CreditPacksGrid 
  accentColor="${accent.hex}" 
  onSelectPack={(pack) => handleStripeCheckout(pack.id)} 
/>`;
      case "paywall":
        return `<PaywallGuard 
  requiredCredits={20} 
  balance={${balance}} 
  featureName="Executive AI Summary"
  onTopUpClick={() => setModalOpen(true)}
>
  <YourAIFeatureComponent />
</PaywallGuard>`;
      case "modal":
      case "overview":
      default:
        return `import { CreditCounter, PaywallGuard, AICreditsModal } from "@ai-credits/react";

export function MyApp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* 1. Header Counter */}
      <CreditCounter balance={${balance}} onTopUpClick={() => setIsOpen(true)} />

      {/* 2. Paywall Protection */}
      <PaywallGuard requiredCredits={15} balance={${balance}} onTopUpClick={() => setIsOpen(true)}>
        <AIGenerator />
      </PaywallGuard>

      {/* 3. Checkout Modal */}
      <AICreditsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}`;
    }
  };

  const copyCode = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(getActiveCode());
      }
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      setCodeCopied(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#06080e] text-zinc-100 flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-10 pb-24 overflow-hidden selection:bg-blue-500/20">
      {/* Background Soft Glow Spotlight */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 opacity-40"
        style={{ background: accent.glow }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-white text-xs font-mono font-medium px-4 py-2 rounded-full border border-zinc-700 shadow-2xl backdrop-blur-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-medium mb-4 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>Interactive Component Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          Drop-in UI Components
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mt-3 font-normal leading-relaxed">
          Production-grade React &amp; Web Components designed for AI credit billing, paywalls, and balances.
        </p>
      </div>

      {/* Floating Segmented Navigation Bar */}
      <div className="relative z-20 mb-8 p-1.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 backdrop-blur-2xl shadow-2xl flex items-center gap-1 max-w-full overflow-x-auto">
        {[
          { id: "overview", label: "Full App Showcase" },
          { id: "counter", label: "Header Counter" },
          { id: "pricing", label: "Pricing Grid" },
          { id: "paywall", label: "Paywall Guard" },
          { id: "modal", label: "Top-up Modal" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? "bg-zinc-800 text-white shadow-lg font-semibold border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Interactive Stage */}
      <div className="relative z-10 w-full max-w-4xl min-h-[480px] rounded-3xl bg-[#090c15]/90 border border-zinc-800/80 backdrop-blur-2xl shadow-2xl p-6 sm:p-10 flex flex-col items-center justify-center transition-all duration-300">
        
        {/* VIEW 1: FULL APP SHOWCASE */}
        {activeTab === "overview" && (
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in duration-300">
            {/* Top Bar Mock */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: accent.hex }}
                >
                  AI
                </div>
                <span className="text-xs font-semibold text-zinc-200">VideoSummarizer App</span>
              </div>

              {/* CreditCounter Component */}
              <CreditCounter
                balance={balance}
                onTopUpClick={() => {
                  setBalance((b) => b + 100);
                  showToast("+100 credits topped up!");
                }}
              />
            </div>

            {/* Paywall Protected AI Feature */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-zinc-100">AI Deep Summary Generator</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  15 credits
                </span>
              </div>

              <PaywallGuard
                requiredCredits={15}
                balance={balance}
                featureName="Deep Summary"
                onTopUpClick={() => {
                  setBalance((b) => b + 100);
                  showToast("+100 credits added!");
                }}
              >
                <div className="p-4 rounded-xl bg-[#0d1322] border border-blue-500/20 text-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Credits verified. Ready to run.</span>
                  </div>
                  <p className="text-zinc-300 font-mono text-[11px] leading-relaxed">
                    &quot;Comprehensive 3-point breakdown generated using GPT-4o with double-entry ledger settlement.&quot;
                  </p>
                  <button
                    onClick={() => {
                      setBalance((b) => Math.max(0, b - 15));
                      showToast("Action executed (-15 credits)");
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all active:scale-95 cursor-pointer shadow-md"
                    style={{ backgroundColor: accent.hex }}
                  >
                    Run Action (-15 credits)
                  </button>
                </div>
              </PaywallGuard>
            </div>
          </div>
        )}

        {/* VIEW 2: HEADER CREDIT COUNTER */}
        {activeTab === "counter" && (
          <div className="space-y-8 text-center animate-in fade-in duration-300">
            <div className="text-xs text-zinc-400 font-mono">
              Live &lt;CreditCounter /&gt; with interactive + Top Up:
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">Theme: Glass</span>
                <CreditCounter
                  balance={balance}
                  theme="glass"
                  onTopUpClick={() => {
                    setBalance((b) => b + 100);
                    showToast("+100 credits added!");
                  }}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">Theme: Dark</span>
                <CreditCounter
                  balance={balance}
                  theme="dark"
                  onTopUpClick={() => {
                    setBalance((b) => b + 100);
                    showToast("+100 credits added!");
                  }}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">Theme: Light</span>
                <CreditCounter
                  balance={balance}
                  theme="light"
                  onTopUpClick={() => {
                    setBalance((b) => b + 100);
                    showToast("+100 credits added!");
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: PRICING GRID */}
        {activeTab === "pricing" && (
          <div className="w-full max-w-3xl animate-in fade-in duration-300">
            <CreditPacksGrid
              accentColor={accent.hex}
              onSelectPack={(pack) => {
                setBalance((b) => b + pack.credits);
                showToast(`Selected ${pack.name} (+${pack.credits} credits)!`);
              }}
            />
          </div>
        )}

        {/* VIEW 4: PAYWALL GUARD */}
        {activeTab === "paywall" && (
          <div className="w-full max-w-md animate-in fade-in duration-300">
            <PaywallGuard
              requiredCredits={100}
              balance={balance}
              featureName="AI Fine-Tuning"
              onTopUpClick={() => {
                setBalance(250);
                showToast("Wallet recharged to 250 credits!");
              }}
            >
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Feature Unlocked</h4>
                <p className="text-xs text-zinc-400">
                  You have {balance} credits (100 required).
                </p>
              </div>
            </PaywallGuard>
          </div>
        )}

        {/* VIEW 5: TOP-UP MODAL */}
        {activeTab === "modal" && (
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0c101c] border border-zinc-800 shadow-2xl space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: accent.hex }}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Top Up AI Credits</h4>
                  <p className="text-[11px] text-zinc-400">Secure checkout via Stripe</p>
                </div>
              </div>
              <span className="text-xs font-mono text-zinc-300 font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                {balance} cr
              </span>
            </div>

            {/* Provider Picker */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-2">Model Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "openai", name: "OpenAI", logo: <OpenAILogo size={13} />, bg: "#10a37f" },
                  { id: "gemini", name: "Gemini", logo: <GeminiLogo size={15} />, bg: "#18181b" },
                  { id: "deepseek", name: "DeepSeek", logo: <DeepSeekLogo size={13} />, bg: "#0284c7" },
                  { id: "claude", name: "Claude", logo: <ClaudeLogo size={13} />, bg: "#d97757" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedModel(p.id as any)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      selectedModel === p.id
                        ? "bg-zinc-800 text-white border-zinc-600 shadow-sm"
                        : "bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0" style={{ backgroundColor: p.bg }}>
                      {p.logo}
                    </div>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Packs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { credits: 100, price: "$5" },
                { credits: 500, price: "$20", pop: true },
                { credits: 2000, price: "$65" },
              ].map((pack) => (
                <div
                  key={pack.credits}
                  onClick={() => {
                    setBalance((b) => b + pack.credits);
                    showToast(`+${pack.credits} credits added!`);
                  }}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                    pack.pop
                      ? "bg-blue-950/30 border-blue-500/50 shadow-md"
                      : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-xs font-bold text-white">{pack.price}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{pack.credits} cr</div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Universal AI Wallet with instant Stripe settlement</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Toolbar (Minimalist Controls & Code) */}
      <div className="relative z-20 mt-8 w-full max-w-4xl p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 backdrop-blur-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Quick Balance Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-mono">Test Balance:</span>
          <div className="flex items-center gap-1.5">
            {[
              { label: "0 cr", val: 0 },
              { label: "50 cr", val: 50 },
              { label: "140 cr", val: 140 },
              { label: "500 cr", val: 500 },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setBalance(item.val);
                  showToast(`Balance set to ${item.val} cr`);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  balance === item.val
                    ? "bg-zinc-800 text-white font-bold border border-zinc-700"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Accent Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-mono">Accent:</span>
          <div className="flex items-center gap-1.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a)}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                  accent.id === a.id ? "scale-125 ring-2 ring-white/40 shadow-md" : "opacity-60 hover:opacity-100"
                }`}
                style={{ backgroundColor: a.hex }}
                title={a.name}
              />
            ))}
          </div>
        </div>

        {/* Right: Copy Code */}
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer ml-auto"
        >
          {codeCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Component Code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
