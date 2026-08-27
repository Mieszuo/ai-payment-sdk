import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Dashboard App Scaffolding", () => {
  it("verifies required configuration and stylesheet files exist", () => {
    const root = join(import.meta.dir, "..");
    expect(existsSync(join(root, "package.json"))).toBe(true);
    expect(existsSync(join(root, "vite.config.ts"))).toBe(true);
    expect(existsSync(join(root, "index.html"))).toBe(true);
    expect(existsSync(join(root, "src/main.tsx"))).toBe(true);
    expect(existsSync(join(root, "src/index.css"))).toBe(true);

    const css = readFileSync(join(root, "src/index.css"), "utf-8");
    expect(css).toContain("glass-panel");
    expect(css).toContain("hairline-border");
  });
});
