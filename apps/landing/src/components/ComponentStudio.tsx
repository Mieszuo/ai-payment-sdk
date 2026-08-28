import React, { useState } from "react";
import {
  OpenAILogo,
  GeminiLogo,
  DeepSeekLogo,
  ClaudeLogo,
  CreditCounter,
  CreditPacksGrid,
  PaywallGuard,
  AICreditsModal,
  ApplePayLogo,
  GooglePayLogo,
  VisaLogo,
  MastercardLogo,
} from "@ai-credits/react";
import {
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  CreditCard,
  Maximize2
} from "lucide-react";

export type Accent = {
  id: string;
  name: string;
  hex: string;
  glow: string;
};

const ACCENTS: Accent[] = [
  { id: "indigo", name: "Indigo", hex: "#4b2fd6", glow: "rgba(75, 47, 214, 0.35)" },
  { id: "blue", name: "Cyber Blue", hex: "#2f5cd6", glow: "rgba(47, 92, 214, 0.35)" },
  { id: "emerald", name: "Mint Neon", hex: "#1f8f6b", glow: "rgba(94, 255, 168, 0.35)" },
  { id: "rose", name: "Pink Aura", hex: "#d62f8f", glow: "rgba(214, 47, 143, 0.35)" },
  { id: "violet", name: "Ultra Violet", hex: "#7a2fd6", glow: "rgba(122, 47, 214, 0.35)" },
];

type ActiveTab = "overview" | "counter" | "pricing" | "paywall" | "modal";

