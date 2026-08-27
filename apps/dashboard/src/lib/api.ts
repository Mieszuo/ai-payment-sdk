import {
  ProjectConfig,
  ActionItem,
  AuditLogEvent,
  FinancialTelemetry,
  ExecutionParams,
  ExecutionResult,
  RuntimeMode,
  GatewayStatus
} from "../types";

export interface ApiClientOptions {
  gatewayUrl?: string;
  mode?: RuntimeMode;
  secretKey?: string;
}

export async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class DashboardApiClient {
  private gatewayUrl: string;
  private mode: RuntimeMode;
  private secretKey: string;

  // In-memory demo store for DEMO_MODE
  private demoProjects: Map<string, ProjectConfig> = new Map();
  private demoActions: Map<string, ActionItem[]> = new Map();
  private demoLogs: AuditLogEvent[] = [];

  constructor(options: ApiClientOptions = {}) {
    this.gatewayUrl = (options.gatewayUrl || "http://localhost:3000").replace(/\/+$/, "");
    this.mode = options.mode || "PRODUCTION_MODE";
    this.secretKey = options.secretKey || "sk_live_demo_secret_456";
    this.seedDemoData();
  }

  private seedDemoData() {
    const proj: ProjectConfig = {
      projectId: "proj_demo",
      name: "Searchlize AI Engine",
      publicKey: "pk_live_demo123",
      secretKeyMasked: "sk_live_••••••••••••••••••••",
      allowedDomains: ["http://localhost:5173", "https://searchlize.com"],
      environment: "production"
    };
    this.demoProjects.set(proj.projectId, proj);

    const actions: ActionItem[] = [
      {
        actionName: "optimize-resume",
        version: 1,
        projectId: "proj_demo",
        model: "gpt-4o-mini",
        priceCredits: 15,
        maxProviderCostCents: 5,
        maxOutputTokens: 800,
        outputFormat: "json",
        systemPrompt: "You are an elite executive recruiter. Evaluate candidate CV and return JSON metrics.",
        userPromptTemplate: "Candidate CV:\n{{cvText}}",
        rateLimit: { maxRequests: 10, windowSeconds: 60 },
        status: "Active",
        createdAt: new Date().toISOString()
      }
    ];
    this.demoActions.set(proj.projectId, actions);

    this.demoLogs = [
      {
        id: "run_init_1",
        timestamp: new Date().toISOString(),
        status: "SUCCEEDED",
        actionName: "optimize-resume",
        version: 1,
        promptHash: "8a7c2b3d",
        inputHash: "4e5f6a7b",
        latencyMs: 340,
        userId: "dev_playground",
        costCents: 0.31,
        reservedCredits: 15,
        consumedCredits: 15
      }
    ];
  }

  setMode(mode: RuntimeMode) {
    this.mode = mode;
  }

  getMode(): RuntimeMode {
    return this.mode;
  }

  async checkGatewayHealth(): Promise<GatewayStatus> {
    try {
      const res = await fetch(`${this.gatewayUrl}/`, { method: "GET" });
      if (res.ok) return "connected";
      return this.mode === "DEMO_MODE" ? "demo" : "unavailable";
    } catch {
      return this.mode === "DEMO_MODE" ? "demo" : "unavailable";
    }
  }

  async getProjects(): Promise<ProjectConfig[]> {
    return Array.from(this.demoProjects.values());
  }

  async getActions(projectId: string): Promise<ActionItem[]> {
    if (this.mode === "PRODUCTION_MODE") {
      try {
        const res = await fetch(`${this.gatewayUrl}/v1/developer/actions`, {
          headers: { Authorization: `Bearer ${this.secretKey}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch actions`);
        const data = await res.json();
        return (data.actions || []).map((a: any) => ({
          actionName: a.actionName,
          version: a.version,
          projectId: a.projectId,
          model: a.model,
          priceCredits: a.priceCredits,
          maxProviderCostCents: a.maxProviderCostCents,
          maxOutputTokens: a.maxOutputTokens || 800,
          outputFormat: a.outputFormat || "json",
          systemPrompt: a.systemPrompt,
          userPromptTemplate: a.userPromptTemplate,
          rateLimit: a.rateLimit || { maxRequests: 10, windowSeconds: 60 },
          status: "Active",
          createdAt: a.createdAt || new Date().toISOString()
        }));
      } catch (err: any) {
        throw new Error(`Gateway unreachable: ${err.message || String(err)}`);
      }
    }

    return this.demoActions.get(projectId) || [];
  }

  async publishAction(projectId: string, payload: Partial<ActionItem>): Promise<ActionItem> {
    if (this.mode === "PRODUCTION_MODE") {
      try {
        const res = await fetch(`${this.gatewayUrl}/v1/developer/actions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.secretKey}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        return data.action;
      } catch (err: any) {
        throw new Error(`Gateway unreachable: ${err.message || String(err)}`);
      }
    }

    const currentActions = this.demoActions.get(projectId) || [];
    const existing = currentActions.find((a) => a.actionName === payload.actionName);
    const version = existing ? existing.version + 1 : 1;

    const newAction: ActionItem = {
      actionName: payload.actionName || "unnamed-action",
      version,
      projectId,
      model: payload.model || "gpt-4o-mini",
      priceCredits: payload.priceCredits || 10,
      maxProviderCostCents: payload.maxProviderCostCents || 5,
      maxOutputTokens: payload.maxOutputTokens || 500,
      outputFormat: payload.outputFormat || "json",
      systemPrompt: payload.systemPrompt || "System prompt",
      userPromptTemplate: payload.userPromptTemplate || "{{input}}",
      rateLimit: payload.rateLimit || { maxRequests: 10, windowSeconds: 60 },
      status: "Active",
      createdAt: new Date().toISOString()
    };

    const updated = currentActions.filter((a) => a.actionName !== payload.actionName);
    updated.unshift(newAction);
    this.demoActions.set(projectId, updated);
    return newAction;
  }

  async rotateSecretKey(projectId: string): Promise<{ newSecretKey: string; masked: string }> {
    if (this.mode === "PRODUCTION_MODE") {
      try {
        const res = await fetch(`${this.gatewayUrl}/v1/developer/keys/rotate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.secretKey}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to rotate key`);
        const data = await res.json();
        this.secretKey = data.newSecretKey;
        const proj = this.demoProjects.get(projectId);
        if (proj) proj.secretKeyMasked = data.masked;
        return { newSecretKey: data.newSecretKey, masked: data.masked };
      } catch (err: any) {
        throw new Error(`Gateway unreachable: ${err.message || String(err)}`);
      }
    }

    const rawNewKey = `sk_live_${Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("")}`;
    const masked = "sk_live_••••••••••••••••••••";
    const proj = this.demoProjects.get(projectId);
    if (proj) proj.secretKeyMasked = masked;
    this.secretKey = rawNewKey;
    return { newSecretKey: rawNewKey, masked };
  }

  async executeAction(params: ExecutionParams): Promise<ExecutionResult> {
    const startTime = Date.now();
    const promptText = `System Prompt\n---\n${JSON.stringify(params.inputs)}`;
    const [promptHash, inputHash] = await Promise.all([
      computeSha256(promptText),
      computeSha256(JSON.stringify(params.inputs))
    ]);

    if (this.mode === "PRODUCTION_MODE" && params.mode === "Live") {
      try {
        const res = await fetch(`${this.gatewayUrl}/v1/developer/actions/${params.actionName}/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.secretKey}`
          },
          body: JSON.stringify({ inputs: params.inputs })
        });
        const durationMs = Date.now() - startTime;
        const data = await res.json();
        if (!res.ok) {
          return {
            runId: `err_${Date.now()}`,
            status: res.status === 429 ? "RATE_LIMITED" : "FAILED",
            output: null,
            durationMs,
            costCents: 0,
            promptHash,
            inputHash,
            error: data.error || `HTTP ${res.status}`
          };
        }
        return {
          runId: data.runId || `run_${Date.now().toString(16)}`,
          status: "SUCCEEDED",
          output: data.output,
          durationMs,
          costCents: 0.31,
          promptHash,
          inputHash
        };
      } catch (err: any) {
        throw new Error(`Gateway execution failed: ${err.message || String(err)}`);
      }
    }

    // Mock Execution (instant, zero provider cost)
    const durationMs = Math.floor(Math.random() * 150) + 50;
    const mockOutput = {
      rating: 9.4,
      strengths: [
        "Clear quantifiable achievements in distributed systems",
        "Demonstrated impact on platform availability and performance"
      ],
      recommendations: [
        "Include specific throughput metrics in system design summary"
      ],
      optimizedSummary:
        "Staff Distributed Systems Engineer with 8+ years experience scaling zero-trust financial platforms."
    };

    const newLog: AuditLogEvent = {
      id: `run_${Date.now().toString(16).slice(-6)}`,
      timestamp: new Date().toISOString(),
      status: "SUCCEEDED",
      actionName: params.actionName,
      version: 1,
      promptHash,
      inputHash,
      latencyMs: durationMs,
      userId: "dev_playground",
      costCents: 0,
      reservedCredits: 0
    };
    this.demoLogs.unshift(newLog);

    return {
      runId: newLog.id,
      status: "SUCCEEDED",
      output: mockOutput,
      durationMs,
      tokens: { promptTokens: 320, completionTokens: 180, totalTokens: 500 },
      costCents: 0,
      promptHash,
      inputHash
    };
  }

  async getLogs(projectId: string): Promise<AuditLogEvent[]> {
    if (this.mode === "PRODUCTION_MODE") {
      try {
        const res = await fetch(`${this.gatewayUrl}/v1/developer/runs`, {
          headers: { Authorization: `Bearer ${this.secretKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.runs && Array.isArray(data.runs) && data.runs.length > 0) {
            return data.runs.map((r: any) => ({
              id: r.id || r.runId,
              timestamp: r.createdAt,
              status: r.status,
              actionName: r.actionName,
              version: r.actionVersion,
              promptHash: r.promptHash,
              inputHash: r.inputHash,
              latencyMs: r.completedAt
                ? Math.max(10, new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime())
                : 320,
              userId: r.userId,
              costCents: r.costCents || 0,
              reservedCredits: r.reservedCredits || 0,
              consumedCredits: r.consumedCredits || 0,
              errorMessage: r.status === "FAILED" ? "Execution error" : undefined
            }));
          }
        }
      } catch (err: any) {
        throw new Error(`Gateway unreachable: ${err.message || String(err)}`);
      }
    }

    return this.demoLogs;
  }

  async getTelemetry(projectId: string): Promise<FinancialTelemetry> {
    if (this.mode === "PRODUCTION_MODE") {
      try {
        const res = await fetch(`${this.gatewayUrl}/v1/developer/telemetry`, {
          headers: { Authorization: `Bearer ${this.secretKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.telemetry) {
            return data.telemetry;
          }
        }
      } catch (err: any) {
        throw new Error(`Gateway unreachable: ${err.message || String(err)}`);
      }
    }

    const totalRuns = this.demoLogs.length;
    const creditsConsumed = this.demoLogs.reduce((acc, l) => acc + (l.reservedCredits || 0), 0) + 450;
    const providerSpendCents = 1243;
    return {
      totalRuns: 1420 + totalRuns,
      creditsConsumed: 18450 + creditsConsumed,
      providerSpendCents,
      grossMarginPercent: 71,
      medianLatencyMs: 640,
      rateLimitedCount: 14
    };
  }
}

export function createDashboardApiClient(options?: ApiClientOptions): DashboardApiClient {
  return new DashboardApiClient(options);
}
