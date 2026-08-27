import { z } from "zod";

export const ActionVersionSchema = z.object({
  actionName: z.string().min(1),
  version: z.number().int().positive(),
  projectId: z.string().min(1),
  model: z.string().min(1),
  fallbackModel: z.string().optional(),
  priceCredits: z.number().int().positive(),
  maxProviderCostCents: z.number().positive(),
  maxOutputTokens: z.number().int().positive().default(2000),
  outputFormat: z.enum(["text", "json"]).default("text"),
  systemPrompt: z.string().min(1),
  userPromptTemplate: z.string().min(1),
  inputSchema: z.record(z.unknown()), // JSON schema or Zod object definition
  outputSchema: z.record(z.unknown()).optional(),
  rateLimit: z.object({
    maxRequests: z.number().int().positive().default(10),
    windowSeconds: z.number().int().positive().default(3600)
  }).default({ maxRequests: 10, windowSeconds: 3600 })
});

export type ActionVersion = z.infer<typeof ActionVersionSchema>;
