import { describe, it, expect } from "bun:test";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { DeveloperService } from "../src/services/developer.service";
import { CorsPolicyService } from "../src/services/cors-policy";

describe("CorsPolicyService", () => {
  const build = async () => {
    const dev = new DeveloperService(new InMemoryDatabase());
    await dev.registerProject({
      projectId: "proj_cors",
      name: "CORS Project",
      publicKey: "pk_live_cors",
      secretKey: "sk_live_cors"
    });
    (dev as any).projectsById.get("proj_cors").allowedDomains = [
      "https://app.example.com",
      "http://localhost:5173"
    ];
    return new CorsPolicyService(dev);
  };

  it("allows configured origins", async () => {
    const policy = await build();
    expect(policy.isOriginAllowed("https://app.example.com", "proj_cors")).toBe(true);
    expect(policy.isOriginAllowed("http://localhost:5173", "proj_cors")).toBe(true);
  });

  it("rejects unknown origins but allows server-to-server requests without Origin", async () => {
    const policy = await build();
    expect(policy.isOriginAllowed("https://evil.example.com", "proj_cors")).toBe(false);
    expect(policy.isOriginAllowed(undefined, "proj_cors")).toBe(true);
  });

  it("denies a browser origin when allowedDomains is missing or empty (secure default)", async () => {
    const dev = new DeveloperService(new InMemoryDatabase());
    await dev.registerProject({
      projectId: "proj_missing_domains",
      name: "No Allowlist",
      publicKey: "pk_live_missing",
      secretKey: "sk_live_missing"
    });
    await dev.registerProject({
      projectId: "proj_empty_domains",
      name: "Empty Allowlist",
      publicKey: "pk_live_empty",
      secretKey: "sk_live_empty",
      allowedDomains: []
    });
    const policy = new CorsPolicyService(dev);
    expect(policy.isOriginAllowed("https://app.example.com", "proj_missing_domains")).toBe(false);
    expect(policy.isOriginAllowed("https://app.example.com", "proj_empty_domains")).toBe(false);
  });

  it("denies unknown projectIds even for an otherwise-allowed origin", async () => {
    const policy = await build();
    expect(policy.isOriginAllowed("https://app.example.com", "proj_does_not_exist")).toBe(false);
  });
});
