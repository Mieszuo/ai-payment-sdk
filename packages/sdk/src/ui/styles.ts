export const WIDGET_CSS = `
  :host {
    all: initial;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  }
  .card {
    background: #ffffff;
    color: #1a1a1a;
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
  .btn-primary {
    background: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 12px;
    width: 100%;
    font-weight: 600;
    cursor: pointer;
  }
  @media (max-width: 640px) {
    .modal-overlay {
      align-items: flex-end;
    }
    .card {
      width: 100%;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
`;
