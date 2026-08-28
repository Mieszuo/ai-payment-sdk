import { describe, it, expect } from "bun:test";
import { AICreditsWidget, WidgetStateMachine, WidgetState, WIDGET_CSS } from "../src/ui";
import * as SdkIndex from "../src/index";

describe("Shadow DOM Widget Isolation", () => {
  it("manages widget states properly in state machine", () => {
    const sm = new WidgetStateMachine();
    expect(sm.getState()).toBe("DRAWER");
    sm.transition("AUTH");
    expect(sm.getState()).toBe("AUTH");
    sm.transition("TOPUP");
    expect(sm.getState()).toBe("TOPUP");
    sm.transition("CONFIRM");
    expect(sm.getState()).toBe("CONFIRM");
  });

  it("tracks balance and open state in state machine with listeners", () => {
    const sm = new WidgetStateMachine();
    let updates = 0;
    const unsubscribe = sm.subscribe((data) => {
      updates++;
      if (updates === 1) {
        expect(data.balance).toBe(500);
      } else if (updates === 2) {
        expect(data.isOpen).toBe(true);
      }
    });

    sm.setBalance(500);
    expect(sm.getData().balance).toBe(500);

    sm.setOpen(true);
    expect(sm.getData().isOpen).toBe(true);

    unsubscribe();
    sm.setBalance(1000);
    expect(updates).toBe(2);
    expect(sm.getData().balance).toBe(1000);
  });

  it("attaches shadow root in open mode and renders encapsulated container", () => {
    const widget = new AICreditsWidget();
    expect(widget.shadowRoot).toBeDefined();
    expect(widget.shadowRoot?.mode).toBe("open");
    expect(widget.stateMachine).toBeInstanceOf(WidgetStateMachine);
  });

  it("exports widget and state components from root SDK package", () => {
    expect((SdkIndex as any).AICreditsWidget).toBeDefined();
    expect((SdkIndex as any).WidgetStateMachine).toBeDefined();
    expect((SdkIndex as any).WIDGET_CSS).toBeDefined();
  });

  it("contains responsive bottom-sheet styles in WIDGET_CSS", () => {
    expect(WIDGET_CSS).toContain(":host");
    expect(WIDGET_CSS).toContain(".modal-overlay");
    expect(WIDGET_CSS).toContain(".card");
    expect(WIDGET_CSS).toContain("@media (max-width: 640px)");
  });
});
