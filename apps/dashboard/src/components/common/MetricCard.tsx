import React, { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "highlight";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  icon,
  variant = "default"
}) => {
  return (
    <div className="glass-panel p-5 relative overflow-hidden group hover:border-white/[0.16] transition-all duration-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        {icon && <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-semibold tracking-tight text-white mono-code">{value}</span>
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-zinc-500 font-normal">{subtitle}</p>}
    </div>
  );
};
