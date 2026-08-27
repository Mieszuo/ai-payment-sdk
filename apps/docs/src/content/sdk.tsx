import { DocArticle } from "../types";
import { CodeSnippet } from "../components/common/CodeSnippet";
import { ErrorCodeTable } from "../components/tools/ErrorCodeTable";

export const sdkArticles: DocArticle[] = [
  {
    id: "sdk-core",
    sectionId: "sdk",
    title: "@ai-credits/sdk Core Reference",
    description: "Client SDK initialization, action dispatching, and wallet subscriptions.",
    content: (
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-white">createAI(options)</h3>
        <p className="text-xs text-zinc-300">Creates a configured AI client instance.</p>
        <CodeSnippet
          code={`import { createAI } from "@ai-credits/sdk";

const ai = createAI({
  project: "pk_live_demo123",       // Client public key
  baseUrl: "http://localhost:3000", // Optional gateway URL
  mock: false                       // Enable local simulation mode
});`}
        />

        <h3 className="text-sm font-semibold text-white pt-2">ai.action(actionName, options)</h3>
        <p className="text-xs text-zinc-300">Invokes a managed action with structured inputs.</p>
        <CodeSnippet
          code={`const result = await ai.action("optimize-resume", {
  inputs: {
    cvText: "Senior React Developer",
    targetRole: "Tech Lead"
  },
  mode: "Live" // "Mock" | "Live"
});

console.log(result.output);   // Structured response
console.log(result.runId);    // Execution snapshot ID
console.log(result.durationMs); // End-to-end latency`}
        />

        <h3 className="text-sm font-semibold text-white pt-2">ai.getWallet() &amp; ai.subscribeBalance()</h3>
        <CodeSnippet
          code={`// Fetch current balance snapshot
const wallet = await ai.getWallet();
console.log(wallet.availableCredits, wallet.reservedCredits);

// Subscribe to real-time balance changes
const unsubscribe = ai.subscribeBalance((newBalance) => {
  console.log("Updated balance:", newBalance);
});`}
        />
      </div>
    )
  },
  {
    id: "sdk-react",
    sectionId: "sdk",
    title: "@ai-credits/react Hooks",
    description: "Declarative React 19 hooks for state, wallet balance, and action execution.",
    content: (
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-white">useAction(actionName)</h3>
        <p className="text-xs text-zinc-300">Stateful hook for triggering actions with loading and error states.</p>
        <CodeSnippet
          code={`import { useAction } from "@ai-credits/react";

function EvaluateComponent() {
  const { execute, isPending, data, error, runId } = useAction("optimize-resume");

  return (
    <button onClick={() => execute({ cvText: "..." })} disabled={isPending}>
      {isPending ? "Executing..." : "Run Action"}
    </button>
  );
}`}
        />

        <h3 className="text-sm font-semibold text-white pt-2">useWallet()</h3>
        <CodeSnippet
          code={`import { useWallet } from "@ai-credits/react";

function BalanceBadge() {
  const { availableCredits, reservedCredits, isLoading, refresh } = useWallet();
  return <span>{availableCredits} credits</span>;
}`}
        />
      </div>
    )
  },
  {
    id: "sdk-widget",
    sectionId: "sdk",
    title: "Web Component <ai-payment-widget>",
    description: "Zero-dependency Shadow DOM custom element with auth and top-ups.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          Mount the custom element in any HTML or template. It provides a slide-over modal for Google PKCE login and Stripe Checkout top-ups:
        </p>
        <CodeSnippet
          language="html"
          code={`<ai-payment-widget project="pk_live_demo123"></ai-payment-widget>`}
        />
      </div>
    )
  },
  {
    id: "sdk-errors",
    sectionId: "sdk",
    title: "SDK Error Reference",
    description: "Standardized error codes, HTTP mappings, and client recovery strategies.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          All client and gateway errors conform to <code>PlatformError</code> with a unique machine-readable <code>code</code>:
        </p>

        <CodeSnippet
          code={`import { ai } from "./ai";

try {
  const res = await ai.action("optimize-resume", { inputs });
} catch (err: any) {
  switch (err.code) {
    case "INSUFFICIENT_CREDITS":
      // User needs top-up
      document.querySelector("ai-payment-widget")?.setAttribute("open", "true");
      break;
    case "RATE_LIMITED":
      console.warn("Too many requests. Retry after:", err.retryAfter);
      break;
    default:
      console.error(err.message);
  }
}`}
        />

        <ErrorCodeTable />
      </div>
    )
  }
];
