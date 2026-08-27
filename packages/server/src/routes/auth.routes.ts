import { Hono } from "hono";
import { TokenExchangeRequestSchema, PKCEChallengeRequestSchema } from "@platform/shared";
import { AuthService } from "../services/auth.service";

export function createAuthRoutes(authService: AuthService) {
  const router = new Hono();

  router.post("/authorize", async (c) => {
    const body = await c.req.json();
    const parsed = PKCEChallengeRequestSchema.parse(body);
    const redirectParam = parsed.redirectUri ? `&redirect_uri=${encodeURIComponent(parsed.redirectUri)}` : "";
    const authUrl = `/oauth/authorize?project_id=${encodeURIComponent(parsed.projectId)}&code_challenge=${encodeURIComponent(parsed.codeChallenge)}${redirectParam}`;
    return c.json({
      authUrl,
      codeChallenge: parsed.codeChallenge
    });
  });

  router.post("/token", async (c) => {
    const body = await c.req.json();
    const parsed = TokenExchangeRequestSchema.parse(body);
    const result = await authService.exchangeCodeForSession(parsed);
    return c.json(result);
  });

  return router;
}
