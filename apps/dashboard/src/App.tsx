import React from "react";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";
import { AppHeader } from "./components/layout/AppHeader";
import { OverviewView } from "./components/views/OverviewView";
import { ActionsView } from "./components/views/ActionsView";
import { PlaygroundView } from "./components/views/PlaygroundView";
import { AuditLogsView } from "./components/views/AuditLogsView";
import { SettingsView } from "./components/views/SettingsView";
import { AlertCircle, RefreshCw, SlidersHorizontal } from "lucide-react";

const DashboardContent: React.FC = () => {
  const { activeTab, mode, setMode, gatewayStatus, refreshData, isLoading } = useDashboard();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navbar */}
      <AppHeader />

      {/* Production Mode Error Banner (Explicit - No Silent Fallback) */}
      {mode === "PRODUCTION_MODE" && gatewayStatus === "unavailable" && (
        <div className="bg-rose-950/40 border-b border-rose-900/50 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                <strong>Production Mode Active:</strong> Unable to connect to Gateway API at{" "}
                <code className="font-mono text-rose-200 bg-rose-900/40 px-1 py-0.5 rounded">http://localhost:3000</code>.
                Make sure the server is running (`bun run server`).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => refreshData()}
                disabled={isLoading}
                className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 border border-rose-700/50 text-rose-200 font-medium flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                <span>Retry</span>
              </button>
              <button
                onClick={() => setMode("DEMO_MODE")}
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium flex items-center gap-1 transition-colors"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Switch to Demo Mode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && <OverviewView />}
        {activeTab === "actions" && <ActionsView />}
        {activeTab === "playground" && <PlaygroundView />}
        {activeTab === "logs" && <AuditLogsView />}
        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Payment Platform • Developer Console v1.0</span>
          <span className="font-mono text-[11px] text-zinc-600">Built with Bun, React 19 & Tailwind v4</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};
