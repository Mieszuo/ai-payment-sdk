/**
 * Redis-backed OTP store using the Upstash REST protocol — the same transport
 * contract as redis-rate-limiter.ts:
 *
 *   POST the BARE REDIS_URL (no /eval path) with a flat command array and
 *   `Authorization: Bearer <token>`:
 *     GET   → ["GET", key]                 → { result: value | null }
 *     SETEX → ["SETEX", key, ttl, value]   → { result: "OK" }
 *     DEL   → ["DEL", key]                 → { result: 1 | 0 }
 *
 * Fail-open: every write is mirrored into an in-memory fallback store, and on
 * a transport error / non-OK status reads fall back to it — OTP auth never
 * hard-breaks when Redis is unreachable (at worst codes are per-instance for
 * the duration of the outage).
 */
import { InMemoryOtpStore, type OtpStore } from "./auth-otp-store";

export interface RedisOtpStoreOptions {
  url?: string;
  token?: string;
  fetchImpl?: (url: string, init?: any) => Promise<Response>;
}

export class RedisOtpStore implements OtpStore {
  private url: string;
  private token: string;
  private fetchImpl: (url: string, init?: any) => Promise<Response>;
  private fallback = new InMemoryOtpStore();

  constructor(options: RedisOtpStoreOptions = {}) {
    this.url = options.url || process.env.REDIS_URL || "";
    this.token = options.token || process.env.REDIS_TOKEN || "";
    this.fetchImpl = options.fetchImpl || ((url, init) => fetch(url, init));
  }

  async get(key: string): Promise<string | null> {
    if (!this.url) return this.fallback.get(key);
    try {
      const res = await this.fetchImpl(this.url, this.request(["GET", key]));
      if (!res.ok) {
        console.warn(`[redis-otp-store] GET failed with status ${res.status}; using in-memory fallback`);
        return this.fallback.get(key);
      }
      const { result } = (await res.json()) as { result?: unknown };
      return typeof result === "string" ? result : null;
    } catch (err) {
      console.warn("[redis-otp-store] GET transport error; using in-memory fallback", err);
      return this.fallback.get(key);
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    // Keep the fail-open mirror fresh regardless of Redis availability.
    await this.fallback.set(key, value, ttlSeconds);
    if (!this.url) return;
    try {
      const res = await this.fetchImpl(
        this.url,
        this.request(["SETEX", key, String(ttlSeconds), value])
      );
      if (!res.ok) {
        console.warn(`[redis-otp-store] SETEX failed with status ${res.status}`);
      }
    } catch (err) {
      console.warn("[redis-otp-store] SETEX transport error", err);
    }
  }

  async del(key: string): Promise<void> {
    await this.fallback.del(key);
    if (!this.url) return;
    try {
      const res = await this.fetchImpl(this.url, this.request(["DEL", key]));
      if (!res.ok) {
        console.warn(`[redis-otp-store] DEL failed with status ${res.status}`);
      }
    } catch (err) {
      console.warn("[redis-otp-store] DEL transport error", err);
    }
  }

  private request(command: unknown[]) {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify(command)
    };
  }
}
