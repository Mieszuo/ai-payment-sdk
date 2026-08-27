import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

describe("Landing Page App Scaffolding", () => {
  const root = join(import.meta.dir, "..");

  it("has a valid package.json with name 'landing'", () => {
    const pkgPath = join(root, "package.json");
    expect(existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(pkg.name).toBe("landing");
  });

  it("has index.css with glass-panel and mono-code tokens", () => {
    const css = readFileSync(join(root, "src/index.css"), "utf-8");
    expect(css).toContain("glass-panel");
    expect(css).toContain("mono-code");
  });
});
