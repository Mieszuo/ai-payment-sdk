import React, { useState } from "react";
import { AgentPlatform } from "../../types";
import { X, Copy, Check, Bot } from "lucide-react";

export function generateAgentContext(platform: AgentPlatform, projectKey: string = "pk_live_demo123"): string {
  switch (platform) {
    case "cursor":
      return `# .cursorrules for AI Credits
You are an expert full-stack engineer integrating @ai-credits/sdk.

Rules:
1. Always initialize SDK with client public key:
   import { createAI } from "@ai-credits/sdk";
   const ai = createAI({ project: "${projectKey}" });

2. Call managed actions using structured inputs:
   const result = await ai.action("optimize-resume", { inputs: { cvText } });

3. Always handle INSUFFICIENT_CREDITS errors gracefully:
   try {
     await ai.action(...);
   } catch (err: any) {
     if (err.code === "INSUFFICIENT_CREDITS") {
       // trigger modal or widget topup
     }
   }

4. Never expose secret keys (sk_live_*) on the client side.`;

    case "claude":
      return `# Claude Code Tool Registration
claude mcp add ai-payment-gateway http://localhost:3000/v1/mcp

# Or prompt instruction for Claude:
"Use @ai-credits/sdk to invoke managed AI actions for project '${projectKey}'. Verify credit balance before execution and handle rate limit 429 retries."`;

    case "chatgpt":
      return `{
  "openapi": "3.1.0",
  "info": { "title": "AI Credits Gateway", "version": "1.0.0" },
  "servers": [{ "url": "http://localhost:3000/v1" }],
  "paths": {
    "/actions/{name}/execute": {
      "post": {
        "summary": "Execute Managed Action",
        "parameters": [{ "name": "name", "in": "path", "required": true, "schema": { "type": "string" } }],
        "requestBody": {
          "content": { "application/json": { "schema": { "type": "object", "properties": { "inputs": { "type": "object" } } } } }
        }
      }
    }
  }
}`;

    case "windsurf":
      return `# .windsurfrules for AI Credits SDK
- Framework: @ai-credits/sdk and @ai-credits/react
- Public Client Key: ${projectKey}
- Follow Two-Phase credit reservation pattern
- Component: <ai-payment-widget project="${projectKey}"></ai-payment-widget>`;

    case "mcp":
      return `{
  "mcpServers": {
    "ai-payment": {
      "command": "bunx",
      "args": ["@ai-credits/server", "--project", "${projectKey}"]
    }
  }
}`;
  }
}

export const TryInModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<AgentPlatform>("cursor");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const content = generateAgentContext(platform);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const platforms: { id: AgentPlatform; label: string }[] = [
    { id: "cursor", label: "Cursor (.cursorrules)" },
    { id: "claude", label: "Claude Code / CLI" },
    { id: "chatgpt", label: "ChatGPT (Custom GPT)" },
    { id: "windsurf", label: "Windsurf Rules" },
    { id: "mcp", label: "MCP Server Config" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel bg-zinc-950 border border-white/[0.12] p-6 shadow-2xl rounded-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              Ask AI / Export to AI Agents
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Export ready-to-use context, tools, and rules into your favorite AI assistant.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-1 py-3 overflow-x-auto border-b border-zinc-800/80">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                platform === p.id
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto my-4 bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 relative">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <pre className="font-mono text-xs text-zinc-200 leading-relaxed select-all whitespace-pre-wrap">
            {content}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs text-zinc-500">
          <span>AI-operable context format • Ready to paste</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
