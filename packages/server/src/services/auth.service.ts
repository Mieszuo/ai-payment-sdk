import crypto from "node:crypto";
import * as jose from "jose";
import { PlatformError, PlatformErrorCodes, UserSessionToken, UserSessionTokenSchema } from "@platform/shared";
import { LedgerDatabase } from "../adapters/database";
import { ConsoleEmailTransport, type EmailTransport } from "./email-transport";

/** Max wrong OTP attempts before the code is invalidated (a new one is required). */
export const MAX_OTP_ATTEMPTS = 5;

export class AuthService {
  private codes = new Map<string, { userId: string; email: string; projectId: string; codeChallenge: string; expiresAt: number }>();
  private otps = new Map<string, { code: string; expiresAt: number; attempts: number }>();
  private secret: Uint8Array;

  constructor(
    private db: LedgerDatabase,
    secretString: string,
    private emailTransport: EmailTransport = new ConsoleEmailTransport()
  ) {
    this.secret = new TextEncoder().encode(secretString);
  }

  private pruneExpiredCodes() {
    const now = Date.now();
    for (const [code, entry] of this.codes.entries()) {
      if (entry.expiresAt < now) {
        this.codes.delete(code);
      }
    }
  }

  private pruneExpiredOtps() {
    const now = Date.now();
    for (const [key, entry] of this.otps.entries()) {
      if (entry.expiresAt < now) {
        this.otps.delete(key);
      }
    }
  }

  async issueAuthorizationCode(params: { userId: string; email: string; projectId: string; codeChallenge: string }): Promise<string> {
    this.pruneExpiredCodes();

    const code = `code_${crypto.randomUUID()}`;
    this.codes.set(code, {
      ...params,
      expiresAt: Date.now() + 60000 // 60s validity
    });
    return code;
  }

  async requestOtp(params: { email: string; projectId: string }): Promise<{ expiresInSeconds: number }> {
    this.pruneExpiredOtps();

    // Throttle: one unexpired code per email:projectId (10-minute window).
    // A fresh code already in flight rejects the request instead of mailing again.
    const key = `${params.email}:${params.projectId}`;
    const existing = this.otps.get(key);
    if (existing && existing.expiresAt >= Date.now()) {
      throw new PlatformError(
        PlatformErrorCodes.RATE_LIMITED,
        "An OTP was already requested for this email — try again later"
      );
    }

    const code = String(crypto.randomInt(100000, 1000000));
    this.otps.set(key, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });
    await this.emailTransport.send({ to: params.email, code });
    return { expiresInSeconds: 600 };
  }

  async verifyOtp(params: {
    email: string;
    code: string;
    projectId: string;
    codeChallenge: string;
  }): Promise<{ authorizationCode: string }> {
    this.pruneExpiredOtps();

    const key = `${params.email}:${params.projectId}`;
    const entry = this.otps.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired OTP code");
    }

    // Constant-time comparison — never short-circuits on code content.
    const expected = Buffer.from(entry.code);
    const actual = Buffer.from(params.code);
    const matches = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

    if (!matches) {
      entry.attempts += 1;
      if (entry.attempts >= MAX_OTP_ATTEMPTS) {
        // Too many wrong guesses — invalidate the entry, a new code is required.
        this.otps.delete(key);
      }
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired OTP code");
    }

    this.otps.delete(key);
    const authorizationCode = await this.issueAuthorizationCode({
      userId: `usr_${params.email.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`,
      email: params.email,
      projectId: params.projectId,
      codeChallenge: params.codeChallenge
    });
    return { authorizationCode };
  }

  async exchangeCodeForSession(params: { projectId: string; code: string; codeVerifier: string }) {
    this.pruneExpiredCodes();

    const entry = this.codes.get(params.code);
    this.codes.delete(params.code);
    if (!entry || entry.projectId !== params.projectId || entry.expiresAt < Date.now()) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired authorization code");
    }

    // Verify PKCE codeVerifier against codeChallenge (supports plain and S256)
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(params.codeVerifier));
    const s256Challenge = Buffer.from(hash).toString("base64url");
    const matches = params.codeVerifier === entry.codeChallenge || s256Challenge === entry.codeChallenge;
    if (!matches) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid code verifier");
    }

    let welcomeBonusGranted = false;
    const wallet = this.db.wallets.get(entry.userId);
    if (!wallet) {
      // First time user: grant the 20-credit welcome bonus via a balanced
      // ledger transaction (idempotent per user via the bonus_${userId} key).
      await this.db.applyCredit(entry.userId, 20, "BONUS", `bonus_${entry.userId}`, "welcome");
      welcomeBonusGranted = true;
    }

    const token = await new jose.SignJWT({
      userId: entry.userId,
      email: entry.email,
      projectId: entry.projectId
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(this.secret);

    return {
      sessionToken: token,
      user: { id: entry.userId, email: entry.email },
      welcomeBonusGranted
    };
  }

  async verifySessionToken(token: string): Promise<UserSessionToken> {
    try {
      const { payload } = await jose.jwtVerify(token, this.secret);
      const parsed = UserSessionTokenSchema.safeParse({
        userId: payload.userId,
        email: payload.email,
        projectId: payload.projectId,
        exp: payload.exp
      });
      if (!parsed.success) {
        throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid session token payload", parsed.error);
      }
      return parsed.data;
    } catch (err) {
      if (err instanceof PlatformError) throw err;
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired session token");
    }
  }
}
