import React from "react";
import { StripeLogo } from "./ProviderLogos";

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  popular?: boolean;
  description?: string;
}

export interface CreditPacksGridProps {
  /**
   * List of credit packs to display
   */
  packs?: CreditPack[];
  /**
   * Callback when a user selects and initiates checkout for a pack
   */
  onSelectPack?: (pack: CreditPack) => void;
  /**
   * Accent color (default: #4b2fd6)
   */
  accentColor?: string;
  /**
   * Custom CSS class name
   */
  className?: string;
}

const defaultPacks: CreditPack[] = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 100,
    priceUsd: 5,
    description: "Idealny na start, do testowania i szybkich promptów.",
  },
  {
    id: "pro",
    name: "Pro Tier",
    credits: 500,
    priceUsd: 20,
    popular: true,
    description: "Najpopularniejszy pakiet do codziennej pracy z modelami AI.",
  },
  {
    id: "power",
    name: "Power User",
    credits: 2000,
    priceUsd: 65,
    description: "Dla wymagających projektów, modeli o1/Claude i multimodalnych.",
  },
];

export const CreditPacksGrid: React.FC<CreditPacksGridProps> = ({
  packs = defaultPacks,
  onSelectPack,
  accentColor = "#4b2fd6",
  className = "",
}) => {
  return (
    <div className={`space-y-5 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className={`group relative rounded-[26px] p-7 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] hover:-translate-y-1.5 backdrop-blur-2xl backdrop-saturate-150 border ${
              pack.popular
                ? "bg-white/[0.09] border-white/[0.3] shadow-[0_24px_70px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20"
                : "bg-white/[0.05] border-white/[0.12] hover:border-white/[0.22] hover:bg-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]"
            }`}
          >
            {/* Clean top badge with zero text collision */}
            {pack.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white text-[#07060d] shadow-[0_8px_24px_rgba(255,255,255,0.35)] flex items-center gap-1.5 z-20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4b2fd6] animate-pulse" />
                <span>Polecany Wybór</span>
              </div>
            )}

            <div>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                <h4 className="text-sm font-bold tracking-wide text-white">
                  {pack.name}
                </h4>
                <span className="text-[11px] font-mono text-white/50 font-medium shrink-0">
                  ${(pack.priceUsd / pack.credits).toFixed(3)}/cr
                </span>
              </div>

              {/* Credits big number & label */}
              <div className="my-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                  {pack.credits.toLocaleString()}
                </span>
                <span className="text-[11px] text-white/50 font-semibold uppercase tracking-widest font-mono">
                  kredytów
                </span>
              </div>

              <p className="text-xs text-white/70 leading-relaxed mb-6 font-sans">
                {pack.description}
              </p>
            </div>

            <div>
              {/* Price row */}
              <div className="pt-4 border-t border-white/[0.1] flex items-center justify-between mb-4">
                <span className="text-xs text-white/60 font-medium font-sans">Jednorazowa opłata</span>
                <span className="text-xl font-bold text-white font-mono">
                  ${pack.priceUsd} <span className="text-xs text-white/40 font-normal">USD</span>
                </span>
              </div>

              {/* Action button */}
              <button
                onClick={() => onSelectPack?.(pack)}
                style={{
                  backgroundColor: pack.popular ? accentColor : "rgba(255, 255, 255, 0.1)",
                }}
                className="w-full py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all duration-200 ease-[cubic-bezier(0.2,1,0.3,1)] active:scale-95 hover:brightness-110 cursor-pointer shadow-lg border border-white/10 hover:border-white/20"
              >
                <StripeLogo size={14} className="opacity-90" />
                <span>Kup przez Stripe</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Legal & Terms disclaimer */}
      <div className="pt-2 text-center text-[11px] text-white/50 font-sans flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
        <span>Przechodząc dalej, akceptujesz</span>
        <div className="flex items-center gap-1.5">
          <a href="#terms" className="text-white/80 hover:text-white underline underline-offset-2 transition-colors">
            Regulamin
          </a>
          <span>oraz</span>
          <a href="#privacy" className="text-white/80 hover:text-white underline underline-offset-2 transition-colors">
            Politykę Prywatności
          </a>
        </div>
      </div>
    </div>
  );
};
