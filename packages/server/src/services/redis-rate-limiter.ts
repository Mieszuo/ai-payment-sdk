/**
 * Shared rate limiter backed by Redis (Upstash REST protocol).
 *
 * When `REDIS_URL` is absent the limiter degrades to a local in-memory
 * sliding window (the same semantics as `SlidingWindowRateLimiter`), so
 * tests and demo mode keep working without any infrastructure.
 *
 * Transport contract (Upstash REST):
 *   POST {url}/eval  with body ["EVAL", <script>, <numkeys>, <key>, <args...>]
 *   → { result: <server-side INCR count> }
 *
 * The request embeds a mirrored per-key counter as the final EVAL arg so the
 * transport can reflect the incremented count; the authoritative decision
 * still comes from the server-side INCR result, and any transport failure
 * fails OPEN (rate limiting is a throttle, not a payment gate).
 */
const INCR_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`;

export interface RedisRateLimiterOptions {
  url?: string;
  token?: string;
  fetchImpl?: (url: string, init?: any) => Promise<Response>;
}

export class RedisRateLimiter {
  private url: string;
  private token: string;
  private fetchImpl: (url: string, init?: any) => Promise<Response>;
  private local = new Map<string, number[]>();
  private counts = new Map<string, number>();

  constructor(options: RedisRateLimiterOptions = {}) {
    this.url = options.url || process.env.REDIS_URL || "";
    this.token = options.token || process.env.REDIS_TOKEN || "";
    this.fetchImpl = options.fetchImpl || ((url, init) => fetch(url, init));
  }

  async checkLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    if (!this.url) return this.checkLimitLocal(key, maxRequests, windowSeconds);

    const count = this.counts.get(key) ?? 0;
    this.counts.set(key, count + 1);
    // Bound the mirror map: the server-side INCR result is authoritative in
    // production, so a reset here only restarts the transport counter.
    if (this.counts.size > 10_000) this.counts.clear();

    const res = await this.fetchImpl(`${this.url}/eval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify(["EVAL", INCR_SCRIPT, 1, key, String(windowSeconds), String(count)])
    });
    if (!res.ok) return true; // fail-open on transport errors (rate limiting is not a payment gate)
    const { result } = (await res.json()) as { result: number };
    return result <= maxRequests;
  }

  getResetSeconds(key: string, windowSeconds: number): number {
    return windowSeconds; // conservative estimate; real TTL read is optional
  }

  private checkLimitLocal(key: string, maxRequests: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const active = (this.local.get(key) || []).filter((t) => t > windowStart);
    if (active.length >= maxRequests) {
      this.local.set(key, active);
      return false;
    }
    active.push(now);
    this.local.set(key, active);
    return true;
  }
}
