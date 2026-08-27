import { describe, it, expect } from "bun:test";
import { computeProfit } from "../src/components/ProfitCalculator";

describe("Profit Calculator Logic", () => {
  it("computes monthly revenue and margin for default scenario", () => {
    const result = computeProfit({
      monthlyUsers: 1000,
      executionsPerUser: 5,
      priceCredits: 15,
      providerCostDollars: 0.004
    });

    expect(result.totalExecutions).toBe(5000);
    expect(result.grossRevenueDollars).toBe(750);
    expect(result.totalProviderCostDollars).toBe(20);
    expect(result.netProfitDollars).toBe(730);
    expect(result.grossMarginPercent).toBe(97);
  });

  it("handles zero users gracefully", () => {
    const result = computeProfit({
      monthlyUsers: 0,
      executionsPerUser: 10,
      priceCredits: 20,
      providerCostDollars: 0.01
    });

    expect(result.totalExecutions).toBe(0);
    expect(result.grossRevenueDollars).toBe(0);
    expect(result.netProfitDollars).toBe(0);
    expect(result.grossMarginPercent).toBe(0);
  });

  it("handles high-cost models where margin is thin", () => {
    const result = computeProfit({
      monthlyUsers: 100,
      executionsPerUser: 2,
      priceCredits: 10,
      providerCostDollars: 0.08
    });

    expect(result.totalExecutions).toBe(200);
    expect(result.grossRevenueDollars).toBe(20);
    expect(result.totalProviderCostDollars).toBe(16);
    expect(result.netProfitDollars).toBe(4);
    expect(result.grossMarginPercent).toBe(20);
  });
});
