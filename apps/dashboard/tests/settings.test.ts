import { describe, it, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { SecretKeyModal } from "../src/components/common/SecretKeyModal";
import { SettingsView } from "../src/components/views/SettingsView";
import { DashboardProvider } from "../src/context/DashboardContext";

describe("Secret Key One-Time Modal & Settings", () => {
  it("renders secret key modal with one-time warning and dismissal acknowledgement", () => {
    const html = renderToStaticMarkup(
      React.createElement(SecretKeyModal, {
        rawSecretKey: "sk_live_test_new_secret_key_123",
        isOpen: true,
        onClose: () => {}
      })
    );

    expect(html).toContain("sk_live_test_new_secret_key_123");
    expect(html).toContain("cannot be displayed again");
    expect(html).not.toContain("••••••••");
  });

  it("renders Settings view with permanently masked secret key", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DashboardProvider,
        null,
        React.createElement(SettingsView)
      )
    );

    expect(html).toContain("Project Settings");
    expect(html).toContain("API Keys");
    expect(html).toContain("••••••••");
    expect(html).toContain("Rotate Secret Key");
  });
});
