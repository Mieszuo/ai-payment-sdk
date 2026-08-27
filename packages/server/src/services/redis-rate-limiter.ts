/**
 * Shared rate limiter backed by Redis (Upstash REST protocol).
 *
 * When `REDIS_URL` is absent the limiter degrades to a local in-memory
 * sliding window (the same semantics as `SlidingWindowRateLimiter`), so
 * tests and demo mode keep working without any infrastructure.
 *
 * Transport contract (Upstash REST, matching @upstash/redis serialization):
 *   POST {url}  (the BARE base URL — no /eval path)
 *   Authorization: Bearer <token>
 *   body ["EVAL", <script>, 1, <key>, <windowSeconds>]
 *   → { result: <server-side INCR count> }
 *
 * The server-side INCR result is authoritative. Any transport failure
 * (non-2xx status, unparseable body, network error) is logged with
 * console.warn and fails OPEN (rate limiting is a throttle, not a payment
 * gate), so a misconfigured REDIS_URL/REDIS_TOKEN stays observable instead
 * of silently disabling shared rate limiting.
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

  constructor(options: RedisRateLimiterOptions = {}) {
    this.url = options.url || process.env.REDIS_URL || "";
    this.token = options.token || process.env.REDIS_TOKEN || "";
    this.fetchImpl = options.fetchImpl || ((url, init) => fetch(url, init));
  }

  async checkLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    if (!this.url) return this.checkLimitLocal(key, maxRequests, windowSeconds);

    try {
      const res = await this.fetchImpl(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify(["EVAL", INCR_SCRIPT, 1, key, String(windowSeconds)])
      });
      if (!res.ok) {
        console.warn(`[redis-rate-limiter] Upstash request failed with status ${res.status}; failing open`);
        return true;
      }
      const body = (await res.json()) as { result?: number };
      if (typeof body.result !== "number") {
        console.warn("[redis-rate-limiter] Upstash response missing numeric `result`; failing open");
        return true;
      }
      return body.result <= maxRequests;
    } catch (err) {
      console.warn("[redis-rate-limiter] Upstash transport error; failing open", err);
      return true; // fail-open on transport errors (rate limiting is not a payment gate)
    }
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
