import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { validateDryRun } from "../src/components/playground/DryRunValidator";
import { PlaygroundView } from "../src/components/views/PlaygroundView";
import { DashboardProvider } from "../src/context/DashboardContext";

describe("Playground Dry-Run Validation & Testbench", () => {
  it("validates input variables against required template fields", () => {
    const requiredVars = ["cvText", "targetRole"];
    const inputs = { cvText: "Senior TS dev" }; // missing targetRole

    const result = validateDryRun({ requiredVars, inputs, outputFormat: "json" });
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toEqual(["targetRole"]);
  });

  it("passes validation when all fields are supplied", () => {
    const requiredVars = ["cvText", "targetRole"];
    const inputs = { cvText: "Senior TS dev", targetRole: "Staff Engineer" };

    const result = validateDryRun({ requiredVars, inputs, outputFormat: "json" });
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it("renders PlaygroundView with Mock/Live switch and execution panel", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DashboardProvider,
        null,
        React.createElement(PlaygroundView)
      )
    );

    expect(html).toContain("Action Playground");
    expect(html).toContain("Mock");
    expect(html).toContain("Live");
    expect(html).toContain("Execute Action");
  });
});
