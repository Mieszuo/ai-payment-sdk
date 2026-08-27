import React from "react";
import { useDashboard, DashboardTab } from "../../context/DashboardContext";
import { getEcosystemUrls } from "@ai-credits/shared";
import {
  Layers,
  Activity,
  Cpu,
  Terminal,
  Settings,
  Zap,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  BookOpen,
  ExternalLink
} from "lucide-react";

export const AppHeader: React.FC = () => {
  const urls = getEcosystemUrls();
  const {
    activeTab,
    setActiveTab,
    gatewayStatus,
    mode,
    setMode,
    activeProject,
    refreshData,
    isLoading
  } = useDashboard();

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Layers className="w-4 h-4" /> },
    { id: "actions", label: "Actions", icon: <Cpu className="w-4 h-4" /> },
    { id: "playground", label: "Playground", icon: <Terminal className="w-4 h-4" /> },
    { id: "logs", label: "Audit Logs", icon: <Activity className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <header className="border-b border-white/[0.08] bg-black/60 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                  AI Payment Platform
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Console
                  </span>
                </span>
              </div>
            </div>

            {/* Project Selector */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200">
              <span className="text-zinc-500 font-normal">Project:</span>
              <span className="font-semibold text-zinc-100">{activeProject.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            </div>
          </div>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Gateway Status Indicator */}
            {gatewayStatus === "connected" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gateway Connected</span>
              </div>
            )}

            {gatewayStatus === "demo" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Demo Mode</span>
              </div>
            )}

            {gatewayStatus === "unavailable" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Gateway Offline</span>
              </div>
            )}

            {/* Mode Switcher Toggle */}
            <button
              onClick={() => setMode(mode === "DEMO_MODE" ? "PRODUCTION_MODE" : "DEMO_MODE")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium transition-colors"
              title="Toggle between Live Production Gateway and Offline Demo Store"
            >
              <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
              <span>{mode === "DEMO_MODE" ? "Demo" : "Prod"}</span>
            </button>

            {/* Documentation Portal Link */}
            <a
              href={urls.docs}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium transition-colors"
              title="Documentation (http://localhost:5175)"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Documentation</span>
              <ExternalLink className="w-3 h-3 text-zinc-500 ml-0.5" />
            </a>

            {/* Landing Page Link */}
            <a
              href={urls.landing}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-medium transition-colors"
              title="Open Landing Page"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Landing</span>
              <ExternalLink className="w-3 h-3 text-zinc-500 ml-0.5" />
            </a>

            {/* Refresh Button */}
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 -mb-px overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-blue-500 text-white font-semibold"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
