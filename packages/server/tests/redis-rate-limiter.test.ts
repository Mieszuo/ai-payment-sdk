import { describe, it, expect } from "bun:test";
import { RedisRateLimiter } from "../src/services/redis-rate-limiter";

describe("RedisRateLimiter (Upstash REST protocol via fake transport)", () => {
  it("allows up to maxRequests per window and blocks the next one", async () => {
    const calls: { url: string; body: string }[] = [];
    let counter = 0;
    const fakeFetch = async (url: string, init: any) => {
      calls.push({ url, body: init?.body ?? "" });
      const cmd = JSON.parse(init?.body ?? "[]");
      // REAL Upstash REST contract: the body is the flat command array
      // ["EVAL", script, numkeys, key, window] and the server-side INCR
      // result is reflected by a closure counter (1st call → 1, 2nd → 2, ...).
      if (Array.isArray(cmd) && cmd[0] === "EVAL") {
        counter += 1;
        return new Response(JSON.stringify({ result: counter }), { status: 200 });
      }
      return new Response(JSON.stringify({ result: "OK" }), { status: 200 });
    };

    const limiter = new RedisRateLimiter({
      url: "https://fake.upstash.io",
      token: "test-token",
      fetchImpl: fakeFetch as any
    });

    expect(await limiter.checkLimit("usr:act", 3, 60)).toBe(true);
    expect(await limiter.checkLimit("usr:act", 3, 60)).toBe(true);
    expect(await limiter.checkLimit("usr:act", 3, 60)).toBe(true);
    expect(await limiter.checkLimit("usr:act", 3, 60)).toBe(false);
    expect(calls.length).toBeGreaterThan(0);
    // The transport must POST to the BARE Upstash base URL — never {url}/eval.
    for (const call of calls) expect(call.url.endsWith("/eval")).toBe(false);
  });

  it("POSTs the Upstash EVAL wire format to the bare URL with Bearer auth", async () => {
    let captured: { url: string; init: any } | undefined;
    const fakeFetch = async (url: string, init: any) => {
      captured = { url, init };
      return new Response(JSON.stringify({ result: 1 }), { status: 200 });
    };

    const limiter = new RedisRateLimiter({
      url: "https://fake.upstash.io",
      token: "test-token",
      fetchImpl: fakeFetch as any
    });

    await limiter.checkLimit("k", 3, 60);

    expect(captured).toBeDefined();
    expect(captured!.url).toBe("https://fake.upstash.io"); // bare base, no /eval path
    expect(captured!.init.method).toBe("POST");
    expect(captured!.init.headers.Authorization).toBe("Bearer test-token");
    const cmd = JSON.parse(captured!.init.body);
    expect(Array.isArray(cmd)).toBe(true);
    expect(cmd[0]).toBe("EVAL");
    expect(cmd.length).toBe(5); // [EVAL, script, numkeys, key, window] — no mirrored count arg
    expect(cmd[2]).toBe(1); // numkeys
    expect(cmd[3]).toBe("k"); // KEYS[1]
    expect(cmd[4]).toBe("60"); // ARGV[1]
  });

  it("degrades to in-memory limiting when no REDIS_URL is configured", async () => {
    const limiter = new RedisRateLimiter({});
    expect(await limiter.checkLimit("k", 1, 60)).toBe(true);
    expect(await limiter.checkLimit("k", 1, 60)).toBe(false);
  });
});
