import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { PackageManagerSwitcher, getInstallCommand } from "../src/components/common/PackageManagerSwitcher";
import { CodeSnippet } from "../src/components/common/CodeSnippet";
import { TryInModal, generateAgentContext } from "../src/components/ai/TryInModal";
import { DocsProvider } from "../src/context/DocsContext";

describe("Docs Core Interactive Components", () => {
  it("formats install commands accurately across package managers", () => {
    expect(getInstallCommand("bun", "@platform/sdk")).toBe("bun add @platform/sdk");
    expect(getInstallCommand("npm", "@platform/sdk")).toBe("npm install @platform/sdk");
    expect(getInstallCommand("pnpm", "@platform/sdk")).toBe("pnpm add @platform/sdk");
    expect(getInstallCommand("yarn", "@platform/sdk")).toBe("yarn add @platform/sdk");
  });

  it("generates structured agent context for Cursor and Claude Code", () => {
    const cursorContext = generateAgentContext("cursor", "pk_live_demo123");
    expect(cursorContext).toContain(".cursorrules");
    expect(cursorContext).toContain("@platform/sdk");
    expect(cursorContext).toContain("INSUFFICIENT_CREDITS");

    const claudeContext = generateAgentContext("claude", "pk_live_demo123");
    expect(claudeContext).toContain("claude mcp add");
  });

  it("renders CodeSnippet and PackageManagerSwitcher without emojis", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DocsProvider,
        null,
        React.createElement(PackageManagerSwitcher, { pkgName: "@platform/sdk" })
      )
    );
    expect(html).toContain("bun add @platform/sdk");
    expect(html).toContain("npm");
  });
});
