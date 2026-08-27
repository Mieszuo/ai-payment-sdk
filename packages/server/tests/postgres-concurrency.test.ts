import { describe, it, expect, beforeEach } from "bun:test";
import { PostgresSimulatorDatabase, PostgresDatabase } from "../src/adapters/postgres-db";
import { LedgerService } from "../src/services/ledger.service";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { ActionRunService } from "../src/services/run.service";

describe("PostgreSQL Transaction Isolation & Row-Level Locking", () => {
  let db: PostgresSimulatorDatabase;
  let ledger: LedgerService;

  beforeEach(() => {
    db = new PostgresSimulatorDatabase();
    ledger = new LedgerService(db as any);
    db.seedWallet("usr_pg_concurrent", 20); // 20 credits balance
  });

  it("blocks concurrent overdraws via row-level locking simulation (10 parallel requests)", async () => {
    // 10 concurrent attempts to reserve 10 credits each. Only 2 should succeed (20 / 10 = 2).
    const requests = Array.from({ length: 10 }, (_, i) => 
      ledger.reserveCredits("usr_pg_concurrent", 10, `idem_concurrent_${i}`, `run_pg_${i}`)
    );

    const results = await Promise.allSettled(requests);
    const fulfilled = results.filter(r => r.status === "fulfilled");
    const rejected = results.filter(r => r.status === "rejected");

    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(8);

    const wallet = await ledger.getWallet("usr_pg_concurrent");
    expect(wallet.availableCredits).toBe(0);
    expect(wallet.reservedCredits).toBe(20);
  });

  it("handles UNIQUE constraint violation on idempotency_key gracefully", async () => {
    await ledger.reserveCredits("usr_pg_concurrent", 10, "idem_duplicate", "run_1");
    // Duplicate call with exact same idempotency_key must be idempotent no-op
    await ledger.reserveCredits("usr_pg_concurrent", 10, "idem_duplicate", "run_1");

    const wallet = await ledger.getWallet("usr_pg_concurrent");
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.reservedCredits).toBe(10);
  });

  it("verifies lockWalletRow provides row-level mutual exclusion per user", async () => {
    const user1 = "usr_row_lock_1";
    const user2 = "usr_row_lock_2";
    db.seedWallet(user1, 100);
    db.seedWallet(user2, 100);

    const order: string[] = [];

    // Lock user1 and delay release
    const release1 = await db.lockWalletRow(user1);
    const p1 = (async () => {
      order.push("start_u1_wait");
      const releaseAgain = await db.lockWalletRow(user1);
      order.push("acquired_u1");
      releaseAgain();
    })();

    // Locking user2 should proceed immediately without waiting for user1
    const release2 = await db.lockWalletRow(user2);
    order.push("acquired_u2_immediately");
    release2();

    // Now release user1
    release1();
    await p1;

    expect(order).toEqual(["start_u1_wait", "acquired_u2_immediately", "acquired_u1"]);
  });

  it("simulates SELECT available_credits, reserved_credits FROM wallets WHERE user_id = $1 FOR UPDATE parameterized query", async () => {
    const pgDb: PostgresDatabase = db;
    const res = await pgDb.query<{ available_credits: number; reserved_credits: number }>(
      "SELECT available_credits, reserved_credits FROM wallets WHERE user_id = $1 FOR UPDATE",
      ["usr_pg_concurrent"]
    );

    expect(res.rowCount).toBe(1);
    expect(res.rows[0].available_credits).toBe(20);
    expect(res.rows[0].reserved_credits).toBe(0);
  });

  it("enforces UNIQUE(idempotency_key) constraint in query execution", async () => {
    const pgDb: PostgresDatabase = db;

    // First insert succeeds
    const res1 = await pgDb.query(
      "INSERT INTO ledger_transactions (id, idempotency_key, transaction_type) VALUES ($1, $2, $3)",
      ["tx_1", "idem_unique_test", "RESERVATION"]
    );
    expect(res1.rowCount).toBe(1);

    // Duplicate insert throws UNIQUE constraint violation
    expect(
      pgDb.query(
        "INSERT INTO ledger_transactions (id, idempotency_key, transaction_type) VALUES ($1, $2, $3)",
        ["tx_2", "idem_unique_test", "RESERVATION"]
      )
    ).rejects.toThrow(/unique constraint/i);
  });

  it("declares actionRuns directly on InMemoryDatabase to eliminate (db as any) casts", () => {
    const inMemDb = new InMemoryDatabase();
    expect(inMemDb.actionRuns).toBeDefined();
    expect(inMemDb.actionRuns instanceof Map).toBe(true);

    const runService = new ActionRunService(inMemDb);
    expect(inMemDb.actionRuns).toBeDefined();
  });
});
