import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Monorepo Cross-Linkage & Docs Integration", () => {
  it("verifies package.json contains 'docs' script", () => {
    const rootPkg = JSON.parse(readFileSync(join(import.meta.dir, "../../../package.json"), "utf-8"));
    expect(rootPkg.scripts.docs).toBe("bun --filter docs dev");
  });

  it("verifies Developer Dashboard header contains Documentation link", () => {
    const headerCode = readFileSync(join(import.meta.dir, "../../../apps/dashboard/src/components/layout/AppHeader.tsx"), "utf-8");
    expect(headerCode).toContain("Documentation");
    expect(headerCode).toContain("http://localhost:5175");
  });
});
