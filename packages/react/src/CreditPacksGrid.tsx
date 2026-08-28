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
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {packs.map((pack) => (
        <div
          key={pack.id}
          className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all bg-[#0a0f1d]/90 border ${
            pack.popular
              ? "border-blue-500/50 shadow-xl shadow-blue-950/40 ring-1 ring-blue-500/30"
              : "border-zinc-800/80 hover:border-zinc-700 shadow-md"
          }`}
        >
          {pack.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
              Most Popular
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-zinc-100">{pack.name}</h4>
              <span className="text-xs font-mono text-zinc-400">
                ${(pack.priceUsd / pack.credits).toFixed(3)} / credit
              </span>
            </div>

            <div className="my-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-white">
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
                ${pack.priceUsd} <span className="text-xs text-zinc-500">USD</span>
              </span>
            </div>

            <button
              onClick={() => onSelectPack?.(pack)}
              style={{
                backgroundColor: pack.popular ? accentColor : undefined,
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                pack.popular
                  ? "text-white shadow-lg shadow-blue-500/20 hover:brightness-110"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              }`}
            >
              <StripeLogo size={14} className="opacity-80" />
              <span>Purchase via Stripe</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
