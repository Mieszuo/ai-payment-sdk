import { describe, it, expect } from "bun:test";
import { RedisRateLimiter } from "../src/services/redis-rate-limiter";

describe("RedisRateLimiter (Upstash REST protocol via fake transport)", () => {
  it("allows up to maxRequests per window and blocks the next one", async () => {
    const calls: { url: string; body: string }[] = [];
    const fakeFetch = async (url: string, init: any) => {
      calls.push({ url, body: init?.body ?? "" });
      const cmd = JSON.parse(init?.body ?? "[]");
      // EVAL <script> <keys...> <args...> → respond with the count
      if (Array.isArray(cmd) && cmd[0] === "EVAL") {
        const args = cmd.slice(3).map(String);
        const count = Number(args[2] ?? "0") + 1;
        return new Response(JSON.stringify({ result: count }), { status: 200 });
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
  });

  it("degrades to in-memory limiting when no REDIS_URL is configured", async () => {
    const limiter = new RedisRateLimiter({});
    expect(await limiter.checkLimit("k", 1, 60)).toBe(true);
    expect(await limiter.checkLimit("k", 1, 60)).toBe(false);
  });
});
