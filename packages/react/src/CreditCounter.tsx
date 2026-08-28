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
   * Visual theme: "glass" | "dark" | "light"
   */
  theme?: "glass" | "dark" | "light";
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
        return "bg-white/80 text-zinc-900 border-zinc-200/80 shadow-md backdrop-blur-xl";
      case "dark":
        return "bg-[#090b10] text-zinc-100 border-white/10 shadow-xl backdrop-blur-xl";
      case "glass":
      default:
        return "bg-white/[0.07] text-[#f3f1ff] border-white/[0.16] shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl backdrop-saturate-150";
    }
  };

  return (
    <div
      onClick={onTopUpClick}
      role={onTopUpClick ? "button" : undefined}
      tabIndex={onTopUpClick ? 0 : undefined}
      className={`group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-mono font-medium transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] hover:-translate-y-0.5 active:scale-95 select-none ${
        onTopUpClick ? "cursor-pointer hover:border-white/30 hover:bg-white/[0.12]" : ""
      } ${getThemeStyles()} ${className}`}
      title="Current AI Credit Balance"
    >
      {/* Beam Pulsing Status Beacon */}
      <div className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#5effa8] opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5effa8] shadow-[0_0_10px_#5effa8]" />
      </div>

      {/* Balance Text */}
      <div className="flex items-baseline gap-1.5 font-mono">
        <span className="font-bold text-[#f3f1ff] text-[13px] tracking-tight group-hover:text-white transition-colors">
          {isLoading && manualBalance === undefined ? "..." : currentBalance.toLocaleString()}
        </span>
        <span className="text-[10px] text-white/50 uppercase tracking-widest font-sans font-medium">
          credits
        </span>
      </div>

      {/* Top-Up Plus Pill Button */}
      {showTopUpButton && onTopUpClick && (
        <span
          className="ml-1 w-4 h-4 rounded-full bg-white/20 group-hover:bg-white/30 text-white flex items-center justify-center text-[10px] font-bold shadow-sm transition-transform duration-200 group-hover:scale-110 group-active:scale-90"
          title="Buy more credits"
        >
          +
        </span>
      )}
    </div>
  );
};
