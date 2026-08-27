import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import postgres from "postgres";
import { PostgresDatabase } from "../src/adapters/postgres-real";
import { ActionRunService } from "../src/services/run.service";

const DATABASE_URL = process.env.DATABASE_URL;
const describeDb = DATABASE_URL ? describe : describe.skip;

describeDb("PostgresDatabase SQL-first persistence", () => {
  let db!: PostgresDatabase;
  let raw!: ReturnType<typeof postgres>;

  beforeAll(async () => {
    // Raw client for one-off fixture setup (projects are not persisted by the
    // app yet, but migration 003 adds fk_action_runs_project, so a run insert
    // requires the referenced project row to exist).
    raw = postgres(DATABASE_URL!, { max: 1 });
    await raw`
      INSERT INTO projects (id, name, public_key, allowed_domains, developer_id)
      VALUES ('it_proj_1', 'Integration Test Project', 'pk_it_proj_1', '{}', 'it_dev_1')
      ON CONFLICT (id) DO NOTHING
    `;

    db = new PostgresDatabase({ url: DATABASE_URL!, max: 1 });
    await db.init();
    // Migration 004 enforces action_runs.project_id -> developer_projects(project_id),
    // so the run-audit fixtures below need the project row in the persisted
    // developer registry (upsertDeveloperProject is write-through).
    await db.upsertDeveloperProject({
      projectId: "it_proj_1",
      name: "Integration Test Project",
      publicKey: "pk_it_proj_1",
      secretKey: "sk_it_proj_1"
    });
    // Fresh wallet for the test
    await db.runInTransaction(async () => {
      db.seedWallet("it_usr_1", 20);
    });
  });

  afterAll(async () => {
    await db?.close();
    await raw?.end();
  });

  it("blocks concurrent overdraws via row locks: 10 parallel reserves, only 2 succeed on 20 credits", async () => {
    const attempts = Array.from({ length: 10 }, (_, i) =>
      db.reserveCredits("it_usr_1", 10, `it_idem_${i}`, `it_run_${i}`)
    );
    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(2);
    const wallet = await db.getWallet("it_usr_1");
    expect(wallet.availableCredits).toBe(0);
    expect(wallet.reservedCredits).toBe(20);
  });

  it("survives a restart: new instance hydrates balances from Postgres", async () => {
    await db.close();
    const db2 = new PostgresDatabase({ url: DATABASE_URL!, max: 1 });
    await db2.init();
    const wallet = await db2.getWallet("it_usr_1");
    expect(wallet.availableCredits).toBe(0);
    expect(wallet.reservedCredits).toBe(20);
    db = db2;
  });

  it("applyCredit is idempotent on replay and creates a balanced ledger transaction", async () => {
    await db.applyCredit("it_usr_1", 50, "TOPUP", "it_topup_1", "cs_test_1");
    await db.applyCredit("it_usr_1", 50, "TOPUP", "it_topup_1", "cs_test_1"); // replay
    const wallet = await db.getWallet("it_usr_1");
    expect(wallet.availableCredits).toBe(50);
  });

  it("concurrent same-key applyCredit applies the wallet mutation exactly once", async () => {
    // A dedicated instance with a >1 pool so two transactions can be in flight
    // simultaneously: both pass the in-memory idempotency cache and race on the
    // UNIQUE(idempotency_key) ledger insert. Only the winner may mutate.
    const dbC = new PostgresDatabase({ url: DATABASE_URL!, max: 2 });
    await dbC.init();
    try {
      const results = await Promise.allSettled([
        dbC.applyCredit("it_usr_parallel", 30, "TOPUP", "it_parallel_topup", "cs_parallel_1"),
        dbC.applyCredit("it_usr_parallel", 30, "TOPUP", "it_parallel_topup", "cs_parallel_1")
      ]);
      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
      const wallet = await dbC.getWallet("it_usr_parallel");
      expect(wallet.availableCredits).toBe(30); // credited once, not twice
    } finally {
      await dbC.close();
    }
  });

  it("concurrent same-key reserveCredits does not raise spurious INSUFFICIENT_CREDITS and reserves once", async () => {
    const dbC = new PostgresDatabase({ url: DATABASE_URL!, max: 2 });
    await dbC.init();
    try {
      await dbC.runInTransaction(async () => {
        dbC.seedWallet("it_usr_parallel_res", 10);
      });
      const results = await Promise.allSettled([
        dbC.reserveCredits("it_usr_parallel_res", 10, "it_parallel_res", "it_parallel_run"),
        dbC.reserveCredits("it_usr_parallel_res", 10, "it_parallel_res", "it_parallel_run")
      ]);
      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
      const wallet = await dbC.getWallet("it_usr_parallel_res");
      expect(wallet.availableCredits).toBe(0);
      expect(wallet.reservedCredits).toBe(10);
    } finally {
      await dbC.close();
    }
  });

  it("persists a completed run via upsertActionRun (through ActionRunService) and hydrates it on init", async () => {
    const runService = new ActionRunService(db);
    const runId = crypto.randomUUID();

    const record = await runService.recordRunReservation({
      runId,
      projectId: "it_proj_1",
      userId: "it_usr_1",
      actionName: "it-action",
      actionVersion: 1,
      model: "mock/model",
      priceCredits: 10,
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
      inputs: { key: "value" },
      idempotencyKey: `it_run_idem_${runId}`
    });
    expect(record.status).toBe("RESERVED");

    await runService.markRunning(runId);
    await runService.markSucceeded(runId, { consumedCredits: 10, costCents: 1.5 });

    // A brand-new instance must hydrate the run from Postgres.
    const db2 = new PostgresDatabase({ url: DATABASE_URL!, max: 1 });
    await db2.init();
    try {
      const hydrated = db2.actionRuns.get(runId);
      expect(hydrated).toBeDefined();
      expect(hydrated.status).toBe("SUCCEEDED");
      expect(hydrated.actionName).toBe("it-action");
      expect(hydrated.consumedCredits).toBe(10);
      expect(hydrated.costCents).toBe(1.5);
      expect(hydrated.completedAt).toBeDefined();
      expect(hydrated.promptHash).toHaveLength(64);
    } finally {
      await db2.close();
    }
  });

  it("persists developer registry across instances (Postgres mode)", async () => {
    await db.upsertDeveloperProject({ projectId: "it_proj", name: "P", publicKey: "pk_live_it", secretKey: "sk_live_it" });
    await db.upsertActionVersion({ actionName: "a", version: 1, projectId: "it_proj", model: "mock", priceCredits: 5, maxProviderCostCents: 10, maxOutputTokens: 1000, outputFormat: "json", systemPrompt: "", userPromptTemplate: "", inputSchema: {}, rateLimit: { maxRequests: 10, windowSeconds: 60 } });
    const state = await db.loadDeveloperState();
    expect(state.projects.some((p) => p.projectId === "it_proj")).toBe(true);
    expect(state.versions.some((v) => v.projectId === "it_proj" && v.actionName === "a")).toBe(true);
  });
});
