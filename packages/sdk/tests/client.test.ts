import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createAI, generatePKCE, AIClient } from "../src";

describe("Client SDK", () => {
  it("supports mock mode for zero-cost local development", async () => {
    const ai = createAI({
      project: "pk_test_123",
      mock: true
    });

    const result = await ai.action("optimize-resume", {
      inputs: { cvText: "Senior developer CV content..." }
    });

    expect(result.creditsUsed).toBe(0);
    expect(result.output).toBeDefined();
    expect(result.output).toEqual({
      mock: true,
      message: "Mock execution for optimize-resume"
    });
    expect(result.remainingBalance).toBe(999);
  });

  it("generates valid PKCE verifier (>=32 chars) and S256 challenge", async () => {
    const { verifier, challenge } = await generatePKCE();
    expect(verifier.length).toBeGreaterThanOrEqual(32);
    expect(challenge.length).toBeGreaterThan(0);
    expect(challenge).not.toContain("+");
    expect(challenge).not.toContain("/");
    expect(challenge).not.toContain("=");

    // Verify S256 cryptographic match
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const expectedChallenge = Buffer.from(hash).toString("base64url");
    expect(challenge).toBe(expectedChallenge);
  });

  it("supports mock mode for getWallet()", async () => {
    const ai = createAI({
      project: "pk_test_123",
      mock: true
    });

    const wallet = await ai.getWallet();
    expect(wallet.availableCredits).toBe(999);
  });

  it("manages session token", () => {
    const ai = createAI({ project: "pk_test_123" });
    expect(ai.getSessionToken()).toBeNull();

    ai.setSessionToken("mock_jwt_token");
    expect(ai.getSessionToken()).toBe("mock_jwt_token");
  });

  describe("HTTP API calls", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("calls execution endpoint with authorization and payload", async () => {
      let requestedUrl = "";
      let requestedOptions: any = null;

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        requestedUrl = url.toString();
        requestedOptions = init;
        return new Response(JSON.stringify({
          output: { result: "resume optimized" },
          creditsUsed: 5,
          remainingBalance: 45
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }) as any;

      const ai = createAI({
        project: "pk_live_456",
        baseUrl: "https://custom.api.com"
      });
      ai.setSessionToken("user_session_abc");

      const res = await ai.action("optimize-resume", {
        inputs: { text: "CV" }
      });

      expect(requestedUrl).toBe("https://custom.api.com/v1/actions/optimize-resume/execute");
      expect(requestedOptions.method).toBe("POST");
      expect(requestedOptions.headers["Authorization"]).toBe("Bearer user_session_abc");
      expect(requestedOptions.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(requestedOptions.body)).toEqual({
        projectId: "pk_live_456",
        inputs: { text: "CV" }
      });

      expect(res.creditsUsed).toBe(5);
      expect(res.remainingBalance).toBe(45);
      expect(res.output).toEqual({ result: "resume optimized" });
    });

    it("throws error when action execution fails with error response", async () => {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ message: "Insufficient credits" }), {
          status: 402,
          headers: { "Content-Type": "application/json" }
        });
      }) as any;

      const ai = createAI({ project: "pk_test" });
      await expect(ai.action("test", { inputs: {} })).rejects.toThrow("Insufficient credits");
    });

    it("throws fallback error when error response is empty or non-JSON", async () => {
      globalThis.fetch = (async () => {
        return new Response("Internal Server Error", { status: 500 });
      }) as any;

      const ai = createAI({ project: "pk_test" });
      await expect(ai.action("test", { inputs: {} })).rejects.toThrow("Failed to execute action");
    });

    it("passes AbortSignal to action fetch", async () => {
      let passedSignal: AbortSignal | undefined;

      globalThis.fetch = (async (_url: any, init?: RequestInit) => {
        passedSignal = init?.signal as AbortSignal;
        return new Response(JSON.stringify({ output: {}, creditsUsed: 0, remainingBalance: 100 }));
      }) as any;

      const controller = new AbortController();
      const ai = createAI({ project: "pk_test" });
      await ai.action("test", { inputs: {}, signal: controller.signal });

      expect(passedSignal).toBe(controller.signal);
    });

    it("fetches wallet successfully", async () => {
      let requestedUrl = "";
      let authHeader = "";

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        requestedUrl = url.toString();
        authHeader = (init?.headers as any)?.["Authorization"] || "";
        return new Response(JSON.stringify({ availableCredits: 120 }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }) as any;

      const ai = createAI({ project: "pk_test" });
      ai.setSessionToken("my_token");

      const wallet = await ai.getWallet();
      expect(requestedUrl).toBe("https://api.example.com/v1/wallet");
      expect(authHeader).toBe("Bearer my_token");
      expect(wallet.availableCredits).toBe(120);
    });

    it("throws error when wallet fetch fails", async () => {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ message: "Unauthorized wallet access" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }) as any;

      const ai = createAI({ project: "pk_test" });
      await expect(ai.getWallet()).rejects.toThrow("Unauthorized wallet access");
    });

    it("sanitizes baseUrl by stripping trailing slashes", async () => {
      let requestedUrl = "";
      globalThis.fetch = (async (url: string | URL | Request) => {
        requestedUrl = url.toString();
        return new Response(JSON.stringify({ availableCredits: 50 }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }) as any;

      const ai = createAI({
        project: "pk_test",
        baseUrl: "https://api.example.com///"
      });

      await ai.getWallet();
      expect(requestedUrl).toBe("https://api.example.com/v1/wallet");
    });

    it("extracts err.error when action execution fails with server error response", async () => {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ error: "Token not valid for this project", code: "UNAUTHORIZED" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }) as any;

      const ai = createAI({ project: "pk_test" });
      await expect(ai.action("test", { inputs: {} })).rejects.toThrow("Token not valid for this project");
    });

    it("extracts err.error when wallet fetch fails with server error response", async () => {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }) as any;

      const ai = createAI({ project: "pk_test" });
      await expect(ai.getWallet()).rejects.toThrow("Missing or invalid authorization header");
    });
  });
});
