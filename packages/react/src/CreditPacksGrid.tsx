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
   * Accent color (default: #6366f1)
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
    description: "Ideal for testing workflows and fast prototypes.",
  },
  {
    id: "pro",
    name: "Pro Tier",
    credits: 500,
    priceUsd: 20,
    popular: true,
    description: "Most popular for active daily AI coding and generation.",
  },
  {
    id: "power",
    name: "Power User",
    credits: 2000,
    priceUsd: 65,
    description: "High-volume batch prompts and multimodal runs.",
  },
];

export const CreditPacksGrid: React.FC<CreditPacksGridProps> = ({
  packs = defaultPacks,
  onSelectPack,
  accentColor = "#6366f1",
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {packs.map((pack) => (
        <div
          key={pack.id}
          className={`group relative rounded-[24px] p-7 flex flex-col justify-between transition-all duration-400 ease-[cubic-bezier(0.2,1,0.3,1)] hover:-translate-y-1.5 backdrop-blur-2xl backdrop-saturate-150 border ${
            pack.popular
              ? "bg-white/[0.09] border-white/[0.24] shadow-[0_24px_70px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35)]"
              : "bg-white/[0.05] border-white/[0.12] hover:border-white/[0.22] hover:bg-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]"
          }`}
        >
          {pack.popular && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 text-[#07060d] shadow-[0_8px_24px_rgba(255,255,255,0.3)] flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4b2fd6] animate-pulse" />
              <span>Popular Choice</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold tracking-wide text-[#f3f1ff]">
                {pack.name}
              </h4>
              <span className="text-[11px] font-mono text-white/50">
                ${(pack.priceUsd / pack.credits).toFixed(3)}/cr
              </span>
            </div>

            <div className="my-5 flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                {pack.credits.toLocaleString()}
              </span>
              <span className="text-[11px] text-white/50 font-medium uppercase tracking-widest font-mono">
                credits
              </span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-6">
              {pack.description}
            </p>
          </div>

          <div>
            <div className="pt-4 border-t border-white/[0.1] flex items-center justify-between mb-4">
              <span className="text-xs text-white/60 font-medium font-mono">One-time price</span>
              <span className="text-xl font-bold text-white font-mono">
                ${pack.priceUsd} <span className="text-xs text-white/40 font-normal">USD</span>
              </span>
            </div>

            <button
              onClick={() => onSelectPack?.(pack)}
              style={{
                backgroundColor: pack.popular ? accentColor : "rgba(255, 255, 255, 0.1)",
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all duration-200 ease-[cubic-bezier(0.2,1,0.3,1)] active:scale-95 hover:brightness-110 cursor-pointer shadow-lg border border-white/10 hover:border-white/20"
            >
              <StripeLogo size={14} className="opacity-90" />
              <span>Checkout</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
