import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { App } from "../src/App";

describe("Dashboard Full Shell Integration", () => {
  it("renders the root application shell with all navigation tabs and header", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    expect(html).toContain("AI Credits");
    expect(html).toContain("Overview");
    expect(html).toContain("Actions");
    expect(html).toContain("Playground");
    expect(html).toContain("Audit Logs");
    expect(html).toContain("Settings");
  });
});
