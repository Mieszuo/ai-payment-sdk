/**
 * OTP code store abstraction.
 *
 * The default implementation is in-memory (demo/tests). Production uses
 * `RedisOtpStore` (packages/server/src/services/redis-otp-store.ts) so OTP
 * codes are shared across gateway instances and expire via Redis TTL.
 *
 * The value stored is the OTP code itself; expiry is the store's concern
 * (`get` must return `null` for missing OR expired keys). Attempt counting
 * and the per-email request throttle stay in `AuthService`.
 */
export interface OtpStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

/** Default store: a Map with lazy expiry checked on read. */
export class InMemoryOtpStore implements OtpStore {
  private entries = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.entries.delete(key);
  }

  /** Removes expired entries; only meaningful for the in-memory store (Redis relies on TTL). */
  pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }
}
