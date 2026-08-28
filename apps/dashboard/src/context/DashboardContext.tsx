import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  ProjectConfig,
  ActionItem,
  AuditLogEvent,
  FinancialTelemetry,
  RuntimeMode,
  GatewayStatus
} from "../types";
import { createDashboardApiClient, DashboardApiClient } from "../lib/api";

export type DashboardTab = "overview" | "actions" | "playground" | "logs" | "settings";

interface DashboardContextValue {
  api: DashboardApiClient;
  mode: RuntimeMode;
  setMode: (mode: RuntimeMode) => void;
  gatewayStatus: GatewayStatus;
  projects: ProjectConfig[];
  activeProject: ProjectConfig;
  setActiveProjectId: (id: string) => void;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  selectedActionName: string | null;
  setSelectedActionName: (name: string | null) => void;
  openInPlayground: (actionName: string) => void;
  actions: ActionItem[];
  logs: AuditLogEvent[];
  telemetry: FinancialTelemetry;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  publishAction: (payload: Partial<ActionItem>) => Promise<ActionItem>;
  rotateSecretKey: () => Promise<{ newSecretKey: string }>;
  addAllowedDomain: (domain: string) => void;
  removeAllowedDomain: (domain: string) => void;
  updateWalletMode: (mode: "universal" | "isolated") => void;
}

const defaultTelemetry: FinancialTelemetry = {
  totalRuns: 1420,
  creditsConsumed: 18900,
  providerSpendCents: 1243,
  grossMarginPercent: 71,
  medianLatencyMs: 640,
  rateLimitedCount: 14
};

const defaultProject: ProjectConfig = {
  projectId: "proj_demo",
  name: "Searchlize AI Engine",
  publicKey: "pk_live_demo123",
  secretKeyMasked: "sk_live_••••••••••••••••••••",
  allowedDomains: ["http://localhost:5173", "https://searchlize.com"],
  environment: "production",
  walletMode: "universal"
};

const defaultActions: ActionItem[] = [
  {
    actionName: "optimize-resume",
    version: 3,
    projectId: "proj_demo",
    model: "gpt-4o-mini",
    priceCredits: 15,
    maxProviderCostCents: 5,
    maxOutputTokens: 800,
    outputFormat: "json",
    systemPrompt: "You are an elite executive recruiter. Evaluate CV and return JSON.",
    userPromptTemplate: "Candidate CV:\n{{cvText}}\nTarget Role:\n{{targetRole}}",
    rateLimit: { maxRequests: 10, windowSeconds: 60 },
    status: "Active",
    createdAt: new Date().toISOString()
  }
];

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<RuntimeMode>("PRODUCTION_MODE");
  const [api] = useState<DashboardApiClient>(() => createDashboardApiClient({ mode: "PRODUCTION_MODE" }));
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>("connected");
  const [projects, setProjects] = useState<ProjectConfig[]>([defaultProject]);
  const [activeProjectId, setActiveProjectId] = useState<string>("proj_demo");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selectedActionName, setSelectedActionName] = useState<string | null>("optimize-resume");
  const [actions, setActions] = useState<ActionItem[]>(defaultActions);
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [telemetry, setTelemetry] = useState<FinancialTelemetry>(defaultTelemetry);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.projectId === activeProjectId) || defaultProject;

  const setMode = (newMode: RuntimeMode) => {
    setModeState(newMode);
    api.setMode(newMode);
    refreshData();
  };

  const openInPlayground = (actionName: string) => {
    setSelectedActionName(actionName);
    setActiveTab("playground");
  };

  const addAllowedDomain = (domain: string) => {
    const trimmed = domain.trim();
    if (!trimmed || activeProject.allowedDomains.includes(trimmed)) return;
    activeProject.allowedDomains.push(trimmed);
    refreshData();
  };

  const removeAllowedDomain = (domain: string) => {
    activeProject.allowedDomains = activeProject.allowedDomains.filter((d) => d !== domain);
    refreshData();
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await api.checkGatewayHealth();
      setGatewayStatus(status);

      const [loadedActions, loadedLogs, loadedTelemetry] = await Promise.all([
        api.getActions(activeProject.projectId),
        api.getLogs(activeProject.projectId),
        api.getTelemetry(activeProject.projectId)
      ]);

      setActions(loadedActions);
      setLogs(loadedLogs);
      setTelemetry(loadedTelemetry);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
      setGatewayStatus("unavailable");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeProjectId, mode]);

  const publishAction = async (payload: Partial<ActionItem>): Promise<ActionItem> => {
    const published = await api.publishAction(activeProject.projectId, payload);
    await refreshData();
    return published;
  };

  const updateWalletMode = (newWalletMode: "universal" | "isolated") => {
    setProjects((prev) =>
      prev.map((p) =>
        p.projectId === activeProjectId
          ? { ...p, walletMode: newWalletMode }
          : p
      )
    );
  };

  const rotateSecretKey = async (): Promise<{ newSecretKey: string }> => {
    const result = await api.rotateSecretKey(activeProject.projectId);
    activeProject.secretKeyMasked = result.masked;
    await refreshData();
    return { newSecretKey: result.newSecretKey };
  };

  return (
    <DashboardContext.Provider
      value={{
        api,
        mode,
        setMode,
        gatewayStatus,
        projects,
        activeProject,
        setActiveProjectId,
        activeTab,
        setActiveTab,
        selectedActionName,
        setSelectedActionName,
        openInPlayground,
        actions,
        logs,
        telemetry,
        isLoading,
        error,
        refreshData,
        publishAction,
        rotateSecretKey,
        addAllowedDomain,
        removeAllowedDomain,
        updateWalletMode
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
