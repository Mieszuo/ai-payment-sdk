import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { verifyHashIntegrity, IntegrityDrawer } from "../src/components/logs/IntegrityDrawer";
import { AuditLogsView } from "../src/components/views/AuditLogsView";
import { DashboardProvider } from "../src/context/DashboardContext";

describe("Audit Logs & Integrity Verification", () => {
  it("verifies SHA-256 integrity match between payload and recorded hash", async () => {
    const payload = "Candidate CV:\nSenior Developer";
    const expectedHash = "6d5d44715369bd28cc5989db092038e8f40395fcbc61c015363dadcf45d6b95d";

    const matches = await verifyHashIntegrity(payload, expectedHash);
    expect(matches).toBe(true);

    const tampered = await verifyHashIntegrity(payload + " tampered", expectedHash);
    expect(tampered).toBe(false);
  });

  it("renders AuditLogsView table with request attempts and status pills", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DashboardProvider,
        null,
        React.createElement(AuditLogsView)
      )
    );

    expect(html).toContain("Audit Logs");
    expect(html).toContain("Unified Request Stream");
    expect(html).toContain("Status");
    expect(html).toContain("Prompt Digest");
    expect(html).toContain("Input Digest");
  });
});
