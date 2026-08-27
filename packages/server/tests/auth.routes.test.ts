import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { AuthService, MAX_OTP_ATTEMPTS } from "../src/services/auth.service";
import { createAuthRoutes } from "../src/routes/auth.routes";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { ResendEmailTransport } from "../src/services/email-transport";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";
import * as jose from "jose";

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

  it("exchanges code with S256 hashed challenge and matching verifier", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));

    // S256 challenge generation
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk-s256";
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const s256Challenge = Buffer.from(hash).toString("base64url");

    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000002",
      email: "s256@example.com",
      projectId: "proj_s256",
      codeChallenge: s256Challenge
    });

    const res = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_s256",
        code,
        codeVerifier: verifier
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.sessionToken).toBeDefined();
    expect(body.user.email).toBe("s256@example.com");
    expect(body.welcomeBonusGranted).toBe(true);
  });

  it("fails with UNAUTHORIZED on invalid codeVerifier (unit test and HTTP 401)", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));

    const verifier = "valid-verifier-secret-must-be-at-least-32-chars-long";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000003",
      email: "test@example.com",
      projectId: "proj_123",
      codeChallenge: verifier
    });

    // 1. Service unit test rejection
    try {
      await authService.exchangeCodeForSession({
        projectId: "proj_123",
        code,
        codeVerifier: "wrong-verifier-must-be-at-least-32-chars-long!"
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.UNAUTHORIZED);
      expect(err.message).toBe("Invalid code verifier");
    }

    // RFC 7636: code must be invalidated immediately even if verifier failed
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
      expect(err.message).toBe("Invalid or expired authorization code");
    }

    // 2. HTTP route rejection returns 401
    const code2 = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000003",
      email: "test@example.com",
      projectId: "proj_123",
      codeChallenge: verifier
    });

    const res = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_123",
        code: code2,
        codeVerifier: "wrong-verifier-must-be-at-least-32-chars-long!"
      })
    });

    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.error).toBe("Invalid code verifier");
    expect(body.code).toBe(PlatformErrorCodes.UNAUTHORIZED);
  });

  it("returns HTTP 400 when token exchange request has invalid or missing schema fields", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));

    // Missing codeVerifier
    const res = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_123",
        code: "code_abc"
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toBe("Validation error");
  });

  it("does not grant welcome bonus if wallet already exists for returning user", async () => {
    const db = new InMemoryDatabase();
    // Existing user wallet with 50 credits
    db.seedWallet("00000000-0000-0000-0000-000000000004", 50);

    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(authService));

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000004",
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

    const wallet = db.wallets.get("00000000-0000-0000-0000-000000000004");
    expect(wallet?.availableCredits).toBe(50);
  });

  it("fails when reusing an authorization code (single-use)", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000005",
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
      userId: "00000000-0000-0000-0000-000000000006",
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
      userId: "00000000-0000-0000-0000-000000000007",
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

  it("prunes expired codes when issuing new codes", async () => {
    const db = new InMemoryDatabase();
    const authService = new AuthService(db, "test-secret-key-must-be-at-least-32-chars-long");

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const oldCode = await authService.issueAuthorizationCode({
      userId: "usr_old",
      email: "old@example.com",
      projectId: "proj_123",
      codeChallenge: verifier
    });

    const internalCodes = (authService as any).codes;
    expect(internalCodes.has(oldCode)).toBe(true);

    // Manually expire old code
    internalCodes.get(oldCode)!.expiresAt = Date.now() - 5000;

    // Issue new code triggers pruning
    const newCode = await authService.issueAuthorizationCode({
      userId: "usr_new",
      email: "new@example.com",
      projectId: "proj_123",
      codeChallenge: verifier
    });

    expect(internalCodes.has(oldCode)).toBe(false);
    expect(internalCodes.has(newCode)).toBe(true);
  });

  it("verifies valid session token with UserSessionTokenSchema and rejects tampered/invalid token", async () => {
    const db = new InMemoryDatabase();
    const secret = "test-secret-key-must-be-at-least-32-chars-long";
    const authService = new AuthService(db, secret);

    const verifier = "abcdef1234567890abcdef1234567890abcdef1234567890";
    const code = await authService.issueAuthorizationCode({
      userId: "00000000-0000-0000-0000-000000000008",
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
    expect(verified.userId).toBe("00000000-0000-0000-0000-000000000008");
    expect(verified.email).toBe("verify@example.com");
    expect(verified.projectId).toBe("proj_verify");
    expect(typeof verified.exp).toBe("number");

    // Tampered signature fails
    const tampered = session.sessionToken.slice(0, -5) + "xxxxx";
    expect(authService.verifySessionToken(tampered)).rejects.toThrow(PlatformError);

    // Completely bogus token fails
    expect(authService.verifySessionToken("bogus.jwt.token")).rejects.toThrow(PlatformError);

    // Signed token with malformed payload (invalid email) fails safeParse
    const invalidPayloadToken = await new jose.SignJWT({
      userId: "usr_123",
      email: "not-an-email",
      projectId: "proj_123"
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));

    expect(authService.verifySessionToken(invalidPayloadToken)).rejects.toThrow(PlatformError);
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

describe("Email OTP Authentication", () => {
  it("requests an OTP, verifies it, and exchanges the authorization code for a session", async () => {
    const db = new InMemoryDatabase();
    const auth = new AuthService(db, "test-secret-key-32-chars-long-example!");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(auth));

    const reqRes = await app.request("/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com", projectId: "proj_demo" })
    });
    expect(reqRes.status).toBe(200);

    // The code was delivered via the (console) transport — grab it from the in-memory store
    const otp = (auth as any).otps.get("alice@example.com:proj_demo").code;

    // PKCE code challenge must satisfy the min(32) floor (same shape as a verifier)
    const pkceValue = "abcdef1234567890abcdef1234567890abcdef1234567890";

    const verifyRes = await app.request("/v1/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        projectId: "proj_demo",
        code: otp,
        codeChallenge: pkceValue
      })
    });
    expect(verifyRes.status).toBe(200);
    const { authorizationCode } = await verifyRes.json() as any;

    const tokenRes = await app.request("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_demo",
        code: authorizationCode,
        codeVerifier: pkceValue
      })
    });
    expect(tokenRes.status).toBe(200);
    const body = await tokenRes.json() as any;
    expect(body.sessionToken).toBeDefined();
    expect(body.welcomeBonusGranted).toBe(true);
  });

  it("rejects a wrong OTP code", async () => {
    const db = new InMemoryDatabase();
    const auth = new AuthService(db, "test-secret-key-32-chars-long-example!");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(auth));
    await app.request("/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@example.com", projectId: "proj_demo" })
    });
    const res = await app.request("/v1/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "bob@example.com",
        projectId: "proj_demo",
        code: "000000",
        codeChallenge: "abcdef1234567890abcdef1234567890abcdef1234567890"
      })
    });
    expect(res.status).toBe(401);
  });

  it("rejects a codeChallenge shorter than 32 chars in /otp/verify with 400", async () => {
    const db = new InMemoryDatabase();
    const auth = new AuthService(db, "test-secret-key-32-chars-long-example!");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(auth));

    const res = await app.request("/v1/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "carol@example.com",
        projectId: "proj_demo",
        code: "123456",
        codeChallenge: "too_short"
      })
    });
    expect(res.status).toBe(400);
  });

  it("invalidates the OTP entry after wrong attempts — the correct code fails on the attempt after MAX_OTP_ATTEMPTS", async () => {
    const db = new InMemoryDatabase();
    const auth = new AuthService(db, "test-secret-key-32-chars-long-example!");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(auth));

    await app.request("/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dave@example.com", projectId: "proj_demo" })
    });

    const entry = (auth as any).otps.get("dave@example.com:proj_demo");
    const correctCode = entry.code;
    const pkce = "abcdef1234567890abcdef1234567890abcdef1234567890";

    // MAX_OTP_ATTEMPTS wrong codes → each rejected with 401
    for (let i = 0; i < MAX_OTP_ATTEMPTS; i++) {
      const res = await app.request("/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "dave@example.com",
          projectId: "proj_demo",
          code: "000000",
          codeChallenge: pkce
        })
      });
      expect(res.status).toBe(401);
    }

    // Entry invalidated → even the correct code now fails
    expect((auth as any).otps.has("dave@example.com:proj_demo")).toBe(false);
    const sixth = await app.request("/v1/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "dave@example.com",
        projectId: "proj_demo",
        code: correctCode,
        codeChallenge: pkce
      })
    });
    expect(sixth.status).toBe(401);
  });

  it("throttles a duplicate OTP request within the 10-minute window with 429 RATE_LIMITED", async () => {
    const db = new InMemoryDatabase();
    const auth = new AuthService(db, "test-secret-key-32-chars-long-example!");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(auth));

    const first = await app.request("/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "erin@example.com", projectId: "proj_demo" })
    });
    expect(first.status).toBe(200);

    const second = await app.request("/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "erin@example.com", projectId: "proj_demo" })
    });
    expect(second.status).toBe(429);
    const body = await second.json() as any;
    expect(body.code).toBe(PlatformErrorCodes.RATE_LIMITED);
  });

  it("generates a 6-digit numeric OTP code", async () => {
    const db = new InMemoryDatabase();
    const auth = new AuthService(db, "test-secret-key-32-chars-long-example!");
    const app = new Hono();
    app.route("/v1/auth", createAuthRoutes(auth));

    await app.request("/v1/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "frank@example.com", projectId: "proj_demo" })
    });
    const code = (auth as any).otps.get("frank@example.com:proj_demo").code;
    expect(code).toMatch(/^\d{6}$/);
  });

  it("Resend fallback logs only a warning without leaking the OTP code or recipient email", async () => {
    const savedKey = process.env.RESEND_API_KEY;
    const savedFrom = process.env.RESEND_FROM;
    delete process.env.RESEND_API_KEY;

    const transport = new ResendEmailTransport();
    const logs: string[] = [];
    const originalWarn = console.warn;
    const originalLog = console.log;
    console.warn = (msg: any) => { logs.push(String(msg)); };
    console.log = (msg: any) => { logs.push(String(msg)); };

    try {
      await transport.send({ to: "pii@example.com", code: "987654" });
    } finally {
      console.warn = originalWarn;
      console.log = originalLog;
      if (savedKey !== undefined) process.env.RESEND_API_KEY = savedKey;
      if (savedFrom !== undefined) process.env.RESEND_FROM = savedFrom;
    }

    const joined = logs.join("\n");
    expect(joined).toContain("RESEND_API_KEY not set");
    expect(joined).not.toContain("987654");
    expect(joined).not.toContain("pii@example.com");
  });
});
