import { describe, it, expect } from "bun:test";
import { ALL_SECTIONS, getArticleById } from "../src/content";

describe("Docs Content Reference Registry", () => {
  it("registers all 6 root navigation sections", () => {
    expect(ALL_SECTIONS).toHaveLength(6);
    const sectionIds = ALL_SECTIONS.map((s) => s.id);
    expect(sectionIds).toEqual([
      "getting-started",
      "concepts",
      "sdk",
      "managed-actions",
      "gateway-api",
      "advanced"
    ]);
  });

  it("retrieves articles by unique identifier", () => {
    const art = getArticleById("sdk-core");
    expect(art).toBeDefined();
    expect(art?.title).toContain("@ai-credits/sdk");

    const errArt = getArticleById("sdk-errors");
    expect(errArt).toBeDefined();
    expect(errArt?.title).toContain("Error Reference");
  });
});
