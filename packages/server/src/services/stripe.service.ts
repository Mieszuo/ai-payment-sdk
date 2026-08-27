import crypto from "node:crypto";
import { LedgerDatabase } from "../adapters/database";

export const TOPUP_PACKAGES = {
  starter: { priceCents: 300, credits: 300 },
  popular: { priceCents: 500, credits: 550 },
  power: { priceCents: 1000, credits: 1200 }
} as const;

export type TopupPackId = keyof typeof TOPUP_PACKAGES;

export interface StripeDisputeAudit {
  id: string;
  disputeId: string;
  chargeId?: string;
  amount?: number;
  reason?: string;
  status?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export class StripeBillingService {
  public disputes: StripeDisputeAudit[] = [];

  constructor(
    private db: LedgerDatabase,
    private webhookSecret?: string
  ) {}

  hasWebhookSecret(): boolean {
    return typeof this.webhookSecret === "string" && this.webhookSecret.length > 0;
  }

  getPackage(packId: string) {
    if (packId in TOPUP_PACKAGES) {
      return TOPUP_PACKAGES[packId as TopupPackId];
    }
    return undefined;
  }

  verifySignature(payload: string, signatureHeader: string): boolean {
    if (!this.webhookSecret || !signatureHeader || !payload) {
      return false;
    }

    const parts = signatureHeader.split(",").map((p) => p.trim());
    let timestamp: string | undefined;
    const signatures: string[] = [];

    for (const part of parts) {
      if (part.startsWith("t=")) {
        timestamp = part.slice(2);
      } else if (part.startsWith("v1=")) {
        signatures.push(part.slice(3));
      }
    }

    if (signatures.length === 0 && !signatureHeader.includes("=")) {
      signatures.push(signatureHeader.trim());
    }

    if (signatures.length === 0) {
      return false;
    }

    const directHmac = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");

    let timestampHmac: string | undefined;
    if (timestamp) {
      timestampHmac = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest("hex");
    }

    const safeCompare = (candidate: string, expected: string): boolean => {
      try {
        const bufA = Buffer.from(candidate, "utf-8");
        const bufB = Buffer.from(expected, "utf-8");
        if (bufA.length !== bufB.length) {
          return false;
        }
        return crypto.timingSafeEqual(bufA, bufB);
      } catch {
        return false;
      }
    };

    for (const sig of signatures) {
      if (safeCompare(sig, directHmac)) {
        return true;
      }
      if (timestampHmac && safeCompare(sig, timestampHmac)) {
        return true;
      }
    }

    return false;
  }

  async handleWebhook(event: { id: string; type: string; data: { object: any } }) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const packId = session.metadata?.packId as TopupPackId;

      if (!userId || !packId || !(packId in TOPUP_PACKAGES)) {
        return;
      }

      const pack = TOPUP_PACKAGES[packId];
      const idempotencyKey = `stripe_${session.id}`;

      // Top-up credits the wallet via a balanced ledger transaction; the
      // adapter derives the sign from the transaction type and is idempotent
      // on webhook replays.
      await this.db.applyCredit(userId, pack.credits, "TOPUP", idempotencyKey, session.id, {
        sessionId: session.id,
        amountCents: pack.priceCents
      });
      return;
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const userId = charge.metadata?.userId;
      const packId = charge.metadata?.packId as TopupPackId;

      if (!userId || !packId || !(packId in TOPUP_PACKAGES)) {
        return;
      }

      const pack = TOPUP_PACKAGES[packId];
      const idempotencyKey = `stripe_refund_${charge.id}`;

      // Refund debits the wallet via a balanced REFUND transaction (positive
      // pack credits — the adapter derives the negative delta).
      await this.db.applyCredit(userId, pack.credits, "REFUND", idempotencyKey, charge.id, {
        chargeId: charge.id,
        amountCents: pack.priceCents
      });
      return;
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object;
      const disputeRecord: StripeDisputeAudit = {
        id: event.id,
        disputeId: dispute.id,
        chargeId: dispute.charge,
        amount: dispute.amount,
        reason: dispute.reason,
        status: dispute.status,
        createdAt: new Date().toISOString(),
        metadata: dispute.metadata
      };
      if (!this.disputes.some((d) => d.disputeId === dispute.id)) {
        this.disputes.push(disputeRecord);
      }
      if ((this.db as any).disputes) {
        (this.db as any).disputes.set(dispute.id, disputeRecord);
      }
      return;
    }
  }
}
