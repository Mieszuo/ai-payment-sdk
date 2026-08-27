import { describe, it, expect } from "bun:test";
import { ActionRunService } from "../src/services/run.service";
import { ActionExecutionService } from "../src/services/action.service";
import { LedgerService } from "../src/services/ledger.service";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { MockModelProvider } from "../src/adapters/model-provider";
import { ActionVersion } from "@ai-credits/shared";

describe("Action Runs Immutable Audit Record", () => {
  it("stores full execution snapshot with prompt and input hashes", async () => {
    const runService = new ActionRunService();

    const run = await runService.recordRunReservation({
      runId: "run_test_1",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "optimize-resume",
      actionVersion: 3,
      model: "openai/gpt-4o",
      priceCredits: 15,
      systemPrompt: "Review resumes rigorously.",
      userPrompt: "Candidate CV text...",
      inputs: { cvText: "Candidate CV text..." },
      idempotencyKey: "idem_run_1"
    });

    expect(run.status).toBe("RESERVED");
    expect(run.actionVersion).toBe(3);
    expect(run.promptHash).toHaveLength(64); // SHA-256 hex
    expect(run.inputHash).toHaveLength(64);

    await runService.markSucceeded("run_test_1", {
      consumedCredits: 15,
      costCents: 2.5
    });

    const completed = runService.getRun("run_test_1");
    expect(completed?.status).toBe("SUCCEEDED");
    expect(completed?.completedAt).toBeDefined();
  });

  it("handles lifecycle state transitions: RESERVED -> RUNNING -> SUCCEEDED", async () => {
    const runService = new ActionRunService();

    await runService.recordRunReservation({
      runId: "run_lifecycle_1",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "test-action",
      actionVersion: 1,
      model: "gpt-4o",
      priceCredits: 10,
      systemPrompt: "sys",
      userPrompt: "user",
      inputs: { key: "val" },
      idempotencyKey: "idem_lifecycle_1"
    });

    expect(runService.getRun("run_lifecycle_1")?.status).toBe("RESERVED");

    await runService.markRunning("run_lifecycle_1");
    expect(runService.getRun("run_lifecycle_1")?.status).toBe("RUNNING");

    await runService.markSucceeded("run_lifecycle_1", {
      consumedCredits: 10,
      costCents: 1.2
    });

    const succeeded = runService.getRun("run_lifecycle_1");
    expect(succeeded?.status).toBe("SUCCEEDED");
    expect(succeeded?.consumedCredits).toBe(10);
    expect(succeeded?.costCents).toBe(1.2);
    expect(succeeded?.completedAt).toBeDefined();
  });

  it("handles failure transitions: RESERVED -> RUNNING -> FAILED", async () => {
    const runService = new ActionRunService();

    await runService.recordRunReservation({
      runId: "run_fail_1",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "test-action",
      actionVersion: 1,
      model: "gpt-4o",
      priceCredits: 10,
      systemPrompt: "sys",
      userPrompt: "user",
      inputs: {},
      idempotencyKey: "idem_fail_1"
    });

    await runService.markRunning("run_fail_1");
    await runService.markFailed("run_fail_1");

    const failed = runService.getRun("run_fail_1");
    expect(failed?.status).toBe("FAILED");
    expect(failed?.completedAt).toBeDefined();
    expect(failed?.consumedCredits).toBe(0);
  });

  it("computes deterministic cryptographic SHA-256 hashes for prompt and inputs", async () => {
    const runService = new ActionRunService();

    const systemPrompt = "System prompt instruction";
    const userPrompt = "User prompt content";
    const inputs = { foo: "bar", count: 42 };

    const run = await runService.recordRunReservation({
      runId: "run_hash_1",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "hash-test",
      actionVersion: 2,
      model: "claude-3-opus",
      priceCredits: 20,
      systemPrompt,
      userPrompt,
      inputs,
      idempotencyKey: "idem_hash_1"
    });

    // Compute expected hashes independently
    const expectedPromptHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${systemPrompt}\n---\n${userPrompt}`)
    );
    const expectedPromptHash = Array.from(new Uint8Array(expectedPromptHashBuffer), b =>
      b.toString(16).padStart(2, "0")
    ).join("");

    const expectedInputHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(inputs))
    );
    const expectedInputHash = Array.from(new Uint8Array(expectedInputHashBuffer), b =>
      b.toString(16).padStart(2, "0")
    ).join("");

    expect(run.promptHash).toBe(expectedPromptHash);
    expect(run.inputHash).toBe(expectedInputHash);
  });

  it("integrates with ActionExecutionService on successful execution", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_integration", 100);
    const ledger = new LedgerService(db);
    const modelProvider = new MockModelProvider();
    modelProvider.setResponse(JSON.stringify({ result: "done" }));
    modelProvider.setCostCents(3.5);

    const action: ActionVersion = {
      actionName: "integration-action",
      version: 1,
      projectId: "proj_integration",
      model: "mock/model",
      priceCredits: 25,
      maxProviderCostCents: 10,
      maxOutputTokens: 1000,
      outputFormat: "json",
      systemPrompt: "You are an assistant",
      userPromptTemplate: "Process {{input}}",
      inputSchema: { type: "object", required: ["input"] },
      rateLimit: { maxRequests: 10, windowSeconds: 60 }
    };

    const runService = new ActionRunService();
    const actionService = new ActionExecutionService(
      ledger,
      modelProvider,
      [action],
      runService
    );

    const execResult = await actionService.execute({
      actionName: "integration-action",
      projectId: "proj_integration",
      userId: "usr_integration",
      inputs: { input: "test-data" }
    });

    expect(execResult.creditsUsed).toBe(25);
    expect(execResult.remainingBalance).toBe(75);
    expect(execResult.runId).toBeDefined();

    const record = runService.getRun(execResult.runId!);
    expect(record).toBeDefined();
    expect(record?.status).toBe("SUCCEEDED");
    expect(record?.actionName).toBe("integration-action");
    expect(record?.actionVersion).toBe(1);
    expect(record?.model).toBe("mock/model");
    expect(record?.reservedCredits).toBe(25);
    expect(record?.consumedCredits).toBe(25);
    expect(record?.costCents).toBe(3.5);
    expect(record?.completedAt).toBeDefined();
    expect(record?.promptHash).toHaveLength(64);
    expect(record?.inputHash).toHaveLength(64);
  });

  it("integrates with ActionExecutionService and records FAILED status on error", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_fail_integration", 100);
    const ledger = new LedgerService(db);
    const modelProvider = new MockModelProvider();

    const action: ActionVersion = {
      actionName: "failing-action",
      version: 2,
      projectId: "proj_integration",
      model: "mock/model",
      priceCredits: 20,
      maxProviderCostCents: 10,
      maxOutputTokens: 1000,
      outputFormat: "json",
      systemPrompt: "You are an assistant",
      userPromptTemplate: "Process {{input}}",
      inputSchema: { type: "object", required: ["input"] },
      rateLimit: { maxRequests: 10, windowSeconds: 60 }
    };

    const runService = new ActionRunService();
    const actionService = new ActionExecutionService(
      ledger,
      modelProvider,
      [action],
      runService
    );

    // Missing required field 'input'
    await expect(
      actionService.execute({
        actionName: "failing-action",
        projectId: "proj_integration",
        userId: "usr_fail_integration",
        inputs: {}
      })
    ).rejects.toThrow();

    // Check that run record was recorded and marked FAILED
    const runs = (runService as any).runs as Map<string, any>;
    expect(runs.size).toBe(1);
    const [failedRun] = Array.from(runs.values());
    expect(failedRun.status).toBe("FAILED");
    expect(failedRun.completedAt).toBeDefined();
    expect(failedRun.actionName).toBe("failing-action");
    expect(failedRun.actionVersion).toBe(2);

    // Wallet reservation should have been released
    const wallet = await ledger.getWallet("usr_fail_integration");
    expect(wallet.availableCredits).toBe(100);
    expect(wallet.reservedCredits).toBe(0);
  });

  it("guards against markSucceeded transitioning already failed or cancelled runs", async () => {
    const runService = new ActionRunService();

    // 1. Failed run
    await runService.recordRunReservation({
      runId: "run_guard_failed",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "test-action",
      actionVersion: 1,
      model: "gpt-4o",
      priceCredits: 10,
      systemPrompt: "sys",
      userPrompt: "user",
      inputs: {},
      idempotencyKey: "idem_guard_1"
    });
    await runService.markFailed("run_guard_failed");
    expect(runService.getRun("run_guard_failed")?.status).toBe("FAILED");

    // Attempt markSucceeded
    await runService.markSucceeded("run_guard_failed", { consumedCredits: 10 });
    expect(runService.getRun("run_guard_failed")?.status).toBe("FAILED");

    // 2. Cancelled run
    await runService.recordRunReservation({
      runId: "run_guard_cancelled",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "test-action",
      actionVersion: 1,
      model: "gpt-4o",
      priceCredits: 10,
      systemPrompt: "sys",
      userPrompt: "user",
      inputs: {},
      idempotencyKey: "idem_guard_2"
    });
    await runService.markCancelled("run_guard_cancelled");
    expect(runService.getRun("run_guard_cancelled")?.status).toBe("CANCELLED");

    // Attempt markSucceeded
    await runService.markSucceeded("run_guard_cancelled", { consumedCredits: 10 });
    expect(runService.getRun("run_guard_cancelled")?.status).toBe("CANCELLED");
  });
});

describe("ActionRunService persistence (upsertActionRun)", () => {
  // Minimal LedgerDatabase stub: subclass InMemoryDatabase and record every
  // upsertActionRun call so we can assert persistence happens after mutations.
  class RecordingLedgerDatabase extends InMemoryDatabase {
    public upsertedRuns: any[] = [];

    async upsertActionRun(record: Record<string, any>): Promise<void> {
      this.upsertedRuns.push({ ...record });
    }
  }

  it("invokes upsertActionRun after recordRunReservation, markRunning and markSucceeded", async () => {
    const db = new RecordingLedgerDatabase();
    const runService = new ActionRunService(db);

    await runService.recordRunReservation({
      runId: "run_persist_1",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "persist-action",
      actionVersion: 1,
      model: "gpt-4o",
      priceCredits: 10,
      systemPrompt: "sys",
      userPrompt: "user",
      inputs: {},
      idempotencyKey: "idem_persist_1"
    });
    expect(db.upsertedRuns).toHaveLength(1);
    expect(db.upsertedRuns[0].status).toBe("RESERVED");

    await runService.markRunning("run_persist_1");
    expect(db.upsertedRuns).toHaveLength(2);
    expect(db.upsertedRuns[1].status).toBe("RUNNING");

    await runService.markSucceeded("run_persist_1", { consumedCredits: 10, costCents: 1.2 });
    const last = db.upsertedRuns[db.upsertedRuns.length - 1];
    expect(last.status).toBe("SUCCEEDED");
    expect(last.consumedCredits).toBe(10);
    expect(last.costCents).toBe(1.2);
    expect(last.completedAt).toBeDefined();
  });

  it("invokes upsertActionRun on markFailed and markCancelled", async () => {
    const db = new RecordingLedgerDatabase();
    const runService = new ActionRunService(db);

    await runService.recordRunReservation({
      runId: "run_persist_fail",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "persist-action",
      actionVersion: 1,
      model: "gpt-4o",
      priceCredits: 10,
      systemPrompt: "sys",
      userPrompt: "user",
      inputs: {},
      idempotencyKey: "idem_persist_fail"
    });
    await runService.markFailed("run_persist_fail");
    expect(db.upsertedRuns[db.upsertedRuns.length - 1].status).toBe("FAILED");

    await runService.recordRunReservation({
      runId: "run_persist_cancel",
      projectId: "proj_1",
      userId: "usr_1",
      actionName: "persist-action",
      actionVersion: 1,
      model: "gpt-4o",
      priceCredits: 10,
      systemPrompt: "sys",
      userPrompt: "user",
      inputs: {},
      idempotencyKey: "idem_persist_cancel"
    });
    await runService.markCancelled("run_persist_cancel");
    expect(db.upsertedRuns[db.upsertedRuns.length - 1].status).toBe("CANCELLED");
  });
});