export const ComponentStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [accent, setAccent] = useState<Accent>(ACCENTS[0]);
  const [balance, setBalance] = useState(140);
  const [selectedModel, setSelectedModel] = useState<"openai" | "gemini" | "deepseek" | "claude">("openai");
  const [codeCopied, setCodeCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Embedded modal preview state
  const [authEmail, setAuthEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

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
    <div className="relative min-h-screen bg-[#07060d] text-[#f3f1ff] flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-10 pb-24 overflow-hidden selection:bg-white/20 font-sans">
      {/* Dynamic Background Ambient Blobs */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-radial from-[#4b2fd6]/30 to-transparent blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] rounded-full bg-radial from-[#d62f8f]/20 to-transparent blur-[120px] pointer-events-none" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white/95 text-[#07060d] text-xs font-mono font-bold px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.3)] z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1f8f6b]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Full Modal Overlay */}
      <AICreditsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialBalance={balance}
        accentColor={accent.hex}
        onCreditPurchased={(cr) => {
          setBalance((b) => b + cr);
          showToast(`+${cr} kredytów dodane!`);
        }}
      />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] backdrop-blur-xl border border-white/[0.16] shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] text-xs font-mono mb-4">
          <span className="w-2 h-2 rounded-full bg-[#5effa8] shadow-[0_0_8px_#5effa8]" />
          <span className="text-white/80">Glassmorphism UI Components</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          Wizualne Makiety Komponentów
        </h1>
        <p className="text-sm sm:text-base text-white/60 mt-3 font-normal leading-relaxed">
          Oryginalne szkło frosted glass, subtelne krawędzie 1px oraz fizyka spring transitions.
        </p>
      </div>

      {/* Floating Navigation Pill */}
      <div className="relative z-20 mb-8 p-1.5 rounded-full bg-white/[0.07] backdrop-blur-2xl border border-white/[0.16] shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center gap-1 max-w-full overflow-x-auto">
        {[
          { id: "overview", label: "Aplikacja Demo" },
          { id: "counter", label: "Licznik Kredytów" },
          { id: "pricing", label: "Karty Cennika" },
          { id: "paywall", label: "Ekran Paywalla" },
          { id: "modal", label: "Modal Doładowania" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? "bg-white/20 text-white shadow-md font-semibold border border-white/30"
                : "text-white/60 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Glass Stage Container */}
      <div className="relative z-10 w-full max-w-4xl min-h-[480px] rounded-[32px] bg-white/[0.04] backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] shadow-[0_32px_90px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] p-6 sm:p-10 flex flex-col items-center justify-center transition-all duration-300">
        
        {/* VIEW 1: FULL APP SHOWCASE */}
        {activeTab === "overview" && (
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in duration-300">
            {/* Top Bar Mock */}
            <div className="p-4 sm:p-5 rounded-[22px] bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md border border-white/20"
                  style={{ backgroundColor: accent.hex }}
                >
                  AI
                </div>
                <span className="text-xs font-semibold text-white tracking-wide">VideoSummarizer App</span>
              </div>

              {/* CreditCounter Component */}
              <CreditCounter
                balance={balance}
                onTopUpClick={() => setIsModalOpen(true)}
              />
            </div>

            {/* Paywall Protected AI Feature */}
            <div className="p-6 sm:p-8 rounded-[26px] bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] shadow-[0_16px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.16)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#5effa8]" />
                  <span className="text-xs font-semibold text-white">AI Deep Summary Generator</span>
                </div>
                <span className="text-[11px] font-mono text-white/60 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.14]">
                  15 kredytów
                </span>
              </div>

              <PaywallGuard
                requiredCredits={15}
                balance={balance}
                featureName="Deep Summary"
                onTopUpClick={() => setIsModalOpen(true)}
              >
                <div className="p-5 rounded-[20px] bg-white/[0.04] border border-white/[0.12] text-xs space-y-3.5">
                  <div className="flex items-center gap-2 text-[#5effa8] font-medium font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saldo zweryfikowane w ledgerze podwójnego zapisu.</span>
                  </div>
                  <p className="text-white/80 font-mono text-[11px] leading-relaxed">
                    &quot;Precyzyjne podsumowanie wygenerowane z routingiem GPT-4o i automatyczną marżą dewelopera.&quot;
                  </p>
                  <button
                    onClick={() => {
                      setBalance((b) => Math.max(0, b - 15));
                      showToast("Akcja wykonana (-15 kredytów)");
                    }}
                    className="px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-white transition-all active:scale-95 cursor-pointer shadow-lg border border-white/20 hover:brightness-110"
                    style={{ backgroundColor: accent.hex }}
                  >
                    Wykonaj ponownie (-15 cr)
                  </button>
                </div>
              </PaywallGuard>
            </div>
          </div>
        )}

        {/* VIEW 2: HEADER CREDIT COUNTER */}
        {activeTab === "counter" && (
          <div className="space-y-8 text-center animate-in fade-in duration-300">
            <div className="text-xs text-white/50 font-mono">
              Live &lt;CreditCounter /&gt; z efektem beam pulse:
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-[10px] text-white/40 font-mono">Theme: Glass (Domyślny)</span>
                <CreditCounter
                  balance={balance}
                  theme="glass"
                  onTopUpClick={() => setIsModalOpen(true)}
                />
              </div>
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-[10px] text-white/40 font-mono">Theme: Dark</span>
                <CreditCounter
                  balance={balance}
                  theme="dark"
                  onTopUpClick={() => setIsModalOpen(true)}
                />
              </div>
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-[10px] text-white/40 font-mono">Theme: Light</span>
                <CreditCounter
                  balance={balance}
                  theme="light"
                  onTopUpClick={() => setIsModalOpen(true)}
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
                showToast(`Wybrano ${pack.name} (+${pack.credits} kredytów)!`);
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
                showToast("Portfel doładowany do 250 kredytów!");
              }}
            >
              <div className="p-8 rounded-[24px] bg-white/[0.06] border border-white/[0.16] text-center space-y-2.5 shadow-xl">
                <CheckCircle2 className="w-9 h-9 text-[#5effa8] mx-auto animate-pulse" />
                <h4 className="text-base font-bold text-white">Dostęp Odblokowany</h4>
                <p className="text-xs text-white/60">
                  Posiadasz {balance} kredytów (wymagane: 100).
                </p>
              </div>
            </PaywallGuard>
          </div>
        )}

        {/* VIEW 5: FULL 2-COLUMN CHECKOUT MODAL WITH AUTH & PAYMENT METHODS */}
        {activeTab === "modal" && (
          <div className="w-full max-w-3xl p-6 sm:p-8 rounded-[28px] bg-white/[0.07] backdrop-blur-2xl border border-white/[0.18] shadow-[0_24px_70px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] animate-in fade-in duration-300 relative">
            {/* Top Bar Actions */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.1]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20"
                  style={{ backgroundColor: accent.hex }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Doładuj Kredyty AI</h3>
                  <p className="text-xs text-white/50">Zaloguj się i wybierz pakiet doładowania</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.14] text-xs font-mono text-white transition-all cursor-pointer"
                title="Otwórz pełnoekranowy modal"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Otwórz Overlay</span>
              </button>
            </div>

            {/* 2-Column Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Auth & Packs */}
              <div className="space-y-5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50">
                  1. Autoryzacja Konta
                </label>

                {loggedInUser ? (
                  <div className="p-3.5 rounded-2xl bg-[#5effa8]/10 border border-[#5effa8]/25 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#5effa8] uppercase">✓ Zalogowano</span>
                      <div className="text-xs font-mono font-semibold text-white mt-0.5">{loggedInUser}</div>
                    </div>
                    <button
                      onClick={() => setLoggedInUser(null)}
                      className="text-xs text-white/50 hover:text-white underline cursor-pointer"
                    >
                      Wyloguj
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Google Login Button */}
                    <button
                      onClick={() => {
                        setLoggedInUser("developer@gmail.com");
                        showToast("Zalogowano przez Google (+20 bonus)");
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white text-[#07060d] hover:bg-white/90 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Kontynuuj przez Google</span>
                    </button>

                    {/* Email Login Form */}
                    {showEmailInput ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (authEmail) {
                            setLoggedInUser(authEmail);
                            setShowEmailInput(false);
                            showToast(`Zalogowano jako ${authEmail}`);
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="email"
                          required
                          placeholder="twoj@email.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white/[0.08] border border-white/[0.2] text-xs font-mono text-white outline-none"
                        />
                        <button
                          type="submit"
                          style={{ backgroundColor: accent.hex }}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95"
                        >
                          Dalej
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowEmailInput(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.16] text-xs font-medium text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="20" height="16" x="2" y="4" rx="2"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                        <span>Kontynuuj z adresem e-mail</span>
                      </button>
                    )}

                    {/* GitHub Login */}
                    <button
                      onClick={() => {
                        setLoggedInUser("developer@github.com");
                        showToast("Zalogowano przez GitHub");
                      }}
                      className="w-full py-2 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-white/70 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="font-mono font-bold">gh</span>
                      <span>Kontynuuj przez GitHub</span>
                    </button>
                  </div>
                )}

                {/* Credit Packs */}
                <div className="pt-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-2">
                    2. Wybierz Pakiet
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { credits: 100, price: "$5" },
                      { credits: 500, price: "$20", pop: true },
                      { credits: 2000, price: "$65" },
                    ].map((pack) => (
                      <button
                        key={pack.credits}
                        onClick={() => {
                          setBalance((b) => b + pack.credits);
                          showToast(`+${pack.credits} kredytów dodane!`);
                        }}
                        className={`p-3 rounded-2xl border text-center cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                          pack.pop
                            ? "bg-white/[0.14] border-white/[0.3] shadow-md ring-1 ring-white/20"
                            : "bg-white/[0.05] border-white/[0.1] hover:border-white/[0.2]"
                        }`}
                      >
                        <div className="text-xs font-bold text-white font-mono">{pack.price}</div>
                        <div className="text-[10px] text-white/60 font-mono mt-0.5">{pack.credits} cr</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Models & Payment Brands */}
              <div className="flex flex-col justify-between space-y-5">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-2">
                    Wspierane Modele AI
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: "openai", name: "OpenAI GPT-4o", logo: <OpenAILogo size={14} />, bg: "#10a37f" },
                      { id: "gemini", name: "Google Gemini 2.0", logo: <GeminiLogo size={16} />, bg: "#18181b" },
                      { id: "deepseek", name: "DeepSeek V3/R1", logo: <DeepSeekLogo size={14} />, bg: "#0284c7" },
                      { id: "claude", name: "Anthropic Claude 3.5", logo: <ClaudeLogo size={14} />, bg: "#d97757" },
                    ].map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedModel(p.id as any)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedModel === p.id
                            ? "bg-white/[0.14] text-white border-white/[0.28] shadow-sm"
                            : "bg-white/[0.04] text-white/60 border-white/[0.08] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0" style={{ backgroundColor: p.bg }}>
                            {p.logo}
                          </div>
                          <span className="font-medium text-white">{p.name}</span>
                        </div>
                        {selectedModel === p.id && (
                          <span className="text-[10px] text-[#5effa8] font-mono font-bold">Aktywny</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official Vector Payment Badges & Legal Terms */}
                <div className="pt-4 border-t border-white/[0.1] space-y-3">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <ApplePayLogo className="hover:opacity-90 transition-opacity" />
                    <GooglePayLogo className="hover:opacity-90 transition-opacity" />
                    <VisaLogo className="hover:opacity-90 transition-opacity" />
                    <MastercardLogo className="hover:opacity-90 transition-opacity" />
                  </div>

                  <div className="text-[10px] text-white/50 text-center leading-tight">
                    Przechodząc dalej, akceptujesz <a href="#terms" className="text-white/80 underline">Regulamin</a> oraz <a href="#privacy" className="text-white/80 underline">Politykę Prywatności</a>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Toolbar (Minimalist Controls & Code) */}
      <div className="relative z-20 mt-8 w-full max-w-4xl p-4 rounded-full bg-white/[0.07] backdrop-blur-2xl border border-white/[0.16] shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.22)] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Quick Balance Controls */}
        <div className="flex items-center gap-2.5 pl-2">
          <CreditCard className="w-3.5 h-3.5 text-[#5effa8]" />
          <span className="text-xs text-white/60 font-mono">Test Salda:</span>
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
                  showToast(`Saldo: ${item.val} cr`);
                }}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer active:scale-95 ${
                  balance === item.val
                    ? "bg-white/20 text-white font-bold border border-white/30"
                    : "bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.08]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Accent Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60 font-mono">Akcent:</span>
          <div className="flex items-center gap-1.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a)}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                  accent.id === a.id ? "scale-125 ring-2 ring-white/60 shadow-lg" : "opacity-50 hover:opacity-100"
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.92] text-[#07060d] hover:bg-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer ml-auto"
        >
          {codeCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#07060d]" />
              <span>Skopiowano!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopiuj Kod</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
