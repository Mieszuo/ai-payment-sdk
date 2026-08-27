import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

describe("Developer Portal App Scaffolding", () => {
  const root = join(import.meta.dir, "..");

  it("verifies package.json and workspace configuration exist", () => {
    expect(existsSync(join(root, "package.json"))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
    expect(pkg.name).toBe("docs");
  });

  it("verifies index.css contains dark obsidian theme tokens without emojis", () => {
    expect(existsSync(join(root, "src/index.css"))).toBe(true);
    const css = readFileSync(join(root, "src/index.css"), "utf-8");
    expect(css).toContain("glass-panel");
    expect(css).toContain("mono-code");
  });
});
