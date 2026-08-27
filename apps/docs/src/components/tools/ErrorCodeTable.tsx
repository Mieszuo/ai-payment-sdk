import React, { useState } from "react";
import { Search } from "lucide-react";

export interface ErrorDefinition {
  code: string;
  httpStatus: number;
  description: string;
  recovery: string;
}

export const ERROR_DEFINITIONS: ErrorDefinition[] = [
  {
    code: "INSUFFICIENT_CREDITS",
    httpStatus: 402,
    description: "User wallet does not have enough available credits for this action.",
    recovery: "Prompt the user to top up their wallet or open <ai-payment-widget>."
  },
  {
    code: "RATE_LIMITED",
    httpStatus: 429,
    description: "Action execution frequency exceeded configured sliding-window threshold.",
    recovery: "Wait for the duration specified in the Retry-After header before retrying."
  },
  {
    code: "UNAUTHORIZED",
    httpStatus: 401,
    description: "Missing, expired, or invalid PKCE session Bearer token.",
    recovery: "Re-authenticate the user via ai.authenticate() or widget login."
  },
  {
    code: "INVALID_INPUT",
    httpStatus: 400,
    description: "Input payload does not satisfy required prompt template variables or JSON schema.",
    recovery: "Inspect error.details and validate form fields before re-submitting."
  },
  {
    code: "ACTION_NOT_FOUND",
    httpStatus: 404,
    description: "The requested actionName has not been published in this project.",
    recovery: "Check the action slug in Developer Dashboard or publish a new version."
  },
  {
    code: "PROVIDER_ERROR",
    httpStatus: 502,
    description: "Upstream LLM provider (OpenAI / Gemini) returned an unhandled error.",
    recovery: "Ensure configured API keys are valid or configure a fallbackModel."
  },
  {
    code: "OUTPUT_VALIDATION_FAILED",
    httpStatus: 502,
    description: "Model output failed validation against the registered output JSON schema.",
    recovery: "Tighten system prompt instructions or switch to a higher-capability model."
  },
  {
    code: "ABORTED",
    httpStatus: 499,
    description: "The client cancelled or closed the request before the model finished.",
    recovery: "No credits are deducted. Safely discard response."
  }
];

export const ErrorCodeTable: React.FC = () => {
  const [filter, setFilter] = useState("");

  const filtered = ERROR_DEFINITIONS.filter(
    (e) => e.code.toLowerCase().includes(filter.toLowerCase()) || e.description.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="my-6 glass-panel overflow-hidden">
      <div className="p-3.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-zinc-200">Standard Error Code Matrix</span>
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Filter error codes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/40 border-b border-zinc-800 text-[11px] text-zinc-400 font-medium">
            <tr>
              <th className="py-2.5 px-4">Error Code</th>
              <th className="py-2.5 px-4">HTTP</th>
              <th className="py-2.5 px-4">Trigger Condition</th>
              <th className="py-2.5 px-4">Recommended Handling</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {filtered.map((err) => (
              <tr key={err.code} className="hover:bg-zinc-900/30 transition-colors">
                <td className="py-3 px-4 font-mono font-semibold text-rose-400 text-[11px] whitespace-nowrap">
                  {err.code}
                </td>
                <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap">{err.httpStatus}</td>
                <td className="py-3 px-4 text-zinc-300">{err.description}</td>
                <td className="py-3 px-4 text-zinc-400">{err.recovery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
