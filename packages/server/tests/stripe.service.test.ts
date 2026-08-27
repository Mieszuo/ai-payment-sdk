import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { InMemoryDatabase } from "../src/adapters/in-memory-db";
import { StripeBillingService, TOPUP_PACKAGES } from "../src/services/stripe.service";
import { createStripeRoutes } from "../src/routes/stripe.routes";
import { formatAccountIdentifier } from "@ai-credits/shared";

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
          payment_status: "paid",
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
          payment_status: "paid",
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
          payment_status: "paid",
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
          payment_status: "paid",
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
          payment_status: "paid",
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
          payment_status: "paid",
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
            payment_status: "paid",
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
            payment_status: "paid",
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
          amount_paid: 50000,
          amount_refunded: 50000,
          metadata: { userId: "usr_refund_1", packId: "popular" }
        }
      }
    });

    const wallet = db.wallets.get("usr_refund_1");
    expect(wallet?.availableCredits).toBe(0); // 550 - 550 = 0

    // Verify REFUND transaction was recorded in ledger
    const tx = db.transactions.get("stripe_refund_ch_refund_1_50000");
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
          amount_paid: 50000,
          amount_refunded: 50000,
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

    // Duplicate dispute delivery must not add duplicate record
    await service.handleWebhook({
      id: "evt_disp_1_duplicate",
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
          payment_status: "paid",
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
          payment_status: "paid",
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

describe("Stripe Checkout Sessions", () => {
  it("creates a checkout session with server-side pack pricing and metadata", async () => {
    const db = new InMemoryDatabase();
    let capturedParams: any;
    const fakeStripe = {
      checkout: {
        sessions: {
          create: async (params: any) => {
            capturedParams = params;
            return {
              url: "https://checkout.stripe.com/c/pay/cs_test_1",
              id: "cs_test_1",
              mode: params.mode,
              line_items: params.line_items,
              metadata: params.metadata
            };
          }
        }
      }
    };
    const service = new StripeBillingService(db, "whsec_test");
    (service as any).stripeClient = fakeStripe;

    const result = await service.createCheckoutSession({
      packId: "popular",
      userId: "usr_checkout_1",
      successUrl: "https://app.example.com/success",
      cancelUrl: "https://app.example.com/cancel"
    });

    expect(result.url).toBe("https://checkout.stripe.com/c/pay/cs_test_1");
    expect(result.sessionId).toBe("cs_test_1");
    expect(capturedParams.mode).toBe("payment");
    expect(capturedParams.metadata).toEqual({ userId: "usr_checkout_1", packId: "popular" });
    expect(capturedParams.line_items[0].price_data.unit_amount).toBe(500); // popular pack price
    expect(capturedParams.line_items[0].price_data.currency).toBe("usd");
  });

  it("rejects unknown packs and missing Stripe configuration", async () => {
    const db = new InMemoryDatabase();
    const service = new StripeBillingService(db, "whsec_test");

    await expect(service.createCheckoutSession({
      packId: "nonexistent", userId: "u1",
      successUrl: "https://x/s", cancelUrl: "https://x/c"
    })).rejects.toThrow();

    expect(() => service.getCheckoutClient()).toThrow();
  });
});

describe("Stripe Webhook Payment Status Gate & Partial Refunds", () => {
  it("does not credit a checkout.session.completed with payment_status unpaid", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_unpaid", 100);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_unpaid",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_unpaid",
          payment_status: "unpaid",
          metadata: { userId: "usr_unpaid", packId: "popular" }
        }
      }
    });

    expect(db.wallets.get("usr_unpaid")?.availableCredits).toBe(100);
    expect(db.transactions.has("stripe_cs_unpaid")).toBe(false);
  });

  it("credits a checkout.session.completed with payment_status paid (existing behavior preserved)", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_paid", 0);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_paid",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_paid",
          payment_status: "paid",
          metadata: { userId: "usr_paid", packId: "popular" }
        }
      }
    });

    expect(db.wallets.get("usr_paid")?.availableCredits).toBe(550);
  });

  it("credits checkout.session.async_payment_succeeded when payment_status is paid", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_async", 0);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_async_ok",
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          id: "cs_async_ok",
          payment_status: "paid",
          metadata: { userId: "usr_async", packId: "starter" }
        }
      }
    });

    expect(db.wallets.get("usr_async")?.availableCredits).toBe(300);
  });

  it("ignores checkout.session.async_payment_succeeded while payment_status is unpaid", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_async_unpaid", 50);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_async_unpaid",
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          id: "cs_async_unpaid",
          payment_status: "unpaid",
          metadata: { userId: "usr_async_unpaid", packId: "starter" }
        }
      }
    });

    expect(db.wallets.get("usr_async_unpaid")?.availableCredits).toBe(50);
    expect(db.transactions.has("stripe_cs_async_unpaid")).toBe(false);
  });

  it("full refund debits the full pack (scaled by amount_refunded / amount_paid)", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_full_refund", 550);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_full_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_full_refund",
          amount_paid: 50000,
          amount_refunded: 50000,
          metadata: { userId: "usr_full_refund", packId: "popular" }
        }
      }
    });

    expect(db.wallets.get("usr_full_refund")?.availableCredits).toBe(0);
    const tx = db.transactions.get("stripe_refund_ch_full_refund_50000");
    expect(tx).toBeDefined();
    expect(tx?.transactionType).toBe("REFUND");
  });

  it("50% partial refund debits half the pack", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_half_refund", 300);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_half_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_half_refund",
          amount_paid: 30000,
          amount_refunded: 15000,
          metadata: { userId: "usr_half_refund", packId: "starter" }
        }
      }
    });

    expect(db.wallets.get("usr_half_refund")?.availableCredits).toBe(150);
    expect(db.transactions.has("stripe_refund_ch_half_refund_15000")).toBe(true);
  });

  it("a second refund raising to 75% debits only the additional quarter", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_step_refund", 300);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    const halfRefund = {
      id: "evt_half",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_step_refund",
          amount_paid: 30000,
          amount_refunded: 15000,
          metadata: { userId: "usr_step_refund", packId: "starter" }
        }
      }
    };
    const threeQuarterRefund = {
      id: "evt_3q",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_step_refund",
          amount_paid: 30000,
          amount_refunded: 22500,
          metadata: { userId: "usr_step_refund", packId: "starter" }
        }
      }
    };

    await service.handleWebhook(halfRefund);
    expect(db.wallets.get("usr_step_refund")?.availableCredits).toBe(150);

    // 75% of 300 = 225; the first event debited 150, so only 75 more.
    await service.handleWebhook(threeQuarterRefund);
    expect(db.wallets.get("usr_step_refund")?.availableCredits).toBe(75);
    expect(db.transactions.has("stripe_refund_ch_step_refund_22500")).toBe(true);
  });

  it("replaying the same refund event does not double-debit", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_replay_refund", 300);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    const refundEvent = {
      id: "evt_replay",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_replay_refund",
          amount_paid: 30000,
          amount_refunded: 15000,
          metadata: { userId: "usr_replay_refund", packId: "starter" }
        }
      }
    };

    await service.handleWebhook(refundEvent);
    await service.handleWebhook(refundEvent);
    await service.handleWebhook(refundEvent);
    expect(db.wallets.get("usr_replay_refund")?.availableCredits).toBe(150);
    expect(db.transactions.has("stripe_refund_ch_replay_refund_15000")).toBe(true);
  });

  it("falls back to a full-pack debit when amount_paid is missing", async () => {
    const db = new InMemoryDatabase();
    db.seedWallet("usr_legacy_refund", 550);
    const service = new StripeBillingService(db, "whsec_test_secret_123");

    await service.handleWebhook({
      id: "evt_legacy_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_legacy_refund",
          metadata: { userId: "usr_legacy_refund", packId: "popular" }
        }
      }
    });

    expect(db.wallets.get("usr_legacy_refund")?.availableCredits).toBe(0);
  });
});
