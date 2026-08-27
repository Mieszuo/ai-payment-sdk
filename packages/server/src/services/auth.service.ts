import * as jose from "jose";
import { PlatformError, PlatformErrorCodes, UserSessionToken } from "@platform/shared";
import { InMemoryDatabase } from "../adapters/in-memory-db";

export class AuthService {
  private codes = new Map<string, { userId: string; email: string; projectId: string; codeChallenge: string; expiresAt: number }>();
  private secret: Uint8Array;

  constructor(private db: InMemoryDatabase, secretString: string) {
    this.secret = new TextEncoder().encode(secretString);
  }

  async issueAuthorizationCode(params: { userId: string; email: string; projectId: string; codeChallenge: string }): Promise<string> {
    const code = `code_${crypto.randomUUID()}`;
    this.codes.set(code, {
      ...params,
      expiresAt: Date.now() + 60000 // 60s validity
    });
    return code;
  }

  async exchangeCodeForSession(params: { projectId: string; code: string; codeVerifier: string }) {
    const entry = this.codes.get(params.code);
    if (!entry || entry.projectId !== params.projectId || entry.expiresAt < Date.now()) {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired authorization code");
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
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        projectId: payload.projectId as string,
        exp: payload.exp as number
      };
    } catch {
      throw new PlatformError(PlatformErrorCodes.UNAUTHORIZED, "Invalid or expired session token");
    }
  }
}
