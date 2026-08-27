export type WidgetState = "AUTH" | "TOPUP" | "CONFIRM" | "DRAWER";

export interface WidgetStateData {
  state: WidgetState;
  balance: number;
  selectedPack?: "starter" | "popular" | "power";
  isOpen: boolean;
}

export class WidgetStateMachine {
  private data: WidgetStateData = {
    state: "DRAWER",
    balance: 0,
    isOpen: false,
  };
  private listeners: ((data: WidgetStateData) => void)[] = [];

  getState(): WidgetState {
    return this.data.state;
  }

  getData(): WidgetStateData {
    return { ...this.data };
  }

  transition(nextState: WidgetState) {
    this.data.state = nextState;
    this.notify();
  }

  setBalance(balance: number) {
    this.data.balance = balance;
    this.notify();
  }

  setOpen(isOpen: boolean) {
    this.data.isOpen = isOpen;
    this.notify();
  }

  subscribe(fn: (data: WidgetStateData) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.data });
    }
  }
}
