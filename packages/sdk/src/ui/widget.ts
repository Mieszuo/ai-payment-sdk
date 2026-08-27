import { WIDGET_CSS } from "./styles";
import { WidgetStateMachine } from "./state";

// Safe Base class in case window/HTMLElement is not defined (SSR or test environment)
const BaseElement =
  typeof HTMLElement !== "undefined"
    ? HTMLElement
    : (class MockHTMLElement {
        shadowRoot: any = null;
        attachShadow(init: { mode: string }) {
          this.shadowRoot = { mode: init.mode, innerHTML: "", appendChild: () => {} };
          return this.shadowRoot;
        }
      } as unknown as typeof HTMLElement);

export class AIPaymentWidget extends BaseElement {
  public stateMachine: WidgetStateMachine;

  constructor() {
    super();
    this.stateMachine = new WidgetStateMachine();
    const shadow = this.attachShadow({ mode: "open" });
    if (typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent = WIDGET_CSS;

      const container = document.createElement("div");
      container.className = "widget-root";
      container.innerHTML = `
        <div class="modal-overlay" style="display: none;">
          <div class="card">
            <h3>Universal AI Wallet</h3>
            <p>Zaloguj się, aby otrzymać 20 darmowych kredytów.</p>
            <button class="btn-primary">Kontynuuj z Google</button>
          </div>
        </div>
      `;

      shadow.appendChild(style);
      shadow.appendChild(container);
    }
  }
}

export * from "./styles";
export * from "./state";

if (typeof customElements !== "undefined" && !customElements.get("ai-payment-widget")) {
  customElements.define("ai-payment-widget", AIPaymentWidget);
}
