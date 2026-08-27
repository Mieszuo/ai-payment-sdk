import { Hono } from "hono";
import { StripeBillingService } from "../services/stripe.service";

export function createStripeRoutes(billingService: StripeBillingService) {
  const router = new Hono();

  router.post("/webhook", async (c) => {
    try {
      const rawBody = await c.req.text();

      if (billingService.hasWebhookSecret()) {
        const sig = c.req.header("stripe-signature");
        if (!sig || !billingService.verifySignature(rawBody, sig)) {
          return c.json({ error: "INVALID_SIGNATURE" }, 400);
        }
      }

      const event = JSON.parse(rawBody);
      await billingService.handleWebhook(event);
      return c.json({ received: true });
    } catch (err: any) {
      return c.json({ error: err.message || "Webhook processing failed" }, 400);
    }
  });

  return router;
}
