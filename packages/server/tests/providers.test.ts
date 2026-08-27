import { describe, it, expect } from "bun:test";
import { OpenAIAdapter } from "../src/adapters/openai-provider";
import { GeminiAdapter } from "../src/adapters/gemini-provider";
import { PlatformError, PlatformErrorCodes } from "@ai-credits/shared";

describe("Real LLM Provider Adapters", () => {
  it("formats OpenAI request payload with json_object format and parses usage cost", async () => {
    let capturedUrl: string | undefined;
    let capturedHeaders: Record<string, string> | undefined;

    const adapter = new OpenAIAdapter({
      apiKey: "mock-key",
      fetchClient: async (url, init) => {
        capturedUrl = url.toString();
        capturedHeaders = init?.headers as Record<string, string>;
        const body = JSON.parse(init?.body as string);
        expect(body.model).toBe("gpt-4o-mini");
        expect(body.response_format.type).toBe("json_object");
        expect(body.messages).toHaveLength(2);
        expect(body.messages[0]).toEqual({ role: "system", content: "System" });
        expect(body.messages[1]).toEqual({ role: "user", content: "User text" });
        expect(body.max_tokens).toBe(500);

        return new Response(JSON.stringify({
          choices: [{ message: { content: '{"score": 95}' } }],
          usage: { prompt_tokens: 100, completion_tokens: 50 }
        }), { status: 200 });
      }
    });

    const res = await adapter.generate({
      model: "gpt-4o-mini",
      systemPrompt: "System",
      prompt: "User text",
      maxTokens: 500
    });

    expect(capturedUrl).toBe("https://api.openai.com/v1/chat/completions");
    expect(capturedHeaders?.["Authorization"]).toBe("Bearer mock-key");
    expect(capturedHeaders?.["Content-Type"]).toBe("application/json");
    expect(res.text).toBe('{"score": 95}');
    expect(res.costCents).toBeGreaterThan(0);
  });

  it("throws PlatformError when OpenAI returns a non-200 response", async () => {
    const adapter = new OpenAIAdapter({
      apiKey: "mock-key",
      fetchClient: async () => {
        return new Response("Unauthorized", { status: 401 });
      }
    });

    expect(adapter.generate({
      model: "gpt-4o-mini",
      systemPrompt: "System",
      prompt: "User text",
      maxTokens: 500
    })).rejects.toThrow(PlatformError);

    try {
      await adapter.generate({
        model: "gpt-4o-mini",
        systemPrompt: "System",
        prompt: "User text",
        maxTokens: 500
      });
    } catch (err) {
      expect(err).toBeInstanceOf(PlatformError);
      expect((err as PlatformError).code).toBe(PlatformErrorCodes.PROVIDER_ERROR);
      expect((err as PlatformError).message).toContain("401");
    }
  });

  it("supports custom baseUrl for OpenAI", async () => {
    let capturedUrl: string | undefined;
    const adapter = new OpenAIAdapter({
      apiKey: "mock-key",
      baseUrl: "https://custom-openai-proxy.local/v1",
      fetchClient: async (url) => {
        capturedUrl = url.toString();
        return new Response(JSON.stringify({
          choices: [{ message: { content: '{"status": "ok"}' } }],
          usage: { prompt_tokens: 10, completion_tokens: 10 }
        }), { status: 200 });
      }
    });

    const res = await adapter.generate({
      model: "gpt-4o-mini",
      systemPrompt: "System",
      prompt: "User text",
      maxTokens: 100
    });

    expect(capturedUrl).toBe("https://custom-openai-proxy.local/v1/chat/completions");
    expect(res.text).toBe('{"status": "ok"}');
  });

  it("formats Gemini request payload with application/json mimeType and parses usage", async () => {
    let capturedUrl: string | undefined;
    const adapter = new GeminiAdapter({
      apiKey: "mock-gemini-key",
      fetchClient: async (url, init) => {
        capturedUrl = url.toString();
        const body = JSON.parse(init?.body as string);
        expect(body.generationConfig.responseMimeType).toBe("application/json");
        expect(body.generationConfig.maxOutputTokens).toBe(500);
        expect(body.systemInstruction).toEqual({ parts: [{ text: "System" }] });
        expect(body.contents).toEqual([{ role: "user", parts: [{ text: "User text" }] }]);

        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"analysis": "Strong"}' }] } }],
          usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 60 }
        }), { status: 200 });
      }
    });

    const res = await adapter.generate({
      model: "gemini-1.5-flash",
      systemPrompt: "System",
      prompt: "User text",
      maxTokens: 500
    });

    expect(capturedUrl).toContain("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=mock-gemini-key");
    expect(res.text).toBe('{"analysis": "Strong"}');
    expect(res.costCents).toBeGreaterThan(0);
  });

  it("throws PlatformError when Gemini returns a non-200 response", async () => {
    const adapter = new GeminiAdapter({
      apiKey: "mock-gemini-key",
      fetchClient: async () => {
        return new Response("Bad Request", { status: 400 });
      }
    });

    try {
      await adapter.generate({
        model: "gemini-1.5-flash",
        systemPrompt: "System",
        prompt: "User text",
        maxTokens: 500
      });
      expect().fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PlatformError);
      expect((err as PlatformError).code).toBe(PlatformErrorCodes.PROVIDER_ERROR);
      expect((err as PlatformError).message).toContain("400");
    }
  });

  it("re-exports OpenAIAdapter and GeminiAdapter from index", async () => {
    const adapters = await import("../src/adapters");
    const serverIndex = await import("../src/index");
    expect(adapters.OpenAIAdapter).toBeDefined();
    expect(adapters.GeminiAdapter).toBeDefined();
    expect(serverIndex.OpenAIAdapter).toBeDefined();
    expect(serverIndex.GeminiAdapter).toBeDefined();
  });

  it("strips trailing slashes from OpenAI baseUrl and wraps network exceptions in PlatformError", async () => {
    let capturedUrl: string | undefined;
    const adapter = new OpenAIAdapter({
      apiKey: "test-key",
      baseUrl: "https://api.openai.com/v1///",
      fetchClient: async (url) => {
        capturedUrl = url.toString();
        return new Response(JSON.stringify({
          choices: [{ message: { content: "{}" } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 }
        }), { status: 200 });
      }
    });

    await adapter.generate({
      model: "gpt-4o",
      systemPrompt: "sys",
      prompt: "hi",
      maxTokens: 10
    });
    expect(capturedUrl).toBe("https://api.openai.com/v1/chat/completions");

    // Test network throw
    const networkFailingAdapter = new OpenAIAdapter({
      apiKey: "test-key",
      fetchClient: async () => {
        throw new Error("Connection refused (ECONNREFUSED)");
      }
    });

    try {
      await networkFailingAdapter.generate({
        model: "gpt-4o",
        systemPrompt: "sys",
        prompt: "hi",
        maxTokens: 10
      });
      expect().fail("Should have thrown");
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.PROVIDER_ERROR);
      expect(err.message).toContain("OpenAI network request failed: Connection refused");
    }
  });

  it("encodes Gemini model and apiKey in URL and wraps network exceptions in PlatformError", async () => {
    let capturedUrl: string | undefined;
    const adapter = new GeminiAdapter({
      apiKey: "key with spaces+special&chars",
      fetchClient: async (url) => {
        capturedUrl = url.toString();
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: "{}" }] } }],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 }
        }), { status: 200 });
      }
    });

    await adapter.generate({
      model: "gemini/test model:v1",
      systemPrompt: "sys",
      prompt: "hi",
      maxTokens: 10
    });

    expect(capturedUrl).toContain(encodeURIComponent("gemini/test model:v1"));
    expect(capturedUrl).toContain(encodeURIComponent("key with spaces+special&chars"));

    // Test network throw
    const networkFailingAdapter = new GeminiAdapter({
      apiKey: "test-key",
      fetchClient: async () => {
        throw new Error("DNS resolution failed");
      }
    });

    try {
      await networkFailingAdapter.generate({
        model: "gemini-1.5-flash",
        systemPrompt: "sys",
        prompt: "hi",
        maxTokens: 10
      });
      expect().fail("Should have thrown");
    } catch (err: any) {
      expect(err).toBeInstanceOf(PlatformError);
      expect(err.code).toBe(PlatformErrorCodes.PROVIDER_ERROR);
      expect(err.message).toContain("Gemini network request failed: DNS resolution failed");
    }
  });
});
