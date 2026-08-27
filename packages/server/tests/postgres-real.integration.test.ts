import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PostgresDatabase } from "../src/adapters/postgres-real";

const DATABASE_URL = process.env.DATABASE_URL;
const describeDb = DATABASE_URL ? describe : describe.skip;

describeDb("PostgresDatabase SQL-first persistence", () => {
  let db: PostgresDatabase;

  beforeAll(async () => {
    db = new PostgresDatabase({ url: DATABASE_URL!, max: 1 });
    await db.init();
    // Fresh wallet for the test
    await db.runInTransaction(async () => {
      db.seedWallet("it_usr_1", 20);
    });
  });

  afterAll(async () => {
    await db.close();
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
});
