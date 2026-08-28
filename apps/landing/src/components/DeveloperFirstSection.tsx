import React from "react";
import { CreditCard, Cpu, Globe, ShieldCheck, TrendingUp, ChevronDown, CheckCircle2 } from "lucide-react";

export const DeveloperFirstSection: React.FC = () => {
  const features = [
    {
      icon: CreditCard,
      title: "Credits System",
      description: "Flexible credit packages and usage tracking.",
    },
    {
      icon: Cpu,
      title: "AI Cost Management",
      description: "Automatic AI model cost calculation.",
    },
    {
      icon: Globe,
      title: "Global Payments",
      description: "Stripe-powered payments worldwide.",
    },
    {
      icon: ShieldCheck,
      title: "Production Ready",
      description: "Secure, scalable, and battle-tested.",
    },
  ];

  const transactions = [
    { user: "user_1234", credits: "500 credits", amount: "$2.00" },
    { user: "user_5678", credits: "500 credits", amount: "$9.99" },
    { user: "user_9012", credits: "200 credits", amount: "$4.00" },
    { user: "user_3456", credits: "1000 credits", amount: "$19.99" },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Copy & Feature List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Developer First
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Everything you need.
            <br />
            <span className="text-blue-500">Nothing</span> you don&apos;t.
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Ship faster with a complete payment &amp; AI monetization infrastructure.
          </p>

          <div className="space-y-4 pt-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-4 p-3.5 rounded-xl card-dark-glass hover:border-blue-500/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-950/70 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
                  <f.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-200 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: High Fidelity Dashboard Mockup */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl card-dark-glass p-5 sm:p-6 border border-blue-500/30 shadow-2xl shadow-blue-950/50">
            
            {/* Dashboard Header Bar */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-blue-500/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500/80" />
                <span className="text-xs font-semibold text-zinc-200 font-mono tracking-wide">
                  Dashboard Overview
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Gateway</span>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[#080e1e]/90 border border-blue-500/15">
                <p className="text-[10px] uppercase font-mono text-zinc-400">Total Users</p>
                <p className="text-base sm:text-lg font-bold text-white mt-1">12,543</p>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium mt-1">
                  <TrendingUp className="w-2.5 h-2.5" /> +12.5%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#080e1e]/90 border border-blue-500/15">
                <p className="text-[10px] uppercase font-mono text-zinc-400">Revenue</p>
                <p className="text-base sm:text-lg font-bold text-white mt-1">$45,231</p>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium mt-1">
                  <TrendingUp className="w-2.5 h-2.5" /> +18.3%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#080e1e]/90 border border-blue-500/15">
                <p className="text-[10px] uppercase font-mono text-zinc-400">Credits Used</p>
                <p className="text-base sm:text-lg font-bold text-white mt-1">1.2M</p>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium mt-1">
                  <TrendingUp className="w-2.5 h-2.5" /> +9.1%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#080e1e]/90 border border-blue-500/15">
                <p className="text-[10px] uppercase font-mono text-zinc-400">Success Rate</p>
                <p className="text-base sm:text-lg font-bold text-white mt-1">99.9%</p>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium mt-1">
                  <TrendingUp className="w-2.5 h-2.5" /> +0.1%
                </span>
              </div>
            </div>

            {/* Split: Chart + Transactions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left Side: Revenue Chart Area */}
              <div className="md:col-span-7 p-4 rounded-xl bg-[#060a15]/90 border border-blue-500/15 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-200">Revenue Overview</span>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-900/90 px-2 py-1 rounded-md border border-zinc-800">
                    <span>This Month</span>
                    <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </div>

                {/* SVG Area Line Chart with Tooltip */}
                <div className="relative w-full h-36 mt-2">
                  {/* Floating Tooltip Pill */}
                  <div className="absolute top-1 right-8 z-10 px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono font-bold shadow-md shadow-blue-500/50">
                    $45,231
                  </div>

                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="chartStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="50%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                    {/* Area under curve */}
                    <path
                      d="M 0 100 Q 40 85, 70 70 T 140 75 T 210 40 T 265 25 L 265 115 L 0 115 Z"
                      fill="url(#chartFill)"
                    />

                    {/* Glowing Stroke line */}
                    <path
                      d="M 0 100 Q 40 85, 70 70 T 140 75 T 210 40 T 265 25"
                      fill="none"
                      stroke="url(#chartStroke)"
                      strokeWidth="2.5"
                    />

                    {/* Endpoint dot */}
                    <circle cx="265" cy="25" r="4" fill="#60a5fa" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* X Axis Labels */}
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/60 mt-2">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20</span>
                  <span>25</span>
                  <span>30</span>
                </div>
              </div>

              {/* Right Side: Recent Transactions */}
              <div className="md:col-span-5 p-4 rounded-xl bg-[#060a15]/90 border border-blue-500/15 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block mb-3">
                    Recent Transactions
                  </span>

                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.user}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-zinc-900/50 border border-zinc-800/40 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-blue-950 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-mono text-zinc-200">{tx.user}</p>
                            <p className="text-[9px] text-zinc-500">{tx.credits}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-emerald-400 font-mono">{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full mt-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  View all transactions
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
