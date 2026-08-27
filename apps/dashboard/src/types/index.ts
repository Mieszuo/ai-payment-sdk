export type RuntimeMode = "PRODUCTION_MODE" | "DEMO_MODE";

export type GatewayStatus = "connected" | "demo" | "unavailable";

export type ActionStatus = "Active" | "Draft" | "Archived";

export interface ProjectConfig {
  projectId: string;
  name: string;
  publicKey: string;
  secretKeyMasked: string;
  allowedDomains: string[];
  environment: "production" | "sandbox";
}

export interface ActionItem {
  actionName: string;
  version: number;
  projectId: string;
  model: string;
  priceCredits: number;
  maxProviderCostCents: number;
  maxOutputTokens?: number;
  outputFormat?: "text" | "json";
  systemPrompt: string;
  userPromptTemplate: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  rateLimit?: {
    maxRequests: number;
    windowSeconds: number;
  };
  status: ActionStatus;
  createdAt: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  status: "SUCCEEDED" | "FAILED" | "RATE_LIMITED";
  actionName: string;
  version: number;
  promptHash: string;
  inputHash: string;
  latencyMs: number;
  userId: string;
  costCents: number;
  reservedCredits: number;
  errorMessage?: string;
}

export interface FinancialTelemetry {
  totalRuns: number;
  creditsConsumed: number;
  providerSpendCents: number;
  grossMarginPercent: number;
  medianLatencyMs: number;
  rateLimitedCount: number;
}

export interface ExecutionParams {
  projectId: string;
  actionName: string;
  inputs: Record<string, any>;
  mode: "Mock" | "Live";
  userSessionToken?: string;
}

export interface ExecutionResult {
  runId: string;
  status: "SUCCEEDED" | "FAILED" | "RATE_LIMITED";
  output: any;
  durationMs: number;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costCents: number;
  promptHash: string;
  inputHash: string;
  error?: string;
}
