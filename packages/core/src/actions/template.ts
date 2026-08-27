import { PlatformError, PlatformErrorCodes } from "@ai-credits/shared";

export function renderPromptTemplate(template: string, inputs: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in inputs) || inputs[key] === undefined || inputs[key] === null) {
      throw new PlatformError(
        PlatformErrorCodes.INVALID_INPUT,
        `Missing required prompt template input: "${key}"`
      );
    }
    // Sanitize string value to prevent basic delimiter breakout
    const rawVal = String(inputs[key]);
    return rawVal.replace(/<\/?user_input>/gi, "");
  });
}
