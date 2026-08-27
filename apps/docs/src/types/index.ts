import React from "react";

export type PackageManager = "bun" | "npm" | "pnpm" | "yarn";

export type AgentPlatform = "cursor" | "claude" | "chatgpt" | "windsurf" | "mcp";

export interface DocArticle {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

export interface DocSection {
  id: string;
  title: string;
  articles: { id: string; title: string }[];
}
