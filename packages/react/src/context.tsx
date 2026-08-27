import { createContext, useContext, type ReactNode } from "react";
import { AIClient } from "@platform/sdk";

export const AIContext = createContext<AIClient | null>(null);

export interface AIProviderProps {
  client: AIClient;
  children: ReactNode;
}

export function AIProvider({ client, children }: AIProviderProps) {
  return (
    <AIContext.Provider value={client}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI(): AIClient {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within an <AIProvider>");
  }
  return context;
}
