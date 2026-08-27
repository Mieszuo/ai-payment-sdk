import { LedgerDatabase } from "../adapters/database";

export type RunStatus = "RESERVED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export interface ActionRunRecord {
  id: string;
  runId?: string;
  projectId: string;
  userId: string;
  actionName: string;
  actionVersion: number;
  idempotencyKey: string;
  status: RunStatus;
  model: string;
  reservedCredits: number;
  consumedCredits: number;
  costCents?: number;
  promptHash: string;
  inputHash: string;
  createdAt: string;
  completedAt?: string;
}

export class ActionRunService {
  private runs: Map<string, ActionRunRecord>;

  constructor(private db?: LedgerDatabase) {
    if (db && db.actionRuns) {
      this.runs = db.actionRuns as Map<string, ActionRunRecord>;
    } else {
      this.runs = new Map<string, ActionRunRecord>();
      if (db) {
        db.actionRuns = this.runs;
      }
    }
  }

  private async sha256(text: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  async recordRunReservation(params: {
    runId: string;
    projectId: string;
    userId: string;
    actionName: string;
    actionVersion: number;
    model: string;
    priceCredits: number;
    systemPrompt: string;
    userPrompt: string;
    inputs: Record<string, unknown>;
    idempotencyKey: string;
  }): Promise<ActionRunRecord> {
    const existing = this.runs.get(params.runId);
    if (existing) {
      return existing;
    }

    const promptHash = await this.sha256(`${params.systemPrompt}\n---\n${params.userPrompt}`);
    const inputHash = await this.sha256(JSON.stringify(params.inputs));

    const record: ActionRunRecord = {
      id: params.runId,
      runId: params.runId,
      projectId: params.projectId,
      userId: params.userId,
      actionName: params.actionName,
      actionVersion: params.actionVersion,
      idempotencyKey: params.idempotencyKey,
      status: "RESERVED",
      model: params.model,
      reservedCredits: params.priceCredits,
      consumedCredits: 0,
      promptHash,
      inputHash,
      createdAt: new Date().toISOString()
    };

    this.runs.set(params.runId, record);
    return record;
  }

  async markRunning(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run && run.status === "RESERVED") {
      run.status = "RUNNING";
    }
  }

  async markSucceeded(
    runId: string,
    params: { consumedCredits: number; costCents?: number }
  ): Promise<void> {
    const run = this.runs.get(runId);
    if (run && (run.status === "RESERVED" || run.status === "RUNNING")) {
      run.status = "SUCCEEDED";
      run.consumedCredits = params.consumedCredits;
      run.costCents = params.costCents;
      run.completedAt = new Date().toISOString();
    }
  }

  async markFailed(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run && run.status !== "SUCCEEDED") {
      run.status = "FAILED";
      run.completedAt = new Date().toISOString();
    }
  }

  async markCancelled(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run && run.status !== "SUCCEEDED") {
      run.status = "CANCELLED";
      run.completedAt = new Date().toISOString();
    }
  }

  getRun(runId: string): ActionRunRecord | undefined {
    return this.runs.get(runId);
  }

  listRuns(): ActionRunRecord[] {
    return Array.from(this.runs.values());
  }

  getRunsByProject(projectId: string): ActionRunRecord[] {
    return Array.from(this.runs.values()).filter((r) => r.projectId === projectId);
  }

  getRunsByUser(userId: string): ActionRunRecord[] {
    return Array.from(this.runs.values()).filter((r) => r.userId === userId);
  }
}
