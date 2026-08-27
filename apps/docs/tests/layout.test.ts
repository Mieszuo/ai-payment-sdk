import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { App } from "../src/App";

describe("Docs Portal Full Layout & Shell", () => {
  it("renders global header with search, links, and Try in AI button", () => {
    const html = renderToStaticMarkup(React.createElement(App));
    expect(html).toContain("AI Credits Docs");
    expect(html).toContain("Ask AI / Try in");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Getting Started");
    expect(html).toContain("Concepts");
  });
});
