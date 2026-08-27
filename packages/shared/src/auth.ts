import { z } from "zod";

export const PKCEChallengeRequestSchema = z.object({
  projectId: z.string().min(1),
  codeChallenge: z.string().min(32),
  redirectUri: z.string().url().optional()
});

export const TokenExchangeRequestSchema = z.object({
  projectId: z.string().min(1),
  code: z.string().min(1),
  codeVerifier: z.string().min(32)
});

export const UserSessionTokenSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  projectId: z.string().min(1),
  exp: z.number().int()
});

export type UserSessionToken = z.infer<typeof UserSessionTokenSchema>;
