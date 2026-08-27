export type FetchClient = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface ModelProvider {
  generate(params: {
    model: string;
    systemPrompt: string;
    prompt: string;
    maxTokens: number;
  }): Promise<{ text: string; costCents: number }>;
}

export class MockModelProvider implements ModelProvider {
  private response = "{}";
  private costCents = 0.5;

  setResponse(resp: string) {
    this.response = resp;
  }

  setCostCents(cost: number) {
    this.costCents = cost;
  }

  async generate(_params?: {
    model: string;
    systemPrompt: string;
    prompt: string;
    maxTokens: number;
  }): Promise<{ text: string; costCents: number }> {
    return { text: this.response, costCents: this.costCents };
  }
}
