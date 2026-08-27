import { useState, useEffect, useCallback, useContext } from "react";
import { AIClient } from "@ai-credits/sdk";
import { AIContext } from "./context";

export function useWallet(explicitClient?: AIClient) {
  const contextClient = useContext(AIContext);
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
