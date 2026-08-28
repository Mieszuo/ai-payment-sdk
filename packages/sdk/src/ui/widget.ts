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
                          <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF"/>
                          <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#geminiSparkleWGreen)"/>
                          <defs>
                            <linearGradient id="geminiSparkleWGreen" x1="7" y1="15.5" x2="11" y2="12" gradientUnits="userSpaceOnUse">
                              <stop stop-color="#08B962"/>
                              <stop offset="1" stop-color="#F94543"/>
                            </linearGradient>
                          </defs>
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
                          <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"/>
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
                          <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"/>
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
