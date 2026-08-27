import { useState, useEffect, useCallback } from "react";
import { AIClient } from "@platform/sdk";
import { useAI } from "./context";

export function useWallet(explicitClient?: AIClient) {
  let contextClient: AIClient | null = null;
  try {
    contextClient = useAI();
  } catch {
    // context not present
  }

  const client = explicitClient || contextClient;

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    setError(null);
    try {
      const wallet = await client.getWallet();
      setBalance(wallet.availableCredits);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, refresh, isLoading, error };
}
