import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { StripeBillingService, TOPUP_PACKAGES } from "../src/services/stripe.service";
import { createStripeRoutes } from "../src/routes/stripe.routes";
import { formatAccountIdentifier } from "@platform/shared";

describe("Stripe Top-Up & Idempotency", () => {
  it("credits wallet on checkout.session.completed and handles duplicate webhook replay safely", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_stripe_1", 0);
    const stripeService = new StripeBillingService(db);

    const event = {
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_session_abc",
          metadata: { userId: "usr_stripe_1", packId: "popular" } // 550 credits
        }
      }
    };

    // First delivery
    await stripeService.handleWebhook(event);
    let wallet = db.wallets.get("usr_stripe_1");
    expect(wallet?.availableCredits).toBe(550);

    // Verify ledger transaction recorded
    const tx = db.transactions.get("stripe_cs_test_session_abc");
    expect(tx).toBeDefined();
    expect(tx?.transactionType).toBe("TOPUP");
    expect(tx?.referenceId).toBe("cs_test_session_abc");
    expect(tx?.entries).toEqual([
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: -550
      },
      {
        accountIdentifier: formatAccountIdentifier("USER_WALLET", "usr_stripe_1"),
        amountCredits: 550
      }
    ]);
    expect(tx?.metadata).toEqual({
      sessionId: "cs_test_session_abc",
      amountCents: 500
    });

    // Duplicate replay
    await stripeService.handleWebhook(event);
    wallet = db.wallets.get("usr_stripe_1");
    expect(wallet?.availableCredits).toBe(550); // Did not double-credit
  });

  it("handles starter and power packages accurately", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_starter", 10);
    db.seedWallet("usr_power", 50);
    const stripeService = new StripeBillingService(db);

    // Starter pack (300 credits)
    await stripeService.handleWebhook({
      id: "evt_starter",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_starter",
          metadata: { userId: "usr_starter", packId: "starter" }
        }
      }
    });
    expect(db.wallets.get("usr_starter")?.availableCredits).toBe(310);

    // Power pack (1200 credits)
    await stripeService.handleWebhook({
      id: "evt_power",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_power",
          metadata: { userId: "usr_power", packId: "power" }
        }
      }
    });
    expect(db.wallets.get("usr_power")?.availableCredits).toBe(1250);
  });

  it("creates a wallet if none exists yet when checkout completes", async () => {
    const db = new InMemoryDatabase();
    const stripeService = new StripeBillingService(db);

    await stripeService.handleWebhook({
      id: "evt_new_user",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_new_user",
          metadata: { userId: "usr_brand_new", packId: "starter" }
        }
      }
    });

    expect(db.wallets.get("usr_brand_new")?.availableCredits).toBe(300);
  });

  it("safely ignores non-checkout events and invalid metadata", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_ignore", 100);
    const stripeService = new StripeBillingService(db);

    // Non-checkout event
    await stripeService.handleWebhook({
      id: "evt_ignored",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_123",
          metadata: { userId: "usr_ignore", packId: "popular" }
        }
      }
    });
    expect(db.wallets.get("usr_ignore")?.availableCredits).toBe(100);

    // Missing userId
    await stripeService.handleWebhook({
      id: "evt_no_user",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_no_user",
          metadata: { packId: "popular" }
        }
      }
    });
    expect(db.wallets.get("usr_ignore")?.availableCredits).toBe(100);

    // Missing or invalid packId
    await stripeService.handleWebhook({
      id: "evt_bad_pack",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_bad_pack",
          metadata: { userId: "usr_ignore", packId: "nonexistent_pack" }
        }
      }
    });
    expect(db.wallets.get("usr_ignore")?.availableCredits).toBe(100);
  });

  it("processes webhook requests via Hono routes", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_route", 0);
    const stripeService = new StripeBillingService(db);

    const app = new Hono();
    app.route("/v1/stripe", createStripeRoutes(stripeService));

    const res = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "evt_route_1",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_route_1",
            metadata: { userId: "usr_route", packId: "popular" }
          }
        }
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toEqual({ received: true });
    expect(db.wallets.get("usr_route")?.availableCredits).toBe(550);

    // Webhook replay over HTTP
    const resReplay = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "evt_route_1",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_route_1",
            metadata: { userId: "usr_route", packId: "popular" }
          }
        }
      })
    });

    expect(resReplay.status).toBe(200);
    expect(await resReplay.json()).toEqual({ received: true });
    expect(db.wallets.get("usr_route")?.availableCredits).toBe(550);
  });

  it("handles malformed JSON body in webhook route with 400 error", async () => {
    const db = new InMemoryDatabase();
    const stripeService = new StripeBillingService(db);

    const app = new Hono();
    app.route("/v1/stripe", createStripeRoutes(stripeService));

    const res = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json"
    });

    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toBeDefined();
  });
});
