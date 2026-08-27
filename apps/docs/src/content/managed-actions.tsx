import React from "react";
import { DocArticle } from "../types";
import { CodeSnippet } from "../components/common/CodeSnippet";
import { EconomicsCalculator } from "../components/tools/EconomicsCalculator";

export const managedActionsArticles: DocArticle[] = [
  {
    id: "action-definition",
    sectionId: "managed-actions",
    title: "Action Definition & Publishing",
    description: "Specifying prompts, models, economics, and security constraints.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          Managed actions are declared with full system and user prompt definitions:
        </p>

        <CodeSnippet
          code={`interface ActionPublishPayload {
  actionName: string;            // Unique action identifier slug
  model: string;                 // "gpt-4o-mini" | "gemini-1.5-flash"
  priceCredits: number;          // User price (15 credits = $0.15)
  maxProviderCostCents: number;  // Margin guard ceiling (e.g. 5 cents)
  systemPrompt: string;          // Confidential backend system instruction
  userPromptTemplate: string;    // Template with {{variables}}
  outputSchema?: Record<string, any>; // JSON schema
  rateLimit?: {
    maxRequests: number;
    windowSeconds: number;
  };
}`}
        />
      </div>
    )
  },
  {
    id: "prompts-variables",
    sectionId: "managed-actions",
    title: "Prompt Templates & Variables",
    description: "Dynamic variable substitution using mustache {{variableName}} syntax.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          User prompt templates use double braces to denote required parameters:
        </p>
        <CodeSnippet
          code={`userPromptTemplate: "Candidate CV:\\n{{cvText}}\\n\\nTarget Role:\\n{{targetRole}}"

// At execution time:
ai.action("optimize-resume", {
  inputs: {
    cvText: "...",
    targetRole: "Staff Engineer"
  }
});`}
        />
      </div>
    )
  },
  {
    id: "margin-guard",
    sectionId: "managed-actions",
    title: "Pricing & Margin Guard",
    description: "Enforcing minimum gross margins and bounding provider token spend.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          The Margin Guard calculates expected net spread before executing requests:
        </p>
        <EconomicsCalculator />
      </div>
    )
  },
  {
    id: "rate-limits",
    sectionId: "managed-actions",
    title: "Sliding-Window Rate Limiting",
    description: "Distributed token bucket rate limiting with HTTP 429 and Retry-After headers.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          Rate limits are enforced per user per action using a sliding window algorithm:
        </p>
        <CodeSnippet
          code={`rateLimit: {
  maxRequests: 10,
  windowSeconds: 60
}

// Breaches return:
// HTTP 429 Too Many Requests
// Retry-After: 42`}
        />
      </div>
    )
  },
  {
    id: "versioning-rollbacks",
    sectionId: "managed-actions",
    title: "Versioning & Zero-Downtime Rollbacks",
    description: "Managing immutable versions v1, v2, v3 and restoring earlier snapshots.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          Every publish creates an incrementing version record. To rollback, publish or activate previous version settings without mutating historical audit records.
        </p>
      </div>
    )
  }
];
