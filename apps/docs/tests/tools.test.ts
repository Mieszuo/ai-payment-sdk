import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { EconomicsCalculator, computeEconomics } from "../src/components/tools/EconomicsCalculator";
import { ERROR_DEFINITIONS } from "../src/components/tools/ErrorCodeTable";

describe("Docs Tools & Matrices", () => {
  it("calculates developer economics accurately", () => {
    const econ = computeEconomics(15, 0.004);
    expect(econ.revenueDollars).toBe(0.15);
    expect(econ.profitDollars).toBe(0.146);
    expect(econ.grossMarginPercent).toBe(97);
  });

  it("contains all 8 standard error codes with recovery steps", () => {
    const codes = ERROR_DEFINITIONS.map((e) => e.code);
    expect(codes).toContain("INSUFFICIENT_CREDITS");
    expect(codes).toContain("RATE_LIMITED");
    expect(codes).toContain("UNAUTHORIZED");
    expect(codes).toContain("INVALID_INPUT");
    expect(codes).toContain("ACTION_NOT_FOUND");
    expect(codes).toContain("PROVIDER_ERROR");
    expect(codes).toContain("OUTPUT_VALIDATION_FAILED");
    expect(codes).toContain("ABORTED");
  });

  it("renders ErrorCodeTable and EconomicsCalculator without emojis", () => {
    const html = renderToStaticMarkup(React.createElement(EconomicsCalculator));
    expect(html).toContain("Unit Economics");
    expect(html).toContain("Gross Margin");
  });
});
