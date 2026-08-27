import { describe, it, expect, beforeAll } from "bun:test";
import { createPlatformApp } from "../src/server";

type Platform = Awaited<ReturnType<typeof createPlatformApp>>;

/**
 * Coverage for the per-project browserCorsGuard registered in server.ts on
 * browser-facing route prefixes (/v1/actions/*, /v1/wallet/*, /v1/auth/*, ...).
 * Verified end-to-end through createPlatformApp({ forceMock: true }).
 */
describe("browserCorsGuard (server.ts per-project CORS)", () => {
  let platform: Platform;

  beforeAll(async () => {
    platform = await createPlatformApp({ forceMock: true });
    // A second project with its own allowlist, distinct from the seeded proj_demo.
    platform.devService.registerProject({
      projectId: "proj_guarded",
      name: "Guarded Project",
      publicKey: "pk_live_guarded",
      secretKey: "sk_live_guarded",
      allowedDomains: ["https://app.example.com"]
    });
  });

  it("returns 403 for a disallowed browser origin", async () => {
    const res = await platform.app.request("/v1/wallet", {
      method: "GET",
      headers: { Origin: "https://evil.example.com" }
    });
    expect(res.status).toBe(403);
  });

  it("does not 403 an origin on the demo project allowlist", async () => {
    const res = await platform.app.request("/v1/wallet", {
      method: "GET",
      headers: { Origin: "http://localhost:5173" }
    });
    expect(res.status).not.toBe(403);
  });

  it("does not 403 a request without an Origin header (server-to-server)", async () => {
    const res = await platform.app.request("/v1/wallet", { method: "GET" });
    expect(res.status).not.toBe(403);
  });

  it("does not 403 when x-project-id resolves to a project whose allowlist contains the origin", async () => {
    // https://app.example.com is allowed only for proj_guarded; the x-project-id
    // header pins the request to that project (the any-project fallback would deny it).
    const res = await platform.app.request("/v1/wallet", {
      method: "GET",
      headers: { Origin: "https://app.example.com", "x-project-id": "proj_guarded" }
    });
    expect(res.status).not.toBe(403);
  });

  it("answers OPTIONS preflights for an allowed origin with 204 and CORS headers", async () => {
    const res = await platform.app.request("/v1/wallet", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type"
      }
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});
