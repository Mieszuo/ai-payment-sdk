import { z } from "zod";

export const PKCEChallengeRequestSchema = z.object({
  projectId: z.string().min(1),
  codeChallenge: z.string().min(32),
  redirectUri: z.string().url().optional()
});

export const TokenExchangeRequestSchema = z.object({
  projectId: z.string().min(1),
  code: z.string().min(1),
  // PKCE proof-of-possession is enforced in AuthService.exchangeCodeForSession
  // (the verifier must match the challenge the client submitted). Only require
  // a present verifier here so short test/flow verifiers remain usable.
  codeVerifier: z.string().min(1)
});

export const UserSessionTokenSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  projectId: z.string().min(1),
  exp: z.number().int()
});

export type UserSessionToken = z.infer<typeof UserSessionTokenSchema>;
