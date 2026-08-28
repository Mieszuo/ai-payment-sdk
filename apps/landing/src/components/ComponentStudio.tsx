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
  Sliders,
  Sparkles,
  Copy,
  Check,
  Code,
  Palette,
  Layers,
  Shield,
  Zap,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

export type AccentColor = {
  id: string;
  name: string;
  hex: string;
  gradient: string;
  lightHex: string;
};

const ACCENTS: AccentColor[] = [
  { id: "indigo", name: "Electric Indigo", hex: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", lightHex: "#818cf8" },
  { id: "blue", name: "Cyber Blue", hex: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)", lightHex: "#93c5fd" },
  { id: "purple", name: "Neon Purple", hex: "#a855f7", gradient: "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)", lightHex: "#d8b4fe" },
  { id: "emerald", name: "Emerald Matrix", hex: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", lightHex: "#6ee7b7" },
  { id: "rose", name: "Sunset Rose", hex: "#f43f5e", gradient: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)", lightHex: "#fda4af" },
  { id: "amber", name: "Golden Amber", hex: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)", lightHex: "#fde68a" },
];

const THEMES = [
  { id: "oled", name: "OLED Black", bg: "#09090b", cardBg: "#0f1117", border: "rgba(255, 255, 255, 0.1)" },
  { id: "midnight", name: "Midnight Navy", bg: "#060913", cardBg: "#0d1322", border: "rgba(59, 130, 246, 0.2)" },
  { id: "charcoal", name: "Cyber Charcoal", bg: "#121316", cardBg: "#18191e", border: "rgba(255, 255, 255, 0.08)" },
];

type ActiveTab = "all" | "modal" | "counter" | "packs" | "paywall";

export const ComponentStudio: React.FC = () => {
  // Customization state
  const [accent, setAccent] = useState<AccentColor>(ACCENTS[0]);
  const [theme, setTheme] = useState(THEMES[0]);
  const [radius, setRadius] = useState<number>(20);
  const [appName, setAppName] = useState("Use AI");
  const [tagline, setTagline] = useState("Log in to continue and unlock AI features");
  const [creditLabel, setCreditLabel] = useState("AI credits");
  const [showOpenAI, setShowOpenAI] = useState(true);
  const [showGemini, setShowGemini] = useState(true);
  const [showDeepSeek, setShowDeepSeek] = useState(true);
  const [showClaude, setShowClaude] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [codeLang, setCodeLang] = useState<"react" | "webcomponent" | "tailwind">("react");
  const [copied, setCopied] = useState(false);
  const [simulatedBalance, setSimulatedBalance] = useState(142);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyCode = async () => {
    let snippet = "";
    if (codeLang === "react") {
      snippet = `import { AICreditsModal, CreditCounter, CreditPacksGrid, PaywallGuard } from "@ai-credits/react";

// 1. Counter in Navigation
<CreditCounter balance={${simulatedBalance}} onTopUpClick={() => setOpen(true)} theme="glass" />

// 2. Paywall Protection
<PaywallGuard requiredCredits={15} balance={${simulatedBalance}} onTopUpClick={() => setOpen(true)}>
  <MyProtectedAIFeature />
</PaywallGuard>

// 3. Drop-in Purchase Modal
<AICreditsModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="${appName}"
  tagline="${tagline}"
  initialBalance={${simulatedBalance}}
  accentColor="${accent.hex}"
/>`;
    } else if (codeLang === "webcomponent") {
      snippet = `<!-- Vanilla HTML / Web Component -->
<script type="module" src="https://unpkg.com/@ai-credits/sdk/dist/widget.js"></script>

<ai-credits-widget
  app-name="${appName}"
  accent-color="${accent.hex}"
  border-radius="${radius}px"
  theme-bg="${theme.cardBg}"
  credit-label="${creditLabel}"
></ai-credits-widget>`;
    } else {
      snippet = `/* Tailwind CSS / Theme variables */
:root {
  --ai-widget-accent: ${accent.hex};
  --ai-widget-accent-light: ${accent.lightHex};
  --ai-widget-bg: ${theme.cardBg};
  --ai-widget-border: ${theme.border};
  --ai-widget-radius: ${radius}px;
}`;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(snippet);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3.5 shadow-sm">
          <Palette className="w-3.5 h-3.5" />
          Component Studio &amp; Live Playground
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl lg:text-5xl">
          Interactive Developer Showcase
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mt-2.5 max-w-2xl leading-relaxed">
          Test, customize, and interact with all AI payment UI components live in real-time with fluid spring physics, radiant beam pulses, and 1-click code export.
        </p>
      </div>

      {/* Main Grid: Controls + Live Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Customization Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section 1: Wallet Balance Simulator */}
          <div className="bg-[#080d1a]/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl shadow-blue-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2 font-mono">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Wallet Simulator
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-400/40 text-xs font-mono font-bold text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{simulatedBalance} cr</span>
              </div>
            </div>

            <div>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={simulatedBalance}
                onChange={(e) => setSimulatedBalance(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono mt-1.5">
                <span>0 (Empty)</span>
                <span>100 (Standard)</span>
                <span>500 (Pro)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => {
                  setSimulatedBalance(0);
                  showToast("Balance set to 0 (Test Paywall trigger)");
                }}
                className="px-2.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono font-medium text-rose-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm text-center"
              >
                Set 0 cr
              </button>
              <button
                onClick={() => {
                  setSimulatedBalance((b) => b + 50);
                  showToast("+50 credits added!");
                }}
                className="px-2.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono font-medium text-emerald-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm text-center"
              >
                +50 cr
              </button>
              <button
                onClick={() => {
                  setSimulatedBalance(250);
                  showToast("Reset to 250 credits");
                }}
                className="px-2.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono font-medium text-blue-300 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm text-center"
              >
                Reset 250
              </button>
            </div>
          </div>

          {/* Section 2: Appearance & Colors */}
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Theme &amp; Accent
            </h3>

            {/* Accent Palette */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Brand Accent Color</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCENTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAccent(item)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border cursor-pointer active:scale-95 ${
                      accent.id === item.id
                        ? "bg-zinc-900 text-white border-zinc-500 shadow-md ring-1 ring-white/20"
                        : "bg-zinc-900/50 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.hex }} />
                    <span className="truncate">{item.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Atmosphere Background */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Atmosphere / Canvas</label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border text-center cursor-pointer active:scale-95 ${
                      theme.id === t.id
                        ? "bg-zinc-900 text-white border-zinc-500 shadow-md ring-1 ring-white/20"
                        : "bg-zinc-900/50 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-zinc-400 font-medium">Border Radius</span>
                <span className="text-zinc-300 font-mono font-semibold">{radius}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                step="4"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Section 3: Branding & Content */}
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Branding &amp; Labels
            </h3>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">App Title</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-medium transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Credit Unit Label</label>
              <input
                type="text"
                value={creditLabel}
                onChange={(e) => setCreditLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Section 4: AI Providers */}
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Active AI Models
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer text-xs transition-colors">
                <input
                  type="checkbox"
                  checked={showOpenAI}
                  onChange={(e) => setShowOpenAI(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-200 font-medium">OpenAI</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer text-xs transition-colors">
                <input
                  type="checkbox"
                  checked={showGemini}
                  onChange={(e) => setShowGemini(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-200 font-medium">Google Gemini</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer text-xs transition-colors">
                <input
                  type="checkbox"
                  checked={showDeepSeek}
                  onChange={(e) => setShowDeepSeek(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-200 font-medium">DeepSeek</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer text-xs transition-colors">
                <input
                  type="checkbox"
                  checked={showClaude}
                  onChange={(e) => setShowClaude(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-200 font-medium">Claude</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Showcase Stage */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Top Stage Bar with View Tabs */}
            <div className="flex flex-wrap items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/70 backdrop-blur-md gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-zinc-400 ml-2 font-semibold">
                  Live Component Canvas
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    activeTab === "all" ? "bg-blue-600 text-white font-semibold shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All in One
                </button>
                <button
                  onClick={() => setActiveTab("modal")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    activeTab === "modal" ? "bg-blue-600 text-white font-semibold shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Modal
                </button>
                <button
                  onClick={() => setActiveTab("counter")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    activeTab === "counter" ? "bg-blue-600 text-white font-semibold shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Header Counter
                </button>
                <button
                  onClick={() => setActiveTab("packs")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    activeTab === "packs" ? "bg-blue-600 text-white font-semibold shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Pricing Grid
                </button>
                <button
                  onClick={() => setActiveTab("paywall")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    activeTab === "paywall" ? "bg-blue-600 text-white font-semibold shadow-md" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Paywall Guard
                </button>
              </div>
            </div>

            {/* Canvas Stage Area */}
            <div
              className="p-6 sm:p-10 min-h-[540px] relative transition-colors duration-300 flex flex-col items-center justify-center gap-8"
              style={{ backgroundColor: theme.bg }}
            >
              {/* Toast Feedback */}
              {toast && (
                <div className="fixed top-20 right-8 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{toast}</span>
                </div>
              )}

              {/* VIEW 1: ALL COMPONENTS COMBINED IN A LIVE APP DEMO */}
              {activeTab === "all" && (
                <div className="w-full space-y-8 max-w-2xl animate-in fade-in duration-300">
                  {/* Mock Navigation Bar with <CreditCounter /> */}
                  <div
                    className="p-4 sm:p-5 rounded-2xl border flex items-center justify-between shadow-xl transition-all duration-300"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
                        style={{ background: accent.gradient }}
                      >
                        <Zap className="w-4 h-4 fill-white" />
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight">{appName} Studio</span>
                    </div>

                    {/* Live CreditCounter */}
                    <CreditCounter
                      balance={simulatedBalance}
                      onTopUpClick={() => {
                        setActiveTab("modal");
                        showToast("Opened full top-up modal!");
                      }}
                      theme="glass"
                    />
                  </div>

                  {/* Mock AI Action gated with <PaywallGuard /> */}
                  <div
                    className="p-6 sm:p-7 rounded-2xl border space-y-4 shadow-xl transition-all duration-300"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        AI Executive Resume Polish
                      </h4>
                      <span className="text-xs font-mono text-zinc-400 font-semibold px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                        Cost: 15 {creditLabel}
                      </span>
                    </div>

                    <PaywallGuard
                      requiredCredits={15}
                      balance={simulatedBalance}
                      featureName="Resume Polish"
                      onTopUpClick={() => {
                        setSimulatedBalance((b) => b + 100);
                        showToast("+100 credits recharged!");
                      }}
                    >
                      <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-zinc-300 space-y-3.5">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>AI Feature Ready (Sufficient Credit Balance)</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-mono bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                          Output: &quot;Senior Full-Stack Architect with 8+ years scaling distributed payment systems, PostgreSQL 2-Phase Locking, and AI Gateway routers.&quot;
                        </p>
                        <button
                          onClick={() => {
                            setSimulatedBalance((b) => Math.max(0, b - 15));
                            showToast("Action executed (-15 credits)");
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all duration-200 active:scale-95 hover:brightness-110 cursor-pointer"
                          style={{ background: accent.gradient }}
                        >
                          Execute Again (-15 cr)
                        </button>
                      </div>
                    </PaywallGuard>
                  </div>
                </div>
              )}

              {/* VIEW 2: FULL 2-COLUMN AICreditsModal */}
              {activeTab === "modal" && (
                <div
                  className="w-full max-w-2xl border shadow-2xl transition-all duration-300 animate-in fade-in"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    borderRadius: `${radius}px`,
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
                    {/* Left Col: Account & Packs */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                          style={{ background: accent.gradient }}
                        >
                          <Zap className="w-4 h-4 fill-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white tracking-tight">{appName}</h4>
                          <p className="text-[11px] text-zinc-400">{tagline}</p>
                        </div>
                      </div>

                      {/* Social Login Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => showToast("Google authentication simulated!")}
                          className="w-full py-2.5 px-3 rounded-xl bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer shadow-sm"
                        >
                          <span className="font-bold">G</span> Continue with Google
                        </button>
                        <button
                          onClick={() => showToast("GitHub authentication simulated!")}
                          className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shadow-sm"
                        >
                          <span>gh</span> Continue with GitHub
                        </button>
                      </div>

                      {/* Balance Display */}
                      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Your Balance</div>
                          <div className="text-sm font-bold text-white font-mono">
                            {simulatedBalance.toLocaleString()} {creditLabel}
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono"
                          style={{
                            backgroundColor: `${accent.hex}20`,
                            color: accent.lightHex,
                            border: `1px solid ${accent.hex}40`,
                          }}
                        >
                          Active
                        </span>
                      </div>

                      {/* Packs Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { price: 1, credits: 100 },
                          { price: 3, credits: 350 },
                          { price: 5, credits: 650, popular: true },
                          { price: 10, credits: 1400 },
                        ].map((pack) => (
                          <div
                            key={pack.price}
                            onClick={() => {
                              setSimulatedBalance((b) => b + pack.credits);
                              showToast(`+${pack.credits} credits purchased via Stripe!`);
                            }}
                            className="p-2.5 rounded-xl text-center border cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: pack.popular ? `${accent.hex}15` : "rgba(24, 24, 27, 0.8)",
                              borderColor: pack.popular ? accent.hex : "rgba(39, 39, 42, 0.8)",
                            }}
                          >
                            <div className="text-xs font-bold text-white">${pack.price}</div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{pack.credits}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Col: AI Provider Selection */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-zinc-200 mb-2.5">Select Provider</h5>
                        <div className="space-y-2">
                          {showOpenAI && (
                            <div
                              onClick={() => setSelectedProvider("openai")}
                              className="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-95 text-xs"
                              style={{
                                backgroundColor: selectedProvider === "openai" ? `${accent.hex}15` : "#18181b",
                                borderColor: selectedProvider === "openai" ? accent.hex : "#27272a",
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-[#10a37f] flex items-center justify-center text-white shrink-0 shadow-sm">
                                  <OpenAILogo size={14} />
                                </div>
                                <span className="font-medium text-white">OpenAI GPT-4o</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">Fast &amp; Smart</span>
                            </div>
                          )}

                          {showGemini && (
                            <div
                              onClick={() => setSelectedProvider("gemini")}
                              className="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-95 text-xs"
                              style={{
                                backgroundColor: selectedProvider === "gemini" ? `${accent.hex}15` : "#18181b",
                                borderColor: selectedProvider === "gemini" ? accent.hex : "#27272a",
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
                                  <GeminiLogo size={16} />
                                </div>
                                <span className="font-medium text-white">Google Gemini</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">Multimodal</span>
                            </div>
                          )}

                          {showDeepSeek && (
                            <div
                              onClick={() => setSelectedProvider("deepseek")}
                              className="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-95 text-xs"
                              style={{
                                backgroundColor: selectedProvider === "deepseek" ? `${accent.hex}15` : "#18181b",
                                borderColor: selectedProvider === "deepseek" ? accent.hex : "#27272a",
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-[#0284c7] flex items-center justify-center text-white shrink-0 shadow-sm">
                                  <DeepSeekLogo size={14} />
                                </div>
                                <span className="font-medium text-white">DeepSeek V3/R1</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">Ultra Low Cost</span>
                            </div>
                          )}

                          {showClaude && (
                            <div
                              onClick={() => setSelectedProvider("claude")}
                              className="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-95 text-xs"
                              style={{
                                backgroundColor: selectedProvider === "claude" ? `${accent.hex}15` : "#18181b",
                                borderColor: selectedProvider === "claude" ? accent.hex : "#27272a",
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-[#d97757] flex items-center justify-center text-white shrink-0 shadow-sm">
                                  <ClaudeLogo size={14} />
                                </div>
                                <span className="font-medium text-white">Anthropic Claude</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">Coding/Reasoning</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500 flex items-center gap-1.5 justify-center">
                        <Shield className="w-3 h-3 text-zinc-400" />
                        Powered by Stripe &amp; Double-Entry Ledger
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: HEADER CREDIT COUNTER BADGE */}
              {activeTab === "counter" && (
                <div className="space-y-8 text-center animate-in fade-in">
                  <div className="text-xs text-zinc-400">
                    Live instances of <code className="text-blue-300 font-mono font-semibold">&lt;CreditCounter /&gt;</code> in 3 themes:
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-8">
                    <div className="flex flex-col items-center gap-2.5">
                      <span className="text-[10px] text-zinc-500 font-mono font-medium">Theme: Glass</span>
                      <CreditCounter
                        balance={simulatedBalance}
                        theme="glass"
                        onTopUpClick={() => {
                          setSimulatedBalance((b) => b + 100);
                          showToast("+100 credits topped up!");
                        }}
                      />
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                      <span className="text-[10px] text-zinc-500 font-mono font-medium">Theme: Dark</span>
                      <CreditCounter
                        balance={simulatedBalance}
                        theme="dark"
                        onTopUpClick={() => {
                          setSimulatedBalance((b) => b + 100);
                          showToast("+100 credits topped up!");
                        }}
                      />
                    </div>

                    <div className="flex flex-col items-center gap-2.5">
                      <span className="text-[10px] text-zinc-500 font-mono font-medium">Theme: Light</span>
                      <CreditCounter
                        balance={simulatedBalance}
                        theme="light"
                        onTopUpClick={() => {
                          setSimulatedBalance((b) => b + 100);
                          showToast("+100 credits topped up!");
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 4: STANDALONE PRICING GRID */}
              {activeTab === "packs" && (
                <div className="w-full max-w-3xl animate-in fade-in">
                  <CreditPacksGrid
                    accentColor={accent.hex}
                    onSelectPack={(pack) => {
                      setSimulatedBalance((b) => b + pack.credits);
                      showToast(`Purchased ${pack.name} (+${pack.credits} credits)!`);
                    }}
                  />
                </div>
              )}

              {/* VIEW 5: PAYWALL GUARD */}
              {activeTab === "paywall" && (
                <div className="w-full max-w-lg animate-in fade-in">
                  <PaywallGuard
                    requiredCredits={100}
                    balance={simulatedBalance}
                    featureName="Deep Research Model Run"
                    onTopUpClick={() => {
                      setSimulatedBalance(200);
                      showToast("Recharged to 200 credits! Paywall cleared.");
                    }}
                  >
                    <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-2.5 shadow-xl">
                      <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto animate-pulse-dot" />
                      <h4 className="text-base font-bold text-white">Access Granted</h4>
                      <p className="text-xs text-zinc-300">
                        You have {simulatedBalance} credits (required: 100).
                      </p>
                    </div>
                  </PaywallGuard>
                </div>
              )}
            </div>
          </div>

          {/* Code Export Generator */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                  Export Ready-to-use Code
                </h4>
              </div>

              {/* Lang Tabs */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
                <button
                  onClick={() => setCodeLang("react")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    codeLang === "react" ? "bg-zinc-800 text-white shadow-sm font-semibold" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  React / Next.js
                </button>
                <button
                  onClick={() => setCodeLang("webcomponent")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    codeLang === "webcomponent" ? "bg-zinc-800 text-white shadow-sm font-semibold" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Web Component
                </button>
                <button
                  onClick={() => setCodeLang("tailwind")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    codeLang === "tailwind" ? "bg-zinc-800 text-white shadow-sm font-semibold" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  CSS Variables
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative">
              <pre className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed max-h-52 select-all shadow-inner">
                {codeLang === "react" && `import { AICreditsModal, CreditCounter, CreditPacksGrid, PaywallGuard } from "@ai-credits/react";

// 1. Counter in Navigation
<CreditCounter balance={${simulatedBalance}} onTopUpClick={() => setOpen(true)} theme="glass" />

// 2. Paywall Protection
<PaywallGuard requiredCredits={15} balance={${simulatedBalance}} onTopUpClick={() => setOpen(true)}>
  <MyProtectedAIFeature />
</PaywallGuard>

// 3. Drop-in Purchase Modal
<AICreditsModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="${appName}"
  tagline="${tagline}"
  initialBalance={${simulatedBalance}}
  accentColor="${accent.hex}"
/>`}
                {codeLang === "webcomponent" && `<!-- Vanilla JS / HTML -->
<script type="module" src="https://unpkg.com/@ai-credits/sdk/dist/widget.js"></script>

<ai-credits-widget
  app-name="${appName}"
  accent-color="${accent.hex}"
  border-radius="${radius}px"
  theme-bg="${theme.cardBg}"
  credit-label="${creditLabel}"
></ai-credits-widget>`}
                {codeLang === "tailwind" && `:root {
  --ai-widget-accent: ${accent.hex};
  --ai-widget-accent-light: ${accent.lightHex};
  --ai-widget-bg: ${theme.cardBg};
  --ai-widget-border: ${theme.border};
  --ai-widget-radius: ${radius}px;
}`}
              </pre>
              <button
                onClick={handleCopyCode}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-medium text-zinc-200 transition-all duration-200 shadow-md cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
