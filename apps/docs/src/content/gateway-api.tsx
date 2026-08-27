import { DocArticle } from "../types";
import { CodeSnippet } from "../components/common/CodeSnippet";

export const gatewayApiArticles: DocArticle[] = [
  {
    id: "api-overview",
    sectionId: "gateway-api",
    title: "Gateway REST API Overview",
    description: "HTTP specifications for authentication, action execution, and developer management.",
    content: (
      <div className="space-y-6">
        <p className="text-xs text-zinc-300">
          The AI Credits Gateway exposes standard JSON REST endpoints on port 3000 (or custom URL):
        </p>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 space-y-2">
          <p><span className="text-blue-400">POST</span> /v1/auth/authorize      → Issue PKCE authorization code</p>
          <p><span className="text-blue-400">POST</span> /v1/auth/token          → Exchange code for session JWT</p>
          <p><span className="text-blue-400">POST</span> /v1/actions/:name/execute → Execute Managed Action</p>
          <p><span className="text-emerald-400">GET</span>  /v1/wallet               → Get wallet balance snapshot</p>
          <p><span className="text-blue-400">POST</span> /v1/developer/actions   → Publish new action version (sk_live_*)</p>
          <p><span className="text-blue-400">POST</span> /v1/stripe/webhook      → Process signed payment top-ups</p>
        </div>
      </div>
    )
  },
  {
    id: "api-execute",
    sectionId: "gateway-api",
    title: "POST /v1/actions/:name/execute",
    description: "Core action execution endpoint with credit reservation and model call.",
    content: (
      <div className="space-y-6">
        <CodeSnippet
          language="http"
          code={`POST /v1/actions/optimize-resume/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <session_jwt_token>
Content-Type: application/json
x-request-id: req_123456789

{
  "inputs": {
    "cvText": "Staff Distributed Systems Engineer",
    "targetRole": "Principal Architect"
  }
}`}
        />
      </div>
    )
  },
  {
    id: "api-developer",
    sectionId: "gateway-api",
    title: "POST /v1/developer/actions",
    description: "Administrative action publishing endpoint requiring sk_live_* authorization.",
    content: (
      <div className="space-y-6">
        <CodeSnippet
          language="http"
          code={`POST /v1/developer/actions HTTP/1.1
Host: localhost:3000
Authorization: Bearer sk_live_demo_secret_456
Content-Type: application/json

{
  "actionName": "optimize-resume",
  "model": "gpt-4o-mini",
  "priceCredits": 15,
  "maxProviderCostCents": 5,
  "systemPrompt": "Executive Recruiter...",
  "userPromptTemplate": "CV: {{cvText}}"
}`}
        />
      </div>
    )
  }
];
