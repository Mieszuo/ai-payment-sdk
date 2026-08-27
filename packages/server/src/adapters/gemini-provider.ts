import { ModelProvider, FetchClient } from "./model-provider";
import { PlatformError, PlatformErrorCodes } from "@platform/shared";

export interface GeminiAdapterOptions {
  apiKey: string;
  fetchClient?: FetchClient;
}

export class GeminiAdapter implements ModelProvider {
  constructor(private options: GeminiAdapterOptions) {}

  async generate(params: {
    model: string;
    systemPrompt: string;
    prompt: string;
    maxTokens: number;
  }): Promise<{ text: string; costCents: number }> {
    const fetcher = this.options.fetchClient || fetch;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${this.options.apiKey}`;

    const res = await fetcher(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: params.maxTokens
        }
      })
    });

    if (!res.ok) {
      throw new PlatformError(PlatformErrorCodes.PROVIDER_ERROR, `Gemini API error (${res.status})`);
    }

    const data = (await res.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const promptTokens = data.usageMetadata?.promptTokenCount || 0;
    const candidateTokens = data.usageMetadata?.candidatesTokenCount || 0;

    const costDollars = promptTokens * 0.000000075 + candidateTokens * 0.0000003;
    const costCents = Math.max(0.01, Number((costDollars * 100).toFixed(4)));

    return { text, costCents };
  }
}
