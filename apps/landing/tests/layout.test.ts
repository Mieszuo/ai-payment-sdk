import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { App } from "../src/App";

describe("Landing Page Full Layout", () => {
  it("renders all major sections without emojis", () => {
    const html = renderToStaticMarkup(React.createElement(App));

    expect(html).toContain("AI Credits");
    expect(html).toContain("No financial str");
    expect(html).toContain("3 lines of code");
    expect(html).toContain("Monthly Profit Calculator");
    expect(html).toContain("How It Works");
    expect(html).toContain("Zero-Trust Prompts");
    expect(html).toContain("Documentation");
    expect(html).toContain("Developer Console");

    // No emojis anywhere
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });
});
