import { Hono } from "hono";
import { StripeBillingService } from "../services/stripe.service";

export function createStripeRoutes(billingService: StripeBillingService) {
  const router = new Hono();

  router.post("/webhook", async (c) => {
    try {
      const event = await c.req.json();
      await billingService.handleWebhook(event);
      return c.json({ received: true });
    } catch (err: any) {
      return c.json({ error: err.message || "Webhook processing failed" }, 400);
    }
  });

  return router;
}
