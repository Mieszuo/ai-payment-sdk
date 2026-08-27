import { formatAccountIdentifier, LedgerTransaction } from "@platform/shared";
import { InMemoryDatabase } from "../adapters/in-memory-db";

export const TOPUP_PACKAGES = {
  starter: { priceCents: 300, credits: 300 },
  popular: { priceCents: 500, credits: 550 },
  power: { priceCents: 1000, credits: 1200 }
} as const;

export class StripeBillingService {
  constructor(private db: InMemoryDatabase) {}

  async handleWebhook(event: { id: string; type: string; data: { object: any } }) {
    if (event.type !== "checkout.session.completed") {
      return;
    }

    const session = event.data.object;
    const userId = session.metadata?.userId;
    const packId = session.metadata?.packId as keyof typeof TOPUP_PACKAGES;

    if (!userId || !packId || !(packId in TOPUP_PACKAGES)) {
      return;
    }

    const pack = TOPUP_PACKAGES[packId];
    const idempotencyKey = `stripe_${session.id}`;

    await this.db.runInTransaction(async () => {
      // If already processed, exit early (idempotent replay)
      if (this.db.processedIdempotencyKeys.has(idempotencyKey)) {
        return;
      }

      const tx: LedgerTransaction = {
        idempotencyKey,
        transactionType: "TOPUP",
        referenceId: session.id,
        entries: [
          {
            accountIdentifier: formatAccountIdentifier("PLATFORM_CLEARING"),
            amountCredits: -pack.credits
          },
          {
            accountIdentifier: formatAccountIdentifier("USER_WALLET", userId),
            amountCredits: pack.credits
          }
        ],
        metadata: { sessionId: session.id, amountCents: pack.priceCents }
      };

      await this.db.executeLedgerTransaction(tx);

      const wallet = this.db.wallets.get(userId);
      if (wallet) {
        wallet.availableCredits += pack.credits;
      } else {
        this.db.seedWallet(userId, pack.credits);
      }
    });
  }
}
