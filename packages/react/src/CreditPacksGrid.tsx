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
   * List of credit packs to display (defaults to standard tiers: 100, 500, 2000)
   */
  packs?: CreditPack[];
  /**
   * Callback when a user selects and initiates checkout for a pack
   */
  onSelectPack?: (pack: CreditPack) => void;
  /**
   * Accent color (default: #3b82f6)
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
    description: "Perfect for testing and light generation tasks.",
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 500,
    priceUsd: 20,
    popular: true,
    description: "Most popular for active daily workflows and coding.",
  },
  {
    id: "power",
    name: "Power User",
    credits: 2000,
    priceUsd: 65,
    description: "High-volume batch generation and advanced model queries.",
  },
];

export const CreditPacksGrid: React.FC<CreditPacksGridProps> = ({
  packs = defaultPacks,
  onSelectPack,
  accentColor = "#3b82f6",
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {packs.map((pack) => (
        <div
          key={pack.id}
          className={`group relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 bg-[#090e1d]/90 backdrop-blur-xl border ${
            pack.popular
              ? "border-blue-500/60 shadow-xl shadow-blue-950/50 ring-1 ring-blue-500/30 beam-border-active"
              : "border-zinc-800/80 hover:border-zinc-700 shadow-md"
          }`}
        >
          {pack.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
              <span>Most Popular</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-zinc-100 group-hover:text-blue-300 transition-colors">
                {pack.name}
              </h4>
              <span className="text-[11px] font-mono text-zinc-400 font-medium">
                ${(pack.priceUsd / pack.credits).toFixed(3)}/cr
              </span>
            </div>

            <div className="my-4 flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                {pack.credits.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                credits
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              {pack.description}
            </p>
          </div>

          <div>
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-400 font-medium">One-time price</span>
              <span className="text-lg font-bold text-white font-mono">
                ${pack.priceUsd} <span className="text-xs text-zinc-500 font-sans">USD</span>
              </span>
            </div>

            <button
              onClick={() => onSelectPack?.(pack)}
              style={{
                backgroundColor: pack.popular ? accentColor : undefined,
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] hover:brightness-110 cursor-pointer shadow-md ${
                pack.popular
                  ? "text-white shadow-blue-500/25"
                  : "bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200"
              }`}
            >
              <StripeLogo size={14} className="opacity-90" />
              <span>Purchase via Stripe</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
