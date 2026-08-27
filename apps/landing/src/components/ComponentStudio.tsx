import React, { useState } from "react";
import { OpenAILogo, GeminiLogo, DeepSeekLogo, ClaudeLogo } from "@ai-credits/react";
import {
  Sliders,
  Sparkles,
  Copy,
  Check,
  Eye,
  Code,
  Palette,
  Layers,
  Shield,
  CreditCard,
  Zap,
  RotateCcw,
  Layout
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
  { id: "amber", name: "Golden Amber", hex: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)", lightHex: "#fde68a" }
];

const THEMES = [
  { id: "oled", name: "OLED Black", bg: "#09090b", cardBg: "#0f1117", border: "rgba(255, 255, 255, 0.1)" },
  { id: "midnight", name: "Midnight Navy", bg: "#060913", cardBg: "#0d1322", border: "rgba(59, 130, 246, 0.2)" },
  { id: "charcoal", name: "Cyber Charcoal", bg: "#121316", cardBg: "#18191e", border: "rgba(255, 255, 255, 0.08)" }
];

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
  const [previewTab, setPreviewTab] = useState<"modal" | "card" | "badge">("modal");
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
      snippet = `import { AIPaymentModal } from "@ai-credits/react";

export function App() {
  return (
    <AIPaymentModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="${appName}"
      tagline="${tagline}"
      creditUnit="${creditLabel}"
      theme={{
        accentColor: "${accent.hex}",
        borderRadius: "${radius}px",
        background: "${theme.cardBg}"
      }}
      providers={[${showOpenAI ? '"openai", ' : ""}${showGemini ? '"gemini", ' : ""}${showDeepSeek ? '"deepseek", ' : ""}${showClaude ? '"claude"' : ""}]}
    />
  );
}`;
    } else if (codeLang === "webcomponent") {
      snippet = `<!-- Add to HTML -->
<script type="module" src="https://unpkg.com/@ai-credits/sdk/dist/widget.js"></script>

<ai-payment-widget
  app-name="${appName}"
  accent-color="${accent.hex}"
  border-radius="${radius}px"
  theme-bg="${theme.cardBg}"
  credit-label="${creditLabel}"
></ai-payment-widget>

<script>
  const widget = document.querySelector('ai-payment-widget');
  widget.open();
</script>`;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Palette className="w-3.5 h-3.5" />
          Component Theme Studio & Customizer
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Customize Your AI Payment Components
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
          Tweak colors, typography, providers, and layout in real-time. Copy production-ready React or Web Component code in one click.
        </p>
      </div>

      {/* Main Grid: Controls + Live Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customization Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 1: Appearance & Colors */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              1. Theme & Accent Color
            </h3>

            {/* Accent Color Palette */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Accent Color</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCENTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAccent(item)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      accent.id === item.id
                        ? "bg-zinc-900 text-white border-zinc-600 shadow-sm ring-1 ring-white/20"
                        : "bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200"
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
              <label className="block text-xs font-medium text-zinc-400 mb-2">Atmosphere / Background</label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border text-center ${
                      theme.id === t.id
                        ? "bg-zinc-900 text-white border-zinc-600 shadow-sm ring-1 ring-white/20"
                        : "bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-zinc-400 font-medium">Corner Radius</span>
                <span className="text-zinc-300 font-mono font-semibold">{radius}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                step="4"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Branding & Labels */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              2. Branding & Content
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Credit Unit Label</label>
                <input
                  type="text"
                  value={creditLabel}
                  onChange={(e) => setCreditLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: AI Providers Enabled */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              3. Enabled AI Providers
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={showOpenAI}
                  onChange={(e) => setShowOpenAI(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-200 font-semibold">OpenAI</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={showGemini}
                  onChange={(e) => setShowGemini(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-200 font-semibold">Google Gemini</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={showDeepSeek}
                  onChange={(e) => setShowDeepSeek(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-200 font-semibold">DeepSeek</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={showClaude}
                  onChange={(e) => setShowClaude(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-200 font-semibold">Claude</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Stage & Code Export (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Stage Frame */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Stage Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-zinc-400 ml-2">Live Component Preview</span>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  onClick={() => setPreviewTab("modal")}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    previewTab === "modal" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Modal View
                </button>
                <button
                  onClick={() => setPreviewTab("card")}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    previewTab === "card" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Paywall Card
                </button>
                <button
                  onClick={() => setPreviewTab("badge")}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    previewTab === "badge" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Mini Badge
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div
              className="p-6 sm:p-8 flex items-center justify-center min-h-[480px] relative transition-colors duration-200"
              style={{ backgroundColor: theme.bg }}
            >
              {/* Toast */}
              {toast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg z-30 animate-in fade-in slide-in-from-top-2">
                  {toast}
                </div>
              )}

              {/* MODE 1: Full 2-Column Modal */}
              {previewTab === "modal" && (
                <div
                  className="w-full max-w-2xl border shadow-2xl transition-all duration-200"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    borderRadius: `${radius}px`
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    {/* Left Col */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
                          style={{ background: accent.gradient }}
                        >
                          <Zap className="w-4 h-4 fill-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white tracking-tight">{appName}</h4>
                          <p className="text-[11px] text-zinc-400">{tagline}</p>
                        </div>
                      </div>

                      {/* Social Auth Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => showToast("Google authentication simulated!")}
                          className="w-full py-2 px-3 rounded-xl bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors cursor-pointer"
                        >
                          <span className="font-bold">G</span> Continue with Google
                        </button>
                        <button
                          onClick={() => showToast("GitHub authentication simulated!")}
                          className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <span>gh</span> Continue with GitHub
                        </button>
                      </div>

                      {/* Balance Display */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Your Balance</div>
                          <div className="text-sm font-bold text-white font-mono">
                            {simulatedBalance.toLocaleString()} {creditLabel}
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${accent.hex}20`,
                            color: accent.lightHex,
                            border: `1px solid ${accent.hex}40`
                          }}
                        >
                          Active
                        </span>
                      </div>

                      {/* Packs Grid */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { price: 1, credits: 100 },
                          { price: 3, credits: 350 },
                          { price: 5, credits: 650, popular: true },
                          { price: 10, credits: 1400 }
                        ].map((pack) => (
                          <div
                            key={pack.price}
                            onClick={() => {
                              setSimulatedBalance((b) => b + pack.credits);
                              showToast(`+${pack.credits} credits added!`);
                            }}
                            className="p-2 rounded-xl text-center border cursor-pointer transition-all hover:scale-105"
                            style={{
                              backgroundColor: pack.popular ? `${accent.hex}15` : "rgba(24, 24, 27, 0.8)",
                              borderColor: pack.popular ? accent.hex : "rgba(39, 39, 42, 0.8)"
                            }}
                          >
                            <div className="text-xs font-bold text-white">${pack.price}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{pack.credits}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Col: Providers */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-zinc-200 mb-2">Select Provider</h5>
                        <div className="space-y-2">
                          {showOpenAI && (
                            <div
                              onClick={() => setSelectedProvider("openai")}
                              className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs"
                              style={{
                                backgroundColor: selectedProvider === "openai" ? `${accent.hex}15` : "#18181b",
                                borderColor: selectedProvider === "openai" ? accent.hex : "#27272a"
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-[#10a37f] flex items-center justify-center text-white shrink-0">
                                  <OpenAILogo size={14} />
                                </div>
                                <span className="font-medium text-white">OpenAI GPT-4o</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">Fast & Smart</span>
                            </div>
                          )}

                          {showGemini && (
                            <div
                              onClick={() => setSelectedProvider("gemini")}
                              className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs"
                              style={{
                                backgroundColor: selectedProvider === "gemini" ? `${accent.hex}15` : "#18181b",
                                borderColor: selectedProvider === "gemini" ? accent.hex : "#27272a"
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
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
                              className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs"
                              style={{
                                backgroundColor: selectedProvider === "deepseek" ? `${accent.hex}15` : "#18181b",
                                borderColor: selectedProvider === "deepseek" ? accent.hex : "#27272a"
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-[#0284c7] flex items-center justify-center text-white shrink-0">
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
                              className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs"
                              style={{
                                backgroundColor: selectedProvider === "claude" ? `${accent.hex}15` : "#18181b",
                                borderColor: selectedProvider === "claude" ? accent.hex : "#27272a"
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-[#d97757] flex items-center justify-center text-white shrink-0">
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
                        Powered by Stripe & Double-Entry Ledger
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: Compact Paywall Card */}
              {previewTab === "card" && (
                <div
                  className="w-full max-w-sm border shadow-2xl p-6 space-y-4"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    borderRadius: `${radius}px`
                  }}
                >
                  <div className="text-center space-y-1">
                    <div
                      className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-white mb-2 shadow-lg"
                      style={{ background: accent.gradient }}
                    >
                      <Sparkles className="w-5 h-5 fill-white" />
                    </div>
                    <h4 className="text-base font-bold text-white">Unlock AI Feature</h4>
                    <p className="text-xs text-zinc-400">Requires 15 {creditLabel} to execute</p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                    <div className="text-[10px] uppercase font-mono text-zinc-400">Current Balance</div>
                    <div className="text-lg font-extrabold text-white font-mono">
                      {simulatedBalance} {creditLabel}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSimulatedBalance((b) => b + 350);
                      showToast("+350 credits recharged!");
                    }}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs text-white shadow-md transition-all hover:opacity-95 cursor-pointer"
                    style={{ background: accent.gradient }}
                  >
                    Instant Top-up ($3 for 350 credits)
                  </button>
                </div>
              )}

              {/* MODE 3: Mini Header Badge */}
              {previewTab === "badge" && (
                <div className="flex items-center gap-4">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 border shadow-lg cursor-pointer transition-all hover:scale-105"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      borderRadius: `${Math.min(radius, 999)}px`
                    }}
                    onClick={() => {
                      setSimulatedBalance((b) => b + 100);
                      showToast("Credit wallet opened!");
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent.hex }} />
                    <span className="text-xs font-bold text-white font-mono">
                      {simulatedBalance} {creditLabel}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ background: accent.gradient }}
                    >
                      + Top Up
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Code Export Generator */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                  Export Ready-to-use Code
                </h4>
              </div>

              {/* Lang Tabs */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  onClick={() => setCodeLang("react")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    codeLang === "react" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  React / Next.js
                </button>
                <button
                  onClick={() => setCodeLang("webcomponent")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    codeLang === "webcomponent" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Web Component
                </button>
                <button
                  onClick={() => setCodeLang("tailwind")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    codeLang === "tailwind" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  CSS Variables
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800/90 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed max-h-48">
                {codeLang === "react" && `import { AIPaymentModal } from "@ai-credits/react";

<AIPaymentModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="${appName}"
  tagline="${tagline}"
  creditUnit="${creditLabel}"
  theme={{
    accentColor: "${accent.hex}",
    borderRadius: "${radius}px",
    background: "${theme.cardBg}"
  }}
/>`}
                {codeLang === "webcomponent" && `<ai-payment-widget
  app-name="${appName}"
  accent-color="${accent.hex}"
  border-radius="${radius}px"
  theme-bg="${theme.cardBg}"
  credit-label="${creditLabel}"
></ai-payment-widget>`}
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
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
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
