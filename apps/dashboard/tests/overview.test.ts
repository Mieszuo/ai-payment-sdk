import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { MetricCard } from "../src/components/common/MetricCard";
import { OverviewView } from "../src/components/views/OverviewView";
import { DashboardProvider } from "../src/context/DashboardContext";

describe("Overview Telemetry & Metrics", () => {
  it("renders metric cards with formatted financial values", () => {
    const html = renderToStaticMarkup(
      React.createElement(MetricCard, {
        title: "Provider Spend",
        value: "$12.43",
        badge: "8.2% margin guard",
        variant: "default"
      })
    );

    expect(html).toContain("Provider Spend");
    expect(html).toContain("$12.43");
    expect(html).toContain("8.2% margin guard");
  });

  it("renders full OverviewView with telemetry grid and quickstart snippet", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DashboardProvider,
        null,
        React.createElement(OverviewView)
      )
    );

    expect(html).toContain("Total Executions");
    expect(html).toContain("Credits Consumed");
    expect(html).toContain("Provider Spend");
    expect(html).toContain("Gross Margin");
    expect(html).toContain("Active Actions in Production");
    expect(html).toContain("Quickstart Integration");
  });
});
