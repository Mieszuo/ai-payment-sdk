import React, { ReactNode } from "react";
import { useWallet } from "./useWallet";

export interface PaywallGuardProps {
  /**
   * Minimum credits required to access children
   */
  requiredCredits: number;
  /**
   * Children to render when user has sufficient credits
   */
  children: ReactNode;
  /**
   * Fallback UI or custom trigger when user balance is insufficient
   */
  fallback?: ReactNode;
  /**
   * Callback when user clicks top-up in the default paywall
   */
  onTopUpClick?: () => void;
  /**
   * Action name or feature label (e.g. "AI Code Review")
   */
  featureName?: string;
  /**
   * Optional manual balance override
   */
  balance?: number;
}

export const PaywallGuard: React.FC<PaywallGuardProps> = ({
  requiredCredits,
  children,
  fallback,
  onTopUpClick,
  featureName = "this AI feature",
  balance: manualBalance,
}) => {
  const { balance: contextBalance, isLoading } = useWallet();
  const currentBalance = manualBalance !== undefined ? manualBalance : (contextBalance ?? 0);

  if (isLoading && manualBalance === undefined) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        <span>Verifying credit wallet...</span>
      </div>
    );
  }

  if (currentBalance >= requiredCredits) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative p-6 sm:p-8 rounded-2xl bg-[#090e1d]/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-950/50 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
      {/* Radiant Pulse Icon Frame */}
      <div className="relative w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 shadow-inner">
        <span className="absolute -inset-1 rounded-2xl bg-blue-500/20 blur-sm animate-pulse-ring pointer-events-none" />
        <svg className="w-6 h-6 fill-current relative z-10 animate-pulse-dot" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 tracking-tight">
        Additional Credits Required
      </h3>
      <p className="text-xs sm:text-sm text-zinc-400 mb-6 max-w-sm leading-relaxed">
        You need <strong className="text-zinc-100 font-mono font-semibold">{requiredCredits} credits</strong> to run {featureName}. Your current balance is <span className="font-mono font-bold text-amber-400">{currentBalance} credits</span>.
      </p>

      {onTopUpClick && (
        <button
          onClick={onTopUpClick}
          className="relative px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-xs font-semibold text-white transition-all duration-200 shadow-lg shadow-blue-500/30 cursor-pointer overflow-hidden group"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            <span>Top Up Credits</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
          </span>
        </button>
      )}
    </div>
  );
};
