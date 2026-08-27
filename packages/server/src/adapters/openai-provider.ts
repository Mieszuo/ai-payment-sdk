import { ModelProvider, FetchClient } from "./model-provider";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export interface OpenAIAdapterOptions {
  apiKey: string;
  fetchClient?: FetchClient;
  baseUrl?: string;
}

export class OpenAIAdapter implements ModelProvider {
  constructor(private options: OpenAIAdapterOptions) {}

  async generate(params: {
    model: string;
    systemPrompt: string;
    prompt: string;
    maxTokens: number;
  }): Promise<{ text: string; costCents: number }> {
    const fetcher = this.options.fetchClient || fetch;
    const url = `${this.options.baseUrl || "https://api.openai.com/v1"}/chat/completions`;

    const res = await fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.prompt }
        ],
        max_tokens: params.maxTokens,
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, `OpenAI API error (${res.status})`);
    }

    const data = (await res.json()) as any;
    const text = data.choices?.[0]?.message?.content || "{}";
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    // Approximate cost: $0.15/1M input, $0.60/1M output for gpt-4o-mini
    const costDollars = promptTokens * 0.00000015 + completionTokens * 0.0000006;
    const costCents = Math.max(0.01, Number((costDollars * 100).toFixed(4)));

    return { text, costCents };
  }
}
