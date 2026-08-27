/**
 * Extracts unique mustache template variables like {{cvText}} from a prompt template string.
 */
export function extractTemplateVariables(template: string): string[] {
  if (!template) return [];
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const variables: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    const varName = match[1];
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Calculates platform gross margin percentage based on credit pricing and maximum provider cost.
 * Assumption: 1 credit = $0.01 standard credit revenue benchmark.
 */
export function calculateMargin(priceCredits: number, maxProviderCostCents: number): number {
  if (!priceCredits || priceCredits <= 0) return 0;
  const revenueCents = priceCredits; // 1 credit = 1 cent ($0.01)
  const marginFraction = (revenueCents - maxProviderCostCents) / revenueCents;
  return Math.round(marginFraction * 100);
}

export interface ModelPricing {
  id: string;
  name: string;
  provider: "OpenAI" | "Google";
  inputPerMillion: number;
  outputPerMillion: number;
  contextWindow: string;
}

export const SUPPORTED_MODELS: ModelPricing[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    inputPerMillion: 0.15,
    outputPerMillion: 0.60,
    contextWindow: "128k"
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    contextWindow: "1M"
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    inputPerMillion: 2.50,
    outputPerMillion: 10.00,
    contextWindow: "128k"
  }
];
