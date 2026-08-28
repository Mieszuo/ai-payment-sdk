import React from "react";
import { useWallet } from "./useWallet";

export interface CreditCounterProps {
  /**
   * Optional manual balance override (if not using AIContext)
   */
  balance?: number;
  /**
   * Callback when user clicks the counter / plus button
   */
  onTopUpClick?: () => void;
  /**
   * Visual theme: "dark" | "light" | "glass"
   */
  theme?: "dark" | "light" | "glass";
  /**
   * Show "+" top-up button
   */
  showTopUpButton?: boolean;
  /**
   * Custom CSS class name
   */
  className?: string;
}

export const CreditCounter: React.FC<CreditCounterProps> = ({
  balance: manualBalance,
  onTopUpClick,
  theme = "glass",
  showTopUpButton = true,
  className = "",
}) => {
  const { balance: contextBalance, isLoading } = useWallet();
  const currentBalance = manualBalance !== undefined ? manualBalance : (contextBalance ?? 0);

  const getThemeStyles = () => {
    switch (theme) {
      case "light":
        return "bg-white/95 text-zinc-900 border-zinc-200/90 shadow-sm hover:border-blue-400";
      case "dark":
        return "bg-zinc-950 text-zinc-100 border-zinc-800 shadow-md hover:border-zinc-700";
      case "glass":
      default:
        return "bg-[#0a1022]/85 backdrop-blur-xl text-zinc-100 border-blue-500/25 shadow-lg shadow-blue-950/40 hover:border-blue-400/60";
    }
  };

  return (
    <div
      onClick={onTopUpClick}
      role={onTopUpClick ? "button" : undefined}
      tabIndex={onTopUpClick ? 0 : undefined}
      className={`group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:scale-95 select-none ${
        onTopUpClick ? "cursor-pointer" : ""
      } ${getThemeStyles()} ${className}`}
      title="Current AI Credit Balance"
    >
      {/* Beam Pulse Beacon Indicator */}
      <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-sm shadow-blue-400" />
      </div>

      {/* Balance Text */}
      <div className="flex items-baseline gap-1">
        <span className="font-bold text-zinc-100 tracking-tight text-[13px] group-hover:text-blue-300 transition-colors">
          {isLoading && manualBalance === undefined ? "..." : currentBalance.toLocaleString()}
        </span>
        <span className="text-[10px] text-zinc-400 font-sans uppercase tracking-wider font-semibold">
          credits
        </span>
      </div>

      {/* Top-Up Plus Button with Micro-Interaction */}
      {showTopUpButton && onTopUpClick && (
        <span
          className="ml-1 w-4 h-4 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm transition-transform duration-200 group-hover:scale-110 group-active:scale-90"
          title="Buy more credits"
        >
          +
        </span>
      )}
    </div>
  );
};
