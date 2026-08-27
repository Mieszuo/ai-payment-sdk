import { z } from "zod";
import { PlatformError, PlatformErrorCodes } from "@ai-credits/shared";

export function parseUntrustedOutput<T>(raw: string, schema?: z.ZodType<T>): T {
  // Strip markdown code fences if present
  let clean = raw.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    throw new PlatformError(
      PlatformErrorCodes.UNTRUSTED_OUTPUT,
      "Failed to parse LLM response as JSON",
      { raw }
    );
  }

  if (schema) {
    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      throw new PlatformError(
        PlatformErrorCodes.UNTRUSTED_OUTPUT,
        "LLM output violated target schema",
        { errors: validation.error.format() }
      );
    }
    return validation.data;
  }

  return parsed as T;
}
