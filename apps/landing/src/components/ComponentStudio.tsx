import React, { useState } from "react";
import {
  CreditCounter,
  CreditPacksGrid,
  PaywallGuard,
  AICreditsModal,
} from "@ai-credits/react";
import {
  Copy,
  Check,
  CheckCircle2,
  CreditCard,
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
  const [codeCopied, setCodeCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className={`relative z-10 w-full max-w-4xl flex flex-col items-center justify-center transition-all duration-300 ${
        activeTab === "modal"
          ? "p-0 bg-transparent border-none shadow-none"
          : "min-h-[480px] rounded-[32px] bg-white/[0.04] backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] shadow-[0_32px_90px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] p-6 sm:p-10"
      }`}>
        
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
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">AI Content Studio</h3>
                  <p className="text-[11px] text-white/50">NextGen Text & Image Generator</p>
                </div>
              </div>

              {/* Header Balance Widget */}
              <CreditCounter
                balance={balance}
                onTopUpClick={() => setIsModalOpen(true)}
              />
            </div>

            {/* Main Interactive Action Box */}
            <div className="p-6 rounded-[24px] bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/60">Operacja: Generowanie Wideo HD</span>
                <span className="text-xs font-mono text-indigo-400 font-semibold">Koszt: 15 kredytów</span>
              </div>

              <PaywallGuard
                requiredCredits={15}
                balance={balance}
                featureName="Generowanie Wideo HD"
                onTopUpClick={() => setIsModalOpen(true)}
              >
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                  <p className="text-xs text-white/80">
                    Silnik AI gotowy do wykonania kolejnego zadania.
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

        {/* VIEW 3: PRICING PACKS GRID */}
        {activeTab === "pricing" && (
          <div className="w-full max-w-3xl space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">Doładuj Saldo Kredytów</h3>
              <p className="text-xs text-white/50">Wybierz pakiet kredytów dopasowany do Twoich potrzeb</p>
            </div>

            <CreditPacksGrid
              onSelectPack={(pack) => {
                setBalance((b) => b + pack.credits);
                showToast(`Dodano ${pack.credits} kredytów do portfela!`);
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
          <div className="w-full flex justify-center animate-in fade-in duration-300">
            <AICreditsModal
              isOpen={true}
              isInline={true}
              initialBalance={balance}
              onClose={() => showToast("Zamknij")}
              onCreditPurchased={(credits) => {
                setBalance((b) => b + credits);
                showToast(`+${credits} kredytów dodane!`);
              }}
              onAuthRequested={(prov, em) => {
                const user = em || (prov === "google" ? "user@gmail.com" : "user@github.com");
                showToast(`Zalogowano jako ${user}`);
              }}
            />
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
                className={`w-6 h-6 rounded-full transition-transform active:scale-90 cursor-pointer ${
                  accent.id === a.id ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-black" : "hover:scale-110 opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: a.hex }}
                title={a.name}
              />
            ))}
          </div>
        </div>

        {/* Right: Copy Code Button */}
        <button
          onClick={copyCode}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-white/90 text-black text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-lg"
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

      {/* Full-screen Overlay Modal */}
      <AICreditsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialBalance={balance}
        onCreditPurchased={(credits) => {
          setBalance((b) => b + credits);
          showToast(`+${credits} kredytów dodane!`);
        }}
        onAuthRequested={(prov, em) => {
          const user = em || (prov === "google" ? "user@gmail.com" : "user@github.com");
          showToast(`Zalogowano jako ${user}`);
        }}
      />
    </div>
  );
};
