import { describe, it, expect } from "bun:test";
import { createDashboardApiClient } from "../src/lib/api";

describe("Dashboard API Client & Mode Separation", () => {
  it("operates in Demo Mode when Gateway is offline without throwing unhandled crashes", async () => {
    const client = createDashboardApiClient({
      gatewayUrl: "http://localhost:9999", // dead port
      mode: "DEMO_MODE"
    });

    const actions = await client.getActions("proj_demo");
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].actionName).toBe("optimize-resume");

    const telemetry = await client.getTelemetry("proj_demo");
    expect(telemetry.totalRuns).toBeGreaterThan(0);
    expect(telemetry.providerSpendCents).toBeGreaterThan(0);
  });

  it("throws explicit error in Production Mode when Gateway is offline", async () => {
    const client = createDashboardApiClient({
      gatewayUrl: "http://localhost:9999",
      mode: "PRODUCTION_MODE"
    });

    let threw = false;
    try {
      await client.getActions("proj_demo");
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain("Gateway unreachable");
    }
    expect(threw).toBe(true);
  });

  it("publishes new action version in Demo Mode and updates local store", async () => {
    const client = createDashboardApiClient({
      gatewayUrl: "http://localhost:9999",
      mode: "DEMO_MODE"
    });

    const published = await client.publishAction("proj_demo", {
      actionName: "generate-cover-letter",
      model: "gpt-4o-mini",
      priceCredits: 10,
      maxProviderCostCents: 3,
      systemPrompt: "You are an expert copywriter.",
      userPromptTemplate: "Job: {{jobTitle}}\nCompany: {{companyName}}",
      rateLimit: { maxRequests: 5, windowSeconds: 60 }
    });

    expect(published.version).toBeGreaterThanOrEqual(1);
    expect(published.actionName).toBe("generate-cover-letter");

    const actions = await client.getActions("proj_demo");
    const found = actions.find(a => a.actionName === "generate-cover-letter");
    expect(found).toBeDefined();
  });

  it("executes mock action in Demo Mode without consuming provider cost", async () => {
    const client = createDashboardApiClient({
      gatewayUrl: "http://localhost:9999",
      mode: "DEMO_MODE"
    });

    const res = await client.executeAction({
      projectId: "proj_demo",
      actionName: "optimize-resume",
      inputs: { cvText: "Senior React Engineer" },
      mode: "Mock"
    });

    expect(res.status).toBe("SUCCEEDED");
    expect(res.costCents).toBe(0);
    expect(res.output).toBeDefined();
  });
});
