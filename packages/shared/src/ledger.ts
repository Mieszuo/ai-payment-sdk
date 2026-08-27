import { z } from "zod";

export const LedgerTransactionTypeSchema = z.enum([
  "TOPUP",
  "BONUS",
  "RESERVATION_HOLD",
  "SETTLEMENT",
  "RESERVATION_RELEASE",
  "REFUND"
]);

export type LedgerTransactionType = z.infer<typeof LedgerTransactionTypeSchema>;

export const LedgerEntrySchema = z.object({
  accountIdentifier: z.string().min(1),
  amountCredits: z.number().int()
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const LedgerTransactionSchema = z.object({
  idempotencyKey: z.string().min(1),
  transactionType: LedgerTransactionTypeSchema,
  referenceId: z.string().optional(),
  entries: z.array(LedgerEntrySchema).min(2),
  metadata: z.record(z.unknown()).default({})
});

export type LedgerTransaction = z.infer<typeof LedgerTransactionSchema>;
