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
      <div className="p-8 rounded-[24px] bg-white/[0.05] backdrop-blur-2xl border border-white/[0.12] flex items-center justify-center gap-2 text-xs font-mono text-white/60 shadow-[0_16px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]">
        <span className="w-2 h-2 rounded-full bg-[#5effa8] animate-ping" />
        <span>Verifying credits...</span>
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
    <div className="relative p-8 sm:p-10 rounded-[28px] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.16] shadow-[0_24px_70px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] text-center flex flex-col items-center justify-center max-w-lg mx-auto my-4 transition-all duration-300">
      {/* Radiant Glowing Icon Frame */}
      <div className="relative w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/[0.18] flex items-center justify-center text-white mb-5 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
        <span className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-[#4b2fd6]/40 to-[#d62f8f]/40 blur-md animate-pulse pointer-events-none" />
        <svg className="w-6 h-6 fill-current relative z-10 text-white" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-[#f3f1ff] mb-2 tracking-tight">
        Kredyty Wymagane
      </h3>
      <p className="text-xs sm:text-sm text-white/70 mb-6 max-w-sm leading-relaxed font-sans">
        Potrzebujesz <strong className="text-white font-mono font-semibold">{requiredCredits} kredytów</strong>, aby uruchomić {featureName}. Twoje obecne saldo: <span className="font-mono font-bold text-[#5effa8]">{currentBalance} kredytów</span>.
      </p>

      {onTopUpClick && (
        <button
          onClick={onTopUpClick}
          className="px-6 py-3 rounded-full bg-white/[0.92] text-[#12101c] hover:bg-white active:scale-95 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_14px_40px_rgba(255,255,255,0.25)] cursor-pointer"
        >
          Doładuj kredyty →
        </button>
      )}
    </div>
  );
};
