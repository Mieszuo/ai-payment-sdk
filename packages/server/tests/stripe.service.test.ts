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

describe("Stripe Production Signature & Refunds", () => {
  it("verifies valid HMAC-SHA256 signature and rejects invalid signatures", async () => {
    const db = new InMemoryDatabase();
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    expect(service.verifySignature(payload, "invalid_sig")).toBe(false);

    // Compute expected signature
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("whsec_test_secret_123"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
    const hexSig = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");

    expect(service.verifySignature(payload, hexSig)).toBe(true);
    expect(service.verifySignature(payload, `t=12345,v1=${hexSig}`)).toBe(true);
  });

  it("handles charge.refunded by deducting credited tokens via balanced REFUND transaction", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_refund_1", 550);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_refund_123",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_refund_1",
          metadata: { userId: "usr_refund_1", packId: "popular" }
        }
      }
    });

    const wallet = db.wallets.get("usr_refund_1");
    expect(wallet?.availableCredits).toBe(0); // 550 - 550 = 0

    // Verify REFUND transaction was recorded in ledger
    const tx = db.transactions.get("stripe_refund_ch_refund_1");
    expect(tx).toBeDefined();
    expect(tx?.transactionType).toBe("REFUND");
    expect(tx?.referenceId).toBe("ch_refund_1");
    expect(tx?.entries).toEqual([
      {
        accountIdentifier: formatAccountIdentifier("USER_WALLET", "usr_refund_1"),
        amountCredits: -550
      },
      {
        accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
        amountCredits: 550
      }
    ]);
  });

  it("ensures charge.refunded is idempotent and cannot deduct credits multiple times on replay", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_refund_idempotent", 550);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    const refundEvent = {
      id: "evt_refund_dup",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_refund_dup",
          metadata: { userId: "usr_refund_idempotent", packId: "popular" }
        }
      }
    };

    await service.handleWebhook(refundEvent);
    expect(db.wallets.get("usr_refund_idempotent")?.availableCredits).toBe(0);

    // Replay same refund event
    await service.handleWebhook(refundEvent);
    expect(db.wallets.get("usr_refund_idempotent")?.availableCredits).toBe(0); // Still 0, not -550
  });

  it("records dispute audit when charge.dispute.created is received", async () => {
    const db = new InMemoryDatabase();
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_disp_1",
      type: "charge.dispute.created",
      data: {
        object: {
          id: "dp_123",
          charge: "ch_test_dispute",
          amount: 500,
          reason: "fraudulent",
          status: "needs_response",
          metadata: { userId: "usr_dispute_1" }
        }
      }
    });

    expect(service.disputes.length).toBe(1);
    expect(service.disputes[0].disputeId).toBe("dp_123");
    expect(service.disputes[0].chargeId).toBe("ch_test_dispute");
    expect(service.disputes[0].amount).toBe(500);
  });

  it("enforces server-side pack validation strictly determined by server predefined packages", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_pack_test", 0);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    // Client attempts to tamper with credits amount via metadata
    await service.handleWebhook({
      id: "evt_tamper",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_tamper",
          metadata: { userId: "usr_pack_test", packId: "starter", credits: 999999 }
        }
      }
    });

    // Server should only credit exactly starter pack credits (300)
    expect(db.wallets.get("usr_pack_test")?.availableCredits).toBe(300);
  });

  it("validates webhook signature in HTTP route and rejects invalid signatures with 400 INVALID_SIGNATURE", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_http_test", 0);
    const service = new StripeBillingService(db, "whsec_route_secret");

    const app = new Hono();
    app.route("/v1/stripe", createStripeRoutes(service));

    const payload = JSON.stringify({
      id: "evt_http_sig",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_http_sig",
          metadata: { userId: "usr_http_test", packId: "popular" }
        }
      }
    });

    // Case 1: Missing signature header
    const resNoSig = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });
    expect(resNoSig.status).toBe(400);
    expect(await resNoSig.json()).toEqual({ error: "INVALID_SIGNATURE" });

    // Case 2: Invalid signature header
    const resBadSig = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=123,v1=bad_signature"
      },
      body: payload
    });
    expect(resBadSig.status).toBe(400);
    expect(await resBadSig.json()).toEqual({ error: "INVALID_SIGNATURE" });

    // Case 3: Valid signature
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("whsec_route_secret"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
    const hexSig = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");

    const resValidSig = await app.request("/v1/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": `t=12345,v1=${hexSig}`
      },
      body: payload
    });
    expect(resValidSig.status).toBe(200);
    expect(await resValidSig.json()).toEqual({ received: true });
    expect(db.wallets.get("usr_http_test")?.availableCredits).toBe(550);
  });
});
