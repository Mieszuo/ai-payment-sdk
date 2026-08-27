export interface AIClientConfig {
  project: string;
  baseUrl?: string;
  mock?: boolean;
  headless?: boolean;
  theme?: "auto" | "light" | "dark";
}

export class AIClient {
  private sessionToken: string | null = null;

  constructor(private config: AIClientConfig) {
    this.config.baseUrl = config.baseUrl || "https://api.example.com";
  }

  setSessionToken(token: string): void {
    this.sessionToken = token;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  async getWallet(): Promise<{ availableCredits: number }> {
    if (this.config.mock) {
      return { availableCredits: 999 };
    }

    const res = await fetch(`${this.config.baseUrl}/v1/wallet`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.sessionToken || ""}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch wallet");
    }

    return await res.json();
  }

  async action<TInput = any, TOutput = any>(
    actionName: string,
    options: { inputs: TInput; signal?: AbortSignal }
  ): Promise<{ output: TOutput; creditsUsed: number; remainingBalance: number }> {
    if (this.config.mock) {
      return {
        output: { mock: true, message: `Mock execution for ${actionName}` } as unknown as TOutput,
        creditsUsed: 0,
        remainingBalance: 999
      };
    }

    const res = await fetch(`${this.config.baseUrl}/v1/actions/${actionName}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.sessionToken || ""}`
      },
      body: JSON.stringify({
        projectId: this.config.project,
        inputs: options.inputs
      }),
      signal: options.signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to execute action");
    }

    return await res.json();
  }
}

export function createAI(config: AIClientConfig): AIClient {
  return new AIClient(config);
}
