import { useState, useCallback } from "react";
import { AIClient } from "@platform/sdk";
import { useAI } from "./context";

export function useAction<TInput = any, TOutput = any>(
  actionName: string,
  explicitClient?: AIClient
) {
  // Try to use explicitClient if provided, otherwise context client if in provider
  let contextClient: AIClient | null = null;
  try {
    contextClient = useAI();
  } catch {
    // context not present, will rely on explicitClient
  }

  const client = explicitClient || contextClient;

  const [data, setData] = useState<TOutput | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (inputs: TInput) => {
    if (!client) {
      throw new Error("No AIClient available. Wrap your app in <AIProvider client={...}> or pass client explicitly.");
    }
    setIsPending(true);
    setError(null);
    try {
      const res = await client.action<TInput, TOutput>(actionName, { inputs });
      setData(res.output);
      return res.output;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [client, actionName]);

  return { execute, data, isPending, error };
}
