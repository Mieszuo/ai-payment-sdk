import { describe, it, expect } from "bun:test";
import { RedisOtpStore } from "../src/services/redis-otp-store";

describe("RedisOtpStore (Upstash REST protocol via fake transport)", () => {
  it("uses the flat GET/SETEX/DEL wire format on the bare URL with Bearer auth", async () => {
    const calls: { url: string; init: any }[] = [];
    const fakeFetch = async (url: string, init: any) => {
      calls.push({ url, init });
      const cmd = JSON.parse(init?.body ?? "[]");
      if (Array.isArray(cmd) && cmd[0] === "GET") {
        return new Response(JSON.stringify({ result: "123456" }), { status: 200 });
      }
      return new Response(JSON.stringify({ result: "OK" }), { status: 200 });
    };

    const store = new RedisOtpStore({
      url: "https://fake.upstash.io",
      token: "test-token",
      fetchImpl: fakeFetch as any
    });

    await store.set("alice@example.com:proj_demo", "123456", 600);
    const value = await store.get("alice@example.com:proj_demo");
    await store.del("alice@example.com:proj_demo");

    expect(value).toBe("123456");
    expect(calls).toHaveLength(3);
    for (const call of calls) {
      // The transport must POST to the BARE Upstash base URL — never /eval.
      expect(call.url).toBe("https://fake.upstash.io");
      expect(call.init.method).toBe("POST");
      expect(call.init.headers.Authorization).toBe("Bearer test-token");
    }
    const [setCmd, getCmd, delCmd] = calls.map((c) => JSON.parse(c.init.body));
    expect(setCmd).toEqual(["SETEX", "alice@example.com:proj_demo", "600", "123456"]);
    expect(getCmd).toEqual(["GET", "alice@example.com:proj_demo"]);
    expect(delCmd).toEqual(["DEL", "alice@example.com:proj_demo"]);
  });

  it("returns null when GET reports no value", async () => {
    const fakeFetch = async () =>
      new Response(JSON.stringify({ result: null }), { status: 200 });
    const store = new RedisOtpStore({
      url: "https://fake.upstash.io",
      token: "test-token",
      fetchImpl: fakeFetch as any
    });

    expect(await store.get("missing@example.com:proj_demo")).toBeNull();
  });

  it("falls back to the in-memory mirror on transport errors (fail-open)", async () => {
    const failingFetch = async () => {
      throw new Error("network down");
    };
    const store = new RedisOtpStore({
      url: "https://fake.upstash.io",
      token: "test-token",
      fetchImpl: failingFetch as any
    });

    await store.set("k", "654321", 600);
    expect(await store.get("k")).toBe("654321");
    await store.del("k");
    expect(await store.get("k")).toBeNull();
  });

  it("falls back to the in-memory mirror on non-OK responses (fail-open)", async () => {
    const failingFetch = async () => new Response("nope", { status: 500 });
    const store = new RedisOtpStore({
      url: "https://fake.upstash.io",
      token: "test-token",
      fetchImpl: failingFetch as any
    });

    await store.set("k2", "111222", 600);
    expect(await store.get("k2")).toBe("111222");
  });

  it("serves reads from the local map when no REDIS_URL is configured", async () => {
    const store = new RedisOtpStore({});
    await store.set("local-only", "999000", 600);
    expect(await store.get("local-only")).toBe("999000");
    await store.del("local-only");
    expect(await store.get("local-only")).toBeNull();
  });
});
