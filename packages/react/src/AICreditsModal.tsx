import React, { useState } from "react";
import { OpenAILogo, GeminiLogo, DeepSeekLogo, ClaudeLogo, StripeLogo } from "./ProviderLogos";

export interface AICreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance?: number;
  onCreditPurchased?: (credits: number, price: number) => void;
  onAuthRequested?: (provider: "google" | "github" | "email", email?: string) => void;
  /** When provided, pack clicks open a real Stripe Checkout session instead of simulating. */
  checkoutUrl?: (packId: string) => Promise<string>;
  title?: string;
  tagline?: string;
  accentColor?: string;
}

export const AICreditsModal: React.FC<AICreditsModalProps> = ({
  isOpen,
  onClose,
  initialBalance = 20,
  onCreditPurchased,
  onAuthRequested,
  checkoutUrl,
  title = "Use AI",
  tagline = "Log in to continue and unlock AI features",
  accentColor = "#4b2fd6"
}) => {
  const [balance, setBalance] = useState(initialBalance);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePurchase = async (credits: number, price: number, packId: string) => {
    if (checkoutUrl) {
      try {
        const url = await checkoutUrl(packId);
        window.location.href = url;
        return;
      } catch (err: any) {
        showToast(`Checkout error: ${err.message || "try again"}`);
        return;
      }
    }
    setBalance((prev) => prev + credits);
    showToast(`+${credits.toLocaleString()} credits added to your wallet ($${price}.00)`);
    if (onCreditPurchased) {
      onCreditPurchased(credits, price);
    }
  };

  const handleLogin = (provider: "google" | "github" | "email", customEmail?: string) => {
    const user = provider === "email" ? (customEmail || "developer@example.com") : `user_${provider}@example.com`;
    setAuthenticatedUser(user);
    showToast(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} (+20 bonus credits)`);
    if (!authenticatedUser) {
      setBalance((b) => b + 20);
    }
    if (onAuthRequested) {
      onAuthRequested(provider, customEmail);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(7, 6, 13, 0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "16px",
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        colorScheme: "dark"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(18, 16, 28, 0.88)",
          backdropFilter: "blur(28px) saturate(1.5)",
          WebkitBackdropFilter: "blur(28px) saturate(1.5)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow: "0 32px 90px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
          borderRadius: "28px",
          width: "100%",
          maxWidth: "840px",
          color: "#f3f1ff",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255, 255, 255, 0.95)",
              color: "#07060d",
              fontSize: "12px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              padding: "7px 18px",
              borderRadius: "100px",
              boxShadow: "0 10px 30px rgba(255, 255, 255, 0.25)",
              zIndex: 30
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "rgba(243, 241, 255, 0.7)",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease"
          }}
          aria-label="Close modal"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            padding: "36px"
          }}
        >
          {/* Left Column: Auth & Packs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  backgroundColor: accentColor,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em", margin: 0 }}>
                  {title}
                </h2>
                <p style={{ fontSize: "12px", color: "rgba(243, 241, 255, 0.6)", marginTop: "2px", margin: 0 }}>
                  {tagline}
                </p>
              </div>
            </div>

            {/* Social Auth */}
            {authenticatedUser ? (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "16px",
                  background: "rgba(94, 255, 168, 0.08)",
                  border: "1px solid rgba(94, 255, 168, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span style={{ fontSize: "10px", color: "#5effa8", textTransform: "uppercase", fontWeight: 700, fontFamily: "monospace" }}>
                    ✓ Logged In
                  </span>
                  <div style={{ fontSize: "12px", color: "#f3f1ff", fontWeight: 600, fontFamily: "monospace", marginTop: "2px" }}>
                    {authenticatedUser}
                  </div>
                </div>
                <button
                  onClick={() => setAuthenticatedUser(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(243, 241, 255, 0.5)",
                    fontSize: "11px",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Switch
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => handleLogin("google")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.95)",
                    color: "#07060d",
                    border: "none",
                    boxShadow: "0 6px 20px rgba(255, 255, 255, 0.2)",
                    transition: "transform 0.2s"
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={() => handleLogin("github")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#f3f1ff",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    backdropFilter: "blur(12px)"
                  }}
                >
                  <span>gh</span> Continue with GitHub
                </button>
              </div>
            )}

            {/* Balance Badge */}
            <div
              style={{
                padding: "14px 18px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <span style={{ fontSize: "10px", color: "rgba(243, 241, 255, 0.5)", textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                  Available Balance
                </span>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                  {balance.toLocaleString()} credits
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "#5effa8",
                  fontFamily: "monospace",
                  fontWeight: 600
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#5effa8", boxShadow: "0 0 8px #5effa8" }}></span>
                Universal Wallet
              </div>
            </div>

            {/* Credit Packs */}
            <div>
              <div style={{ fontSize: "11px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(243, 241, 255, 0.5)", marginBottom: "10px", letterSpacing: "0.08em" }}>
                Top-up Credit Packs
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[
                  { price: 1, credits: 100, id: "pack_100" },
                  { price: 3, credits: 350, id: "pack_350" },
                  { price: 5, credits: 650, id: "pack_650", popular: true },
                  { price: 10, credits: 1400, id: "pack_1400" },
                ].map((pack) => (
                  <button
                    key={pack.price}
                    onClick={() => handlePurchase(pack.credits, pack.price, pack.id)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: "14px",
                      background: pack.popular ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.05)",
                      border: pack.popular ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      transition: "all 0.2s"
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>${pack.price}</span>
                    <span style={{ fontSize: "10px", color: "rgba(243, 241, 255, 0.6)", fontFamily: "monospace" }}>
                      {pack.credits}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Providers & Stripe */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "20px" }}>
            <div>
              <div style={{ fontSize: "11px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(243, 241, 255, 0.5)", marginBottom: "12px", letterSpacing: "0.08em" }}>
                Supported AI Providers
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { id: "openai", name: "OpenAI GPT-4o", desc: "Fast & multimodal reasoning", logo: <OpenAILogo size={14} />, bg: "#10a37f" },
                  { id: "gemini", name: "Google Gemini 2.0", desc: "Ultra-fast contextual speed", logo: <GeminiLogo size={16} />, bg: "#18181b" },
                  { id: "deepseek", name: "DeepSeek V3/R1", desc: "Economical coding intelligence", logo: <DeepSeekLogo size={14} />, bg: "#0284c7" },
                  { id: "claude", name: "Anthropic Claude 3.5", desc: "Elite coding & architecture", logo: <ClaudeLogo size={14} />, bg: "#d97757" },
                ].map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "14px",
                      background: selectedProvider === provider.id ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.04)",
                      border: selectedProvider === provider.id ? "1px solid rgba(255, 255, 255, 0.28)" : "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "8px",
                          background: provider.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff"
                        }}
                      >
                        {provider.logo}
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{provider.name}</div>
                        <div style={{ fontSize: "10px", color: "rgba(243, 241, 255, 0.5)" }}>{provider.desc}</div>
                      </div>
                    </div>
                    {selectedProvider === provider.id && (
                      <span style={{ fontSize: "10px", color: "#5effa8", fontFamily: "monospace", fontWeight: 700 }}>
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                paddingTop: "14px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "11px",
                color: "rgba(243, 241, 255, 0.5)"
              }}
            >
              <StripeLogo size={14} className="opacity-80" />
              <span>Double-entry ledger with instant Stripe settlement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
