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
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-mono">
        Checking credit balance...
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
    <div className="p-6 sm:p-8 rounded-2xl bg-[#090e1c]/95 border border-blue-500/25 shadow-xl shadow-blue-950/40 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>

      <h3 className="text-base font-bold text-white mb-1">
        Additional Credits Required
      </h3>
      <p className="text-xs text-zinc-400 mb-5 max-w-sm">
        You need <strong className="text-zinc-200 font-mono">{requiredCredits} credits</strong> to run {featureName}. Your current balance is <span className="font-mono text-amber-400">{currentBalance} credits</span>.
      </p>

      {onTopUpClick && (
        <button
          onClick={onTopUpClick}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-blue-500/30 cursor-pointer"
        >
          Top Up Credits
        </button>
      )}
    </div>
  );
};
