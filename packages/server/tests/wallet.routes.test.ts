import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { LedgerService } from "../src/services/ledger.service";
import { AuthService } from "../src/services/auth.service";
import { createWalletRoutes } from "../src/routes/wallet.routes";

describe("Wallet Routes (/v1/wallet)", () => {
  const setupTestEnv = async (initialBalance = 100) => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_wallet_1", initialBalance);

    const ledger = new LedgerService(db);
    const authService = new AuthService(db, "secret-key-32-chars-long-example!");
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";

    const token = await authService.issueAuthorizationCode({
      userId: "usr_wallet_1",
      email: "wallet@example.com",
      projectId: "proj_wallet_1",
      codeChallenge: verifier
    }).then(code => authService.exchangeCodeForSession({
      projectId: "proj_wallet_1",
      code,
      codeVerifier: verifier
    })).then(res => res.sessionToken);

    const app = new Hono().route("/v1/wallet", createWalletRoutes(ledger, authService));

    return { db, ledger, authService, token, app };
  };

  it("fetches wallet balances with valid Bearer token", async () => {
    const { token, app } = await setupTestEnv(150);

    const res = await app.request("/v1/wallet", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.availableCredits).toBe(150);
    expect(body.reservedCredits).toBe(0);
  });

  it("reflects reserved credits accurately", async () => {
    const { ledger, token, app } = await setupTestEnv(100);

    await ledger.reserveCredits("usr_wallet_1", 30, "idemp_res_1", "run_wallet_1");

    const res = await app.request("/v1/wallet", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.availableCredits).toBe(70);
    expect(body.reservedCredits).toBe(30);
  });

  it("rejects request when Authorization header is missing", async () => {
    const { app } = await setupTestEnv();

    const res = await app.request("/v1/wallet", {
      method: "GET"
    });

    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.error).toBe("Missing or invalid authorization header");
  });

  it("rejects request when Authorization header does not use Bearer scheme", async () => {
    const { token, app } = await setupTestEnv();

    const res = await app.request("/v1/wallet", {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`
      }
    });

    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.error).toBe("Missing or invalid authorization header");
  });

  it("rejects request when token is invalid or expired", async () => {
    const { app } = await setupTestEnv();

    const res = await app.request("/v1/wallet", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid.jwt.token"
      }
    });

    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.error).toBe("Invalid or expired session token");
  });

  it("returns 401 when wallet does not exist for session user", async () => {
    const { authService, ledger } = await setupTestEnv();
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";

    const tokenNoWallet = await authService.issueAuthorizationCode({
      userId: "usr_no_wallet",
      email: "nowallet@example.com",
      projectId: "proj_wallet_1",
      codeChallenge: verifier
    }).then(code => authService.exchangeCodeForSession({
      projectId: "proj_wallet_1",
      code,
      codeVerifier: verifier
    })).then(res => res.sessionToken);

    // Remove seeded welcome wallet to simulate missing wallet
    const db = (ledger as any).db;
    db.wallets.delete("usr_no_wallet");

    const app = new Hono().route("/v1/wallet", createWalletRoutes(ledger, authService));

    const res = await app.request("/v1/wallet", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenNoWallet}`
      }
    });

    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.error).toBe("Wallet not found");
  });
});
