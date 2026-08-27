export const WIDGET_CSS = `
  :host {
    all: initial;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color-scheme: dark;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    padding: 16px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
  }
  .modal-overlay.open {
    opacity: 1;
    visibility: visible;
  }
  .modal-container, .card {
    background: #0f1117;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    width: 100%;
    max-width: 860px;
    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
    color: #f4f4f5;
    position: relative;
    overflow: hidden;
    transform: scale(0.96);
    transition: transform 0.2s ease;
  }
  .modal-overlay.open .modal-container,
  .modal-overlay.open .card {
    transform: scale(1);
  }
  @media (max-width: 640px) {
    .modal-overlay {
      align-items: flex-end;
    }
    .modal-container, .card {
      width: 100%;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: transparent;
    border: none;
    color: #71717a;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease, background 0.15s ease;
    z-index: 10;
  }
  .close-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }
  .modal-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    padding: 32px;
  }
  @media (max-width: 768px) {
    .modal-body {
      grid-template-columns: 1fr;
      gap: 24px;
      padding: 24px;
      max-height: 85vh;
      overflow-y: auto;
    }
  }

  /* Left Column */
  .col-left, .col-right {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .header-brand {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .brand-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    flex-shrink: 0;
  }
  .header-title h2 {
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .header-title p {
    font-size: 12px;
    color: #71717a;
    margin-top: 4px;
  }

  /* Social Auth Buttons */
  .auth-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 11px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }
  .social-btn-google {
    background: #ffffff;
    color: #09090b;
  }
  .social-btn-google:hover {
    background: #f4f4f5;
  }
  .social-btn-github {
    background: #18181b;
    color: #ffffff;
    border-color: #27272a;
  }
  .social-btn-github:hover {
    background: #27272a;
  }
  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: #52525b;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #27272a;
  }
  .divider span {
    padding: 0 10px;
  }

  .email-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .email-input {
    width: 100%;
    padding: 10px 14px;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 10px;
    color: #f4f4f5;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .email-input:focus {
    border-color: #3b82f6;
  }
  .email-btn {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 11px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .email-btn:hover {
    opacity: 0.92;
  }

  /* Balance Card */
  .balance-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: 12px;
    background: #18181b;
    border: 1px solid #27272a;
  }
  .balance-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .balance-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .balance-label {
    font-size: 10px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .balance-val {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Credit Packs */
  .credits-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .section-subtitle {
    font-size: 12px;
    font-weight: 600;
    color: #e4e4e7;
  }
  .section-subtext {
    font-size: 11px;
    color: #818cf8;
    margin-top: 1px;
  }
  .packs-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .pack-card {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 10px 6px;
    text-align: center;
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .pack-card:hover {
    border-color: #3f3f46;
    background: #202024;
  }
  .pack-card.popular {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.06);
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.2);
  }
  .pack-badge {
    position: absolute;
    top: -8px;
    background: #6366f1;
    color: #ffffff;
    font-size: 9px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 999px;
    text-transform: uppercase;
  }
  .pack-price {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
  }
  .pack-credits {
    font-size: 11px;
    font-weight: 600;
    color: #a1a1aa;
    font-family: 'JetBrains Mono', monospace;
  }
  .pack-sublabel {
    font-size: 9px;
    color: #71717a;
  }
  .pack-bonus {
    font-size: 10px;
    font-weight: 700;
    color: #a78bfa;
    margin-top: 2px;
  }
  .stripe-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
    color: #71717a;
    margin-top: 4px;
  }

  /* Right Column: AI Providers */
  .provider-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .provider-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .provider-card:hover {
    border-color: #3f3f46;
  }
  .provider-card.selected {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.08);
  }
  .provider-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .provider-logo {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .provider-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .provider-title {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }
  .provider-badge {
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.3);
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 999px;
  }
  .provider-desc {
    font-size: 11px;
    color: #71717a;
    margin-top: 2px;
  }
  .radio-circle {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #3f3f46;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .provider-card.selected .radio-circle {
    border-color: #6366f1;
  }
  .radio-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6366f1;
    display: none;
  }
  .provider-card.selected .radio-dot {
    display: block;
  }

  /* Value Props Footer */
  .value-props {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #27272a;
    margin-top: auto;
  }
  .value-prop-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .value-prop-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #e4e4e7;
  }
  .value-prop-desc {
    font-size: 10px;
    color: #71717a;
    line-height: 1.3;
  }

  .modal-disclaimer {
    text-align: center;
    font-size: 11px;
    color: #52525b;
    padding: 12px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.2);
  }
  .modal-disclaimer a {
    color: #71717a;
    text-decoration: underline;
  }
`;
