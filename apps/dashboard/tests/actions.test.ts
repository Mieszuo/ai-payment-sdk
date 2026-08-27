import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { extractTemplateVariables, calculateMargin } from "../src/lib/parser";
import { ActionsView } from "../src/components/views/ActionsView";
import { ActionDrawer } from "../src/components/actions/ActionDrawer";
import { DashboardProvider } from "../src/context/DashboardContext";

describe("Action Template Variable Parser & Margin Economics", () => {
  it("extracts unique mustache variables from prompt templates", () => {
    const template = "Analyze CV for candidate {{candidateName}} applying for {{jobTitle}}. CV:\n{{cvText}}\nConfirm with {{candidateName}}.";
    const vars = extractTemplateVariables(template);
    expect(vars).toEqual(["candidateName", "jobTitle", "cvText"]);
  });

  it("calculates minimum gross margin correctly", () => {
    // 15 credits = $0.15 revenue value; maxProviderCostCents = 5 ($0.05) -> (0.15 - 0.05) / 0.15 = 66.67%
    const margin = calculateMargin(15, 5);
    expect(margin).toBe(67);
  });

  it("handles zero or edge values safely without NaN", () => {
    expect(calculateMargin(0, 0)).toBe(0);
    expect(calculateMargin(10, 15)).toBe(-50); // Loss margin
  });

  it("renders ActionsView with registered actions and margin badges", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DashboardProvider,
        null,
        React.createElement(ActionsView)
      )
    );

    expect(html).toContain("Managed Actions Registry");
    expect(html).toContain("optimize-resume");
    expect(html).toContain("New Action Version");
  });
});
