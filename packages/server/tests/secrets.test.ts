import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createPlatformApp } from "../src/server";

/**
 * Fail-closed secrets (final review C1): in production the gateway must refuse
 * to boot without real JWT_SECRET / STRIPE_WEBHOOK_SECRET values — the
 * compiled-in demo fallbacks are for local development only.
 *
 * The tests run the full createPlatformApp() against the in-memory database,
 * so no DATABASE_URL is needed. process.env is snapshotted/restored around
 * every case to keep the suite hermetic.
 */
const ENV_KEYS = [
  "NODE_ENV",
  "SECRETS_STRICT",
  "JWT_SECRET",
  "STRIPE_WEBHOOK_SECRET",
  "DATABASE_URL"
] as const;

function snapshotEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  return saved;
}

function restoreEnv(saved: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("Fail-closed secrets in production", () => {
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = snapshotEnv();
  });

  afterEach(() => {
    restoreEnv(savedEnv);
  });

  it("rejects when NODE_ENV=production and JWT_SECRET is unset", async () => {
    delete process.env.NODE_ENV;
    delete process.env.SECRETS_STRICT;
    delete process.env.JWT_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "production";

    await expect(createPlatformApp()).rejects.toThrow(/JWT_SECRET/);
  });

  it("rejects when NODE_ENV=production and STRIPE_WEBHOOK_SECRET is unset", async () => {
    delete process.env.NODE_ENV;
    delete process.env.SECRETS_STRICT;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "test-secret-key-at-least-32-chars-long!";

    await expect(createPlatformApp()).rejects.toThrow(/STRIPE_WEBHOOK_SECRET/);
  });

  it("rejects under SECRETS_STRICT=1 even when NODE_ENV is not production", async () => {
    delete process.env.NODE_ENV;
    delete process.env.SECRETS_STRICT;
    delete process.env.JWT_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.DATABASE_URL;
    process.env.SECRETS_STRICT = "1";

    await expect(createPlatformApp()).rejects.toThrow(/JWT_SECRET/);
  });

  it("resolves in production when both secrets are set", async () => {
    delete process.env.NODE_ENV;
    delete process.env.SECRETS_STRICT;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "test-secret-key-at-least-32-chars-long!";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";

    const { app } = await createPlatformApp();
    expect(app).toBeDefined();
  });

  it("keeps the demo fallback when NODE_ENV is unset", async () => {
    delete process.env.NODE_ENV;
    delete process.env.SECRETS_STRICT;
    delete process.env.JWT_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.DATABASE_URL;

    const { app } = await createPlatformApp();
    expect(app).toBeDefined();
  });
});
