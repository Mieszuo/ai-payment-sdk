import * as jose from "jose";
import { PlatformError, PlatformErrorCodes, UserSessionToken, UserSessionTokenSchema } from "@platform/shared";
import { LedgerDatabase } from "../adapters/database";

export class AuthService {
  private codes = new Map<string, { userId: string; email: string; projectId: string; codeChallenge: string; expiresAt: number }>();
  private secret: Uint8Array;

  constructor(private db: LedgerDatabase, secretString: string) {
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

  async issueAuthorizationCode(params: { userId: string; email: string; projectId: string; codeChallenge: string }): Promise<string> {
    this.pruneExpiredCodes();

    const code = `code_${crypto.randomUUID()}`;
    this.codes.set(code, {
      ...params,
      expiresAt: Date.now() + 60000 // 60s validity
    });
    return code;
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
