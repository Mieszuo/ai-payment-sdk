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

export class AICreditsWidget extends BaseElement {
  public stateMachine: WidgetStateMachine;
  private overlay: HTMLElement | null = null;
  private balanceEl: HTMLElement | null = null;
  private currentBalance: number = 20;
  private selectedProvider: string = "openai";

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
        <div class="modal-overlay" id="overlay">
          <div class="modal-container">
            <button class="close-btn" id="closeBtn" aria-label="Close modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div class="modal-body">
              <!-- Left Column: Auth & Credits -->
              <div class="col-left">
                <div class="header-brand">
                  <div class="brand-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div class="header-title">
                    <h2>Use AI</h2>
                    <p>Log in to continue and unlock AI features</p>
                  </div>
                </div>

                <div class="auth-stack">
                  <!-- Google -->
                  <button class="social-btn social-btn-google" id="btnGoogle">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <!-- GitHub -->
                  <button class="social-btn social-btn-github" id="btnGithub">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                    Continue with GitHub
                  </button>

                  <div class="divider"><span>or</span></div>

                  <!-- Email Magic Link -->
                  <div class="email-input-group">
                    <input type="email" class="email-input" id="emailInput" placeholder="Email address" />
                    <button class="email-btn" id="btnEmail">Continue with Email</button>
                  </div>
                </div>

                <!-- Balance -->
                <div class="balance-card">
                  <div class="balance-left">
                    <div class="balance-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </div>
                    <div>
                      <div class="balance-label">Your balance</div>
                      <div class="balance-val"><span id="displayBalance">20</span> AI credits</div>
                    </div>
                  </div>
                </div>

                <!-- Add AI Credits -->
                <div class="credits-section">
                  <div>
                    <div class="section-subtitle">Add AI credits</div>
                    <div class="section-subtext">More credits, more possibilities.</div>
                  </div>
                  <div class="packs-grid">
                    <div class="pack-card" data-price="1" data-credits="100">
                      <span class="pack-price">$1</span>
                      <span class="pack-credits">100</span>
                      <span class="pack-sublabel">credits</span>
                    </div>
                    <div class="pack-card" data-price="3" data-credits="350">
                      <span class="pack-price">$3</span>
                      <span class="pack-credits">350</span>
                      <span class="pack-sublabel">credits</span>
                      <span class="pack-bonus">+17%</span>
                    </div>
                    <div class="pack-card popular" data-price="5" data-credits="650">
                      <span class="pack-badge">Popular</span>
                      <span class="pack-price">$5</span>
                      <span class="pack-credits">650</span>
                      <span class="pack-sublabel">credits</span>
                      <span class="pack-bonus">+30%</span>
                    </div>
                    <div class="pack-card" data-price="10" data-credits="1400">
                      <span class="pack-price">$10</span>
                      <span class="pack-credits">1,400</span>
                      <span class="pack-sublabel">credits</span>
                      <span class="pack-bonus">+40%</span>
                    </div>
                  </div>
                  <div class="stripe-note">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Secure payment powered by Stripe
                  </div>
                </div>
              </div>

              <!-- Right Column: AI Provider Selection -->
              <div class="col-right">
                <div>
                  <h3 style="font-size: 16px; font-weight: 700; color: #ffffff;">Choose AI provider</h3>
                  <p style="font-size: 12px; color: #71717a; margin-top: 3px;">Select which AI model you want to use.</p>
                </div>

                <div class="provider-list">
                  <!-- OpenAI -->
                  <div class="provider-card selected" data-provider="openai">
                    <div class="provider-info">
                      <div class="provider-logo" style="background: #10a37f; color: white;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1636a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="provider-name-row">
                          <span class="provider-title">OpenAI</span>
                          <span class="provider-badge">Recommended</span>
                        </div>
                        <div class="provider-desc">GPT-4o, o1, o3-mini models for reasoning & text.</div>
                      </div>
                    </div>
                    <div class="radio-circle"><div class="radio-dot"></div></div>
                  </div>

                  <!-- Google Gemini -->
                  <div class="provider-card" data-provider="gemini">
                    <div class="provider-info">
                      <div class="provider-logo" style="background: #1e293b; color: white;">
                        <svg width="22" height="22" viewBox="0 0 24 24">
                          <defs>
                            <linearGradient id="geminiSparkleW" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stop-color="#4E82EE" />
                              <stop offset="50%" stop-color="#9B72CB" />
                              <stop offset="100%" stop-color="#D96570" />
                            </linearGradient>
                          </defs>
                          <path fill="url(#geminiSparkleW)" d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12Z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="provider-name-row">
                          <span class="provider-title">Google Gemini</span>
                        </div>
                        <div class="provider-desc">Gemini 1.5/2.0 Flash multimodal models.</div>
                      </div>
                    </div>
                    <div class="radio-circle"><div class="radio-dot"></div></div>
                  </div>

