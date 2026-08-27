import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { PackageManagerSwitcher, getInstallCommand } from "../src/components/common/PackageManagerSwitcher";
import { generateAgentContext } from "../src/components/ai/TryInModal";
import { DocsProvider } from "../src/context/DocsContext";

describe("Docs Core Interactive Components", () => {
  it("formats install commands accurately across package managers", () => {
    expect(getInstallCommand("bun", "@ai-credits/sdk")).toBe("bun add @ai-credits/sdk");
    expect(getInstallCommand("npm", "@ai-credits/sdk")).toBe("npm install @ai-credits/sdk");
    expect(getInstallCommand("pnpm", "@ai-credits/sdk")).toBe("pnpm add @ai-credits/sdk");
    expect(getInstallCommand("yarn", "@ai-credits/sdk")).toBe("yarn add @ai-credits/sdk");
  });

  it("generates structured agent context for Cursor and Claude Code", () => {
    const cursorContext = generateAgentContext("cursor", "pk_live_demo123");
    expect(cursorContext).toContain(".cursorrules");
    expect(cursorContext).toContain("@ai-credits/sdk");
    expect(cursorContext).toContain("INSUFFICIENT_CREDITS");

    const claudeContext = generateAgentContext("claude", "pk_live_demo123");
    expect(claudeContext).toContain("claude mcp add");
  });

  it("renders CodeSnippet and PackageManagerSwitcher without emojis", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DocsProvider,
        null,
        React.createElement(PackageManagerSwitcher, { pkgName: "@ai-credits/sdk" })
      )
    );
    expect(html).toContain("bun add @ai-credits/sdk");
    expect(html).toContain("npm");
  });
});
