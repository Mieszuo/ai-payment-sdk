import { DocArticle } from "../types";
import { CodeSnippet } from "../components/common/CodeSnippet";

export const advancedArticles: DocArticle[] = [
  {
    id: "architecture-ledger",
    sectionId: "advanced",
    title: "Double-Entry Ledger Invariants",
    description: "Mathematical guarantee that all credit transactions sum strictly to zero.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          The ledger enforces strict mathematical double-entry accounting where every transaction balances:
        </p>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300">
          <p className="text-blue-400">sum(entries.amountCredits) === 0</p>
        </div>

        <p className="text-xs text-zinc-400">
          For example, when a user executes a 15-credit action, <code>USER_WALLET</code> is debited <code>-15</code> and <code>PLATFORM_CLEARING</code> is credited <code>+15</code>.
        </p>
      </div>
    )
  },
  {
    id: "architecture-row-locking",
    sectionId: "advanced",
    title: "PostgreSQL Row-Level Locking",
    description: "Preventing parallel overdraw race conditions with SELECT ... FOR UPDATE.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          During credit reservation, the database acquires an exclusive row lock on the user's wallet:
        </p>
        <CodeSnippet
          language="sql"
          code={`SELECT available_credits, reserved_credits 
FROM wallets 
WHERE user_id = $1 
FOR UPDATE;`}
        />
        <p className="text-xs text-zinc-400">
          This serializes concurrent requests and eliminates double-spending race conditions.
        </p>
      </div>
    )
  },
  {
    id: "architecture-stripe-refunds",
    sectionId: "advanced",
    title: "Stripe Webhooks & Balanced Refunds",
    description: "Cryptographic HMAC-SHA256 verification and balanced REFUND transactions.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          When Stripe emits <code>charge.refunded</code>, the Gateway creates a balanced <code>REFUND</code> transaction (<code>USER_WALLET: -packCredits</code>, <code>PLATFORM_CLEARING: +packCredits</code>), protecting platform invariants against fraudulent chargebacks.
        </p>
      </div>
    )
  }
];
