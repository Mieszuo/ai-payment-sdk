import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { AuthService } from "../src/services/auth.service";
import { createAuthRoutes } from "../src/routes/auth.routes";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

describe("PKCE Auth Routes", () => {
  it("exchanges valid code and verifier for signed session token and grants 20 welcome credits", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));

    // 1. Generate challenge
    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000001",
      email: "user@example.com",
      projectId: "proj_123",
      codeChallenge: verifier // plain for mock test
    });

    // 2. Exchange token
    const res = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_123",
        code,
        codeVerifier: verifier
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.sessionToken).toBeDefined();
    expect(body.user.email).toBe("user@example.com");
    expect(body.welcomeBonusGranted).toBe(true);

    const wallet = db.wallets.get("00000000-0000-0000-0000-000000000001");
    expect(wallet?.availableCredits).toBe(20);
  });

  it("does not grant welcome bonus if wallet already exists for returning user", async () => {
    const db = new InMemoryDatabase();
    // Existing user wallet with 50 credits
    db.seedWallet("00000000-0000-0000-0000-000000000002", 50);

    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000002",
      email: "returning@example.com",
      projectId: "proj_123",
      codeChallenge: verifier
    });

    const res = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_123",
        code,
        codeVerifier: verifier
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.welcomeBonusGranted).toBe(false);

    const wallet = db.wallets.get("00000000-0000-0000-0000-000000000002");
    expect(wallet?.availableCredits).toBe(50);
  });

  it("fails when reusing an authorization code (single-use)", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000003",
      email: "singleuse@example.com",
      projectId: "proj_123",
      codeChallenge: verifier
    });

    // First exchange succeeds
    const firstExchange = await authService.exchangeCodeForSession({
      projectId: "proj_123",
      code,
      codeVerifier: verifier
    });
    expect(firstExchange.sessionToken).toBeDefined();

    // Second exchange fails with UNAUTHORIZED
    expect(authService.exchangeCodeForSession({
      projectId: "proj_123",
      code,
      codeVerifier: verifier
    })).rejects.toThrow(PlatformError);
  });

  it("fails when exchanging with an invalid or mismatched projectId", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000004",
      email: "wrongproject@example.com",
      projectId: "proj_correct",
      codeChallenge: verifier
    });

    try {
      await authService.exchangeCodeForSession({
        projectId: "proj_wrong",
        code,
        codeVerifier: verifier
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.UNAUTHORIZED);
    }
  });

  it("fails when exchanging an expired authorization code", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000005",
      email: "expired@example.com",
      projectId: "proj_123",
      codeChallenge: verifier
    });

    // Artificially expire the code
    const internalCodes = (authService as any).codes;
    const entry = internalCodes.get(code);
    if (entry) {
      entry.expiresAt = Date.now() - 1000;
    }

    try {
      await authService.exchangeCodeForSession({
        projectId: "proj_123",
        code,
        codeVerifier: verifier
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.UNAUTHORIZED);
    }
  });

  it("verifies valid session token and rejects tampered/invalid token", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000006",
      email: "verify@example.com",
      projectId: "proj_verify",
      codeChallenge: verifier
    });

    const session = await authService.exchangeCodeForSession({
      projectId: "proj_verify",
      code,
      codeVerifier: verifier
    });

    const verified = await authService.verifySessionToken(session.sessionToken);
    expect(verified.userId).toBe("00000000-0000-0000-0000-000000000006");
    expect(verified.email).toBe("verify@example.com");
    expect(verified.projectId).toBe("proj_verify");
    expect(typeof verified.exp).toBe("number");

    // Tampered token fails
    const tampered = session.sessionToken.slice(0, -5) + "xxxxx";
    expect(authService.verifySessionToken(tampered)).rejects.toThrow(PlatformError);

    // Completely bogus token fails
    expect(authService.verifySessionToken("bogus.jwt.token")).rejects.toThrow(PlatformError);
  });

  it("handles /v1/auth/authorize route and returns authUrl and codeChallenge", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));

    const challenge = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const res = await app.request("/v1/auth/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_123",
        codeChallenge: challenge,
        redirectUri: "https://example.com/callback"
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.authUrl).toContain("proj_123");
    expect(body.authUrl).toContain(challenge);
    expect(body.authUrl).toContain("redirect_uri=");
    expect(body.codeChallenge).toBe(challenge);
  });
});
