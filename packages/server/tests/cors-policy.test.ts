import { describe, it, expect } from "bun:test";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { DeveloperService } from "../src/services/developer.service";
import { CorsPolicyService } from "../src/services/cors-policy";

describe("CorsPolicyService", () => {
  const build = () => {
    const dev = new DeveloperService(new InMemoryDatabase());
    dev.registerProject({
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

  it("allows configured origins", () => {
    const policy = build();
    expect(policy.isOriginAllowed("https://app.example.com", "proj_cors")).toBe(true);
    expect(policy.isOriginAllowed("http://localhost:5173", "proj_cors")).toBe(true);
  });

  it("rejects unknown origins but allows server-to-server requests without Origin", () => {
    const policy = build();
    expect(policy.isOriginAllowed("https://evil.example.com", "proj_cors")).toBe(false);
    expect(policy.isOriginAllowed(undefined, "proj_cors")).toBe(true);
  });
});
