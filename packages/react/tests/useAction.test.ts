import { describe, it, expect } from "bun:test";
import React from "react";
import { createAI, AIClient } from "@platform/sdk";
import { useAction, useWallet, AIProvider, useAI, AIContext } from "../src";

function createHookRunner(contextClient: AIClient | null = null) {
  const states: any[] = [];
  const effects: Array<() => void> = [];
  let stateIndex = 0;

  const dispatcher = {
    useContext: (ctx: any) => {
      if (ctx === AIContext) {
        return contextClient;
      }
      return null;
    },
    useState: (initial: any) => {
      const idx = stateIndex++;
      if (states[idx] === undefined) {
        states[idx] = typeof initial === "function" ? initial() : initial;
      }
      const setState = (val: any) => {
        states[idx] = typeof val === "function" ? val(states[idx]) : val;
      };
      return [states[idx], setState];
    },
    useCallback: (cb: any) => cb,
    useEffect: (effect: () => any) => {
      effects.push(effect);
    },
    useMemo: (fn: any) => fn(),
    useRef: (init: any) => ({ current: init }),
  };

  const internals =
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

  function run<T>(hookFn: () => T): { current: T; runEffects: () => void } {
    stateIndex = 0;
    effects.length = 0;
    const isReact19 = internals.H !== undefined;
    const prev = isReact19 ? internals.H : internals.ReactCurrentDispatcher.current;

    if (isReact19) {
      internals.H = dispatcher;
    } else {
      internals.ReactCurrentDispatcher.current = dispatcher;
    }

    let current: T;
    try {
      current = hookFn();
    } finally {
      if (isReact19) {
        internals.H = prev;
      } else {
        internals.ReactCurrentDispatcher.current = prev;
      }
    }

    return {
      current,
      runEffects: () => {
        for (const eff of effects) {
          eff();
        }
      }
    };
  }

  return { run };
}

describe("React Integration Hooks", () => {
  it("exports AIProvider, useAI, useAction, and useWallet correctly", () => {
    const ai = createAI({ project: "pk_test", mock: true });
    expect(ai).toBeDefined();
    expect(AIProvider).toBeDefined();
    expect(useAI).toBeDefined();
    expect(useAction).toBeDefined();
    expect(useWallet).toBeDefined();
  });

  describe("AIProvider and useAI", () => {
    it("renders AIProvider with client and children", () => {
      const ai = createAI({ project: "pk_test", mock: true });
      const element = AIProvider({ client: ai, children: "child-node" });
      expect(element).toBeDefined();
      expect(element.type).toBe(AIContext.Provider);
      expect(element.props.value).toBe(ai);
      expect(element.props.children).toBe("child-node");
    });

    it("returns client when useAI is inside an AIProvider", () => {
      const ai = createAI({ project: "pk_test", mock: true });
      const { run } = createHookRunner(ai);
      const res = run(() => useAI());
      expect(res.current).toBe(ai);
    });

    it("throws error when useAI is called outside an AIProvider", () => {
      const { run } = createHookRunner(null);
      expect(() => run(() => useAI())).toThrow("useAI must be used within an <AIProvider>");
    });
  });

  describe("useAction", () => {
    it("executes an action successfully with explicit client in mock mode", async () => {
      const ai = createAI({ project: "pk_test", mock: true });
      const { run } = createHookRunner(null);
      let hook = run(() => useAction("test-action", ai));

      expect(hook.current.data).toBeNull();
      expect(hook.current.isPending).toBe(false);
      expect(hook.current.error).toBeNull();

      const output = await hook.current.execute({ prompt: "hello" });
      expect(output).toEqual({ mock: true, message: "Mock execution for test-action" } as any);

      hook = run(() => useAction("test-action", ai));
      expect(hook.current.data).toEqual({ mock: true, message: "Mock execution for test-action" } as any);
      expect(hook.current.isPending).toBe(false);
      expect(hook.current.error).toBeNull();
    });

    it("executes an action using context client", async () => {
      const ai = createAI({ project: "pk_test", mock: true });
      const { run } = createHookRunner(ai);
      let hook = run(() => useAction("context-action"));

      const output = await hook.current.execute({ key: "val" });
      expect(output).toEqual({ mock: true, message: "Mock execution for context-action" } as any);

      hook = run(() => useAction("context-action"));
      expect(hook.current.data).toEqual({ mock: true, message: "Mock execution for context-action" } as any);
    });

    it("throws error when execute is called without any client available", async () => {
      const { run } = createHookRunner(null);
      const hook = run(() => useAction("no-client-action"));

      await expect(hook.current.execute({})).rejects.toThrow(
        "No AIClient available. Wrap your app in <AIProvider client={...}> or pass client explicitly."
      );
    });

    it("handles action execution failure", async () => {
      const customClient = {
        action: async () => {
          throw new Error("Action execution failed");
        }
      } as unknown as AIClient;

      const { run } = createHookRunner(null);
      let hook = run(() => useAction("failing-action", customClient));

      await expect(hook.current.execute({})).rejects.toThrow("Action execution failed");

      hook = run(() => useAction("failing-action", customClient));
      expect(hook.current.error).toBeDefined();
      expect(hook.current.error?.message).toBe("Action execution failed");
      expect(hook.current.isPending).toBe(false);
    });
  });

  describe("useWallet", () => {
    it("fetches wallet balance on mount and refresh with explicit client", async () => {
      const ai = createAI({ project: "pk_test", mock: true });
      const { run } = createHookRunner(null);
      let hook = run(() => useWallet(ai));

      expect(hook.current.balance).toBeNull();
      expect(hook.current.isLoading).toBe(false);
      expect(hook.current.error).toBeNull();

      // Trigger initial effect
      hook.runEffects();
      await hook.current.refresh();

      hook = run(() => useWallet(ai));
      expect(hook.current.balance).toBe(999);
      expect(hook.current.isLoading).toBe(false);
      expect(hook.current.error).toBeNull();
    });

    it("fetches wallet balance with context client", async () => {
      const ai = createAI({ project: "pk_test", mock: true });
      const { run } = createHookRunner(ai);
      let hook = run(() => useWallet());

      hook.runEffects();
      await hook.current.refresh();

      hook = run(() => useWallet());
      expect(hook.current.balance).toBe(999);
      expect(hook.current.isLoading).toBe(false);
    });

    it("handles wallet fetch errors gracefully", async () => {
      const failingClient = {
        getWallet: async () => {
          throw new Error("Wallet service unavailable");
        }
      } as unknown as AIClient;

      const { run } = createHookRunner(null);
      let hook = run(() => useWallet(failingClient));

      await hook.current.refresh();

      hook = run(() => useWallet(failingClient));
      expect(hook.current.error).toBeDefined();
      expect(hook.current.error?.message).toBe("Wallet service unavailable");
      expect(hook.current.isLoading).toBe(false);
      expect(hook.current.balance).toBeNull();
    });

    it("safely handles no client scenario", async () => {
      const { run } = createHookRunner(null);
      const hook = run(() => useWallet());

      await hook.current.refresh();
      expect(hook.current.balance).toBeNull();
    });
  });
});
