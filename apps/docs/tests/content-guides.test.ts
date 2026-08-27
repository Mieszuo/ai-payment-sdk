import { describe, it, expect } from "bun:test";
import { gettingStartedArticles } from "../src/content/getting-started";
import { conceptsArticles } from "../src/content/concepts";

describe("Docs Content Store (Guides & Concepts)", () => {
  it("provides 7 Getting Started articles", () => {
    const ids = gettingStartedArticles.map((a) => a.id);
    expect(ids).toContain("introduction");
    expect(ids).toContain("installation");
    expect(ids).toContain("quickstart");
    expect(ids).toContain("vanilla-js");
    expect(ids).toContain("react");
    expect(ids).toContain("first-action");
    expect(ids).toContain("production-deployment");
  });

  it("provides 8 Conceptual articles", () => {
    const ids = conceptsArticles.map((a) => a.id);
    expect(ids).toContain("how-it-works");
    expect(ids).toContain("projects");
    expect(ids).toContain("wallets-credits");
    expect(ids).toContain("managed-actions-concept");
    expect(ids).toContain("action-versions");
    expect(ids).toContain("reservations-settlement");
    expect(ids).toContain("public-vs-secret-keys");
    expect(ids).toContain("mock-vs-live");
  });
});