                  <!-- DeepSeek -->
                  <div class="provider-card" data-provider="deepseek">
                    <div class="provider-info">
                      <div class="provider-logo" style="background: #0284c7; color: white;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 3.32 1.62 6.26 4.11 8.08-.07-.63-.11-1.27-.11-1.92 0-5.06 3.63-9.27 8.44-9.98C13.58 6.4 12.83 4.8 12 2zm1.88 7.02C8.52 9.53 4.2 13.85 4.2 19.21c0 .96.14 1.89.4 2.76A9.97 9.97 0 0 0 12 22c5.523 0 10-4.477 10-10 0-4.84-3.44-8.87-8.12-9.78 0 0 1.25 3.5-0.00 6.8z" />
                          <circle cx="16" cy="11.5" r="1.5" fill="#ffffff" />
                        </svg>
                      </div>
                      <div>
                        <div class="provider-name-row">
                          <span class="provider-title">DeepSeek</span>
                        </div>
                        <div class="provider-desc">DeepSeek V3 & R1 with ultra-low token cost.</div>
                      </div>
                    </div>
                    <div class="radio-circle"><div class="radio-dot"></div></div>
                  </div>

                  <!-- Anthropic Claude -->
                  <div class="provider-card" data-provider="claude">
                    <div class="provider-info">
                      <div class="provider-logo" style="background: #d97757; color: white;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="m4.743 19.348 2.046-3.543H2.711l-.818 1.417a2.046 2.046 0 0 0 1.772 3.069h1.078v-.943Zm3.364-5.829H3.725l-.818 1.417h4.378l.822-1.417Zm11.15 5.829a2.046 2.046 0 0 0 1.772-3.069l-.818-1.417h-4.078l2.046 3.543h1.078v.943Zm-3.364-5.829h4.382l-.818-1.417h-4.386l.822 1.417ZM12 2.606a2.046 2.046 0 0 0-1.772 1.023L3.109 16.035h3.069L12 5.829l5.822 10.206h3.069L13.772 3.629A2.046 2.046 0 0 0 12 2.606Zm0 6.444-3.069 5.372h6.138L12 9.05Z" />
                        </svg>
                      </div>
                      <div>
                        <div class="provider-name-row">
                          <span class="provider-title">Anthropic Claude</span>
                        </div>
                        <div class="provider-desc">Claude 3.5 Sonnet & Haiku for coding.</div>
                      </div>
                    </div>
                    <div class="radio-circle"><div class="radio-dot"></div></div>
                  </div>
                </div>

                <!-- Trust Footer -->
                <div class="value-props">
                  <div class="value-prop-item">
                    <div class="value-prop-header">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      Secure & private
                    </div>
                    <div class="value-prop-desc">Your data is encrypted and never shared.</div>
                  </div>
                  <div class="value-prop-item">
                    <div class="value-prop-header">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
                        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path>
                      </svg>
                      Pay as you go
                    </div>
                    <div class="value-prop-desc">Only pay for what you use.</div>
                  </div>
                  <div class="value-prop-item">
                    <div class="value-prop-header">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                      </svg>
                      Works anywhere
                    </div>
                    <div class="value-prop-desc">Use in any project with our SDK.</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-disclaimer">
              By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </div>
          </div>
        </div>
      `;

      shadow.appendChild(style);
      shadow.appendChild(container);

      this.overlay = shadow.getElementById("overlay");
      this.balanceEl = shadow.getElementById("displayBalance");

      // Wire close button & backdrop
      shadow.getElementById("closeBtn")?.addEventListener("click", () => this.close());
      this.overlay?.addEventListener("click", (e) => {
        if (e.target === this.overlay) this.close();
      });

      // Wire Provider selector
      const providerCards = shadow.querySelectorAll<HTMLElement>(".provider-card");
      providerCards.forEach((card) => {
        card.addEventListener("click", () => {
          providerCards.forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
          this.selectedProvider = card.dataset.provider || "openai";
          this.dispatchEvent(new CustomEvent("provider-selected", { detail: { provider: this.selectedProvider } }));
        });
      });

      // Wire Credit Pack purchase
      const packCards = shadow.querySelectorAll<HTMLElement>(".pack-card");
      packCards.forEach((pack) => {
        pack.addEventListener("click", () => {
          const credits = Number(pack.dataset.credits || 100);
          const price = Number(pack.dataset.price || 1);
          this.addCredits(credits);
          this.dispatchEvent(new CustomEvent("credit-purchased", {
            detail: { credits, price, newBalance: this.currentBalance }
          }));
        });
      });

      // Wire Auth buttons
      shadow.getElementById("btnGoogle")?.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("auth-requested", { detail: { provider: "google" } }));
      });
      shadow.getElementById("btnGithub")?.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("auth-requested", { detail: { provider: "github" } }));
      });
      shadow.getElementById("btnEmail")?.addEventListener("click", () => {
        const email = (shadow.getElementById("emailInput") as HTMLInputElement)?.value;
        this.dispatchEvent(new CustomEvent("auth-requested", { detail: { provider: "email", email } }));
      });
    }
  }

  public open() {
    if (this.overlay) {
      this.overlay.classList.add("open");
    }
  }

  public close() {
    if (this.overlay) {
      this.overlay.classList.remove("open");
    }
  }

  public setBalance(credits: number) {
    this.currentBalance = credits;
    if (this.balanceEl) {
      this.balanceEl.textContent = String(credits);
    }
  }

  public addCredits(amount: number) {
    this.currentBalance += amount;
    this.setBalance(this.currentBalance);
  }

  public getBalance(): number {
    return this.currentBalance;
  }
}

export * from "./styles";
export * from "./state";

if (typeof customElements !== "undefined" && !customElements.get("ai-credits-widget")) {
  customElements.define("ai-credits-widget", AICreditsWidget);
}
