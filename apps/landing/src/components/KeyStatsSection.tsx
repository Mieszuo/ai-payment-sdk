import React from "react";
import { Activity, Gauge, Database, ShieldCheck } from "lucide-react";

export const KeyStatsSection: React.FC = () => {
  const stats = [
    {
      icon: Activity,
      value: "99.9%",
      label: "Uptime",
    },
    {
      icon: Gauge,
      value: "< 200ms",
      label: "API Response",
    },
    {
      icon: Database,
      value: "10M+",
      label: "Transactions",
    },
    {
      icon: ShieldCheck,
      value: "256-bit",
      label: "Bank Level Security",
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl card-dark-glass p-5 sm:p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 group-hover:border-blue-400/50 transition-colors">
              <s.icon className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {s.value}
              </p>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
