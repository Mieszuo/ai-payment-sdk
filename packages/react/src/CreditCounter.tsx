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
        return "bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm";
      case "dark":
        return "bg-zinc-900 text-zinc-100 border-zinc-800 shadow-md";
      case "glass":
      default:
        return "bg-[#0b1329]/80 backdrop-blur-md text-zinc-100 border-blue-500/20 shadow-lg shadow-blue-950/40";
    }
  };

  return (
    <div
      onClick={onTopUpClick}
      role={onTopUpClick ? "button" : undefined}
      tabIndex={onTopUpClick ? 0 : undefined}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium transition-all ${
        onTopUpClick ? "cursor-pointer hover:border-blue-400/60 hover:shadow-blue-500/20" : ""
      } ${getThemeStyles()} ${className}`}
      title="Current AI Credit Balance"
    >
      {/* Lightning Icon */}
      <svg
        className="w-3.5 h-3.5 text-blue-400 fill-current animate-pulse"
        viewBox="0 0 24 24"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>

      {/* Balance Text */}
      <span className="font-semibold text-zinc-100">
        {isLoading && manualBalance === undefined ? "..." : currentBalance.toLocaleString()}
      </span>
      <span className="text-[10px] text-zinc-400 font-sans uppercase tracking-wider">
        credits
      </span>

      {/* Top-Up Plus Button */}
      {showTopUpButton && onTopUpClick && (
        <span
          className="ml-1 w-4 h-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110"
          title="Buy more credits"
        >
          +
        </span>
      )}
    </div>
  );
};
