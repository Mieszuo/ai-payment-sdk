import * as jose from "jose";
import { PlatformError, PlatformErrorCodes, UserSessionToken, UserSessionTokenSchema } from "@platform/shared";
import { InMemoryDatabase } from "../adapters/in-memory-db";

export class AuthService {
  private codes = new Map<string, { userId: string; email: string; projectId: string; codeChallenge: string; expiresAt: number }>();
  private secret: Uint8Array;

  constructor(private db: InMemoryDatabase, secretString: string) {
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

    this.codes.delete(params.code);

    let welcomeBonusGranted = false;
    let wallet = this.db.wallets.get(entry.userId);
    if (!wallet) {
      // First time user: seed wallet with 20 credits
      this.db.seedWallet(entry.userId, 20);
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
