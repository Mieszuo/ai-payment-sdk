export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();

  checkLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const timestamps = this.windows.get(key) || [];
    const active = timestamps.filter((t) => t > windowStart);

    if (active.length >= maxRequests) {
      this.windows.set(key, active);
      return false;
    }

    active.push(now);
    this.windows.set(key, active);
    return true;
  }

  getResetSeconds(key: string, windowSeconds: number): number {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const timestamps = this.windows.get(key) || [];
    const active = timestamps.filter((t) => t > windowStart);
    if (active.length === 0) return 0;
    const oldest = active[0];
    const expiresAt = oldest + windowSeconds * 1000;
    return Math.max(1, Math.ceil((expiresAt - now) / 1000));
  }

  clear(key?: string): void {
    if (key) {
      this.windows.delete(key);
    } else {
      this.windows.clear();
    }
  }
}
