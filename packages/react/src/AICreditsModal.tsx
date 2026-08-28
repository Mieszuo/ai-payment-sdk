import React, { useState } from "react";
import {
  OpenAILogo,
  GeminiLogo,
  DeepSeekLogo,
  ApplePayLogo,
  GooglePayLogo,
  VisaLogo,
  MastercardLogo
} from "./ProviderLogos";

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
  initialBalance = 142,
  onCreditPurchased,
  onAuthRequested,
  checkoutUrl,
  title = "Use AI",
  tagline = "Log in to continue and unlock AI features",
  accentColor = "#6366f1"
}) => {
  const [balance, setBalance] = useState(initialBalance);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [emailInput, setEmailInput] = useState("");
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
    const user = provider === "email" ? (customEmail || "developer@example.com") : `user_${provider}@gmail.com`;
    setAuthenticatedUser(user);
    showToast(`Signed in as ${user}`);
    if (onAuthRequested) {
      onAuthRequested(provider, customEmail);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      handleLogin("email", emailInput.trim());
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 5, 10, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "16px",
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        colorScheme: "dark"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(16, 18, 27, 0.92)",
          backdropFilter: "blur(32px) saturate(1.6)",
          WebkitBackdropFilter: "blur(32px) saturate(1.6)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 32px 100px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
          borderRadius: "28px",
          width: "100%",
          maxWidth: "920px",
          color: "#f3f1ff",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Toast Notification */}
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
              fontFamily: "monospace",
              fontWeight: 700,
              padding: "7px 18px",
              borderRadius: "100px",
              boxShadow: "0 10px 30px rgba(255, 255, 255, 0.3)",
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
            top: "22px",
            right: "22px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "rgba(243, 241, 255, 0.6)",
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

        {/* Main 2-Column Container */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "36px",
            padding: "36px 40px"
          }}
        >
          {/* LEFT COLUMN: Auth, Balance & Packs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header with Sparkle Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#818cf8",
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)"
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em", margin: 0 }}>
                  {title}
                </h2>
                <p style={{ fontSize: "12px", color: "rgba(243, 241, 255, 0.55)", marginTop: "3px", margin: 0 }}>
                  {tagline}
                </p>
              </div>
            </div>

            {/* Auth Section */}
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
                {/* 1. Google Button */}
                <button
                  onClick={() => handleLogin("google")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "#ffffff",
                    color: "#07060d",
                    border: "none",
                    boxShadow: "0 4px 14px rgba(255, 255, 255, 0.15)",
                    transition: "all 0.2s"
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

                {/* 2. GitHub Button */}
                <button
                  onClick={() => handleLogin("github")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "#f3f1ff",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    transition: "all 0.2s"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  Continue with GitHub
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
                  <span style={{ fontSize: "11px", color: "rgba(243, 241, 255, 0.4)", fontFamily: "sans-serif" }}>or</span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: accentColor,
                      color: "#ffffff",
                      border: "none",
                      boxShadow: `0 6px 20px ${accentColor}55`,
                      transition: "all 0.2s"
                    }}
                  >
                    Continue with Email
                  </button>
                </form>
              </div>
            )}

            {/* Balance Widget Card */}
            <div
              style={{
                padding: "14px 18px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#818cf8"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "rgba(243, 241, 255, 0.5)" }}>Your balance</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", fontFamily: "monospace" }}>
                    {balance}{" "}
                    <span style={{ fontSize: "12px", color: "rgba(243, 241, 255, 0.6)", fontWeight: 500 }}>
                      AI credits
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ color: "rgba(243, 241, 255, 0.4)", cursor: "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
            </div>

            {/* Add AI credits section */}
            <div
              style={{
                padding: "16px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Add AI credits</h4>
                  <span style={{ fontSize: "11px", color: "#818cf8" }}>More credits, more possibilities.</span>
                </div>
              </div>

              {/* 4 Packs Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[
                  { id: "pack_1", price: 1, credits: 100 },
                  { id: "pack_3", price: 3, credits: 350, bonus: "+17%" },
                  { id: "pack_5", price: 5, credits: 650, bonus: "+30%", popular: true },
                  { id: "pack_10", price: 10, credits: 1400, bonus: "+40%" },
                ].map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => handlePurchase(pack.credits, pack.price, pack.id)}
                    style={{
                      position: "relative",
                      padding: "12px 6px",
                      borderRadius: "14px",
                      background: pack.popular ? "rgba(99, 102, 241, 0.12)" : "rgba(255, 255, 255, 0.04)",
                      border: pack.popular ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: pack.popular ? "0 0 15px rgba(99, 102, 241, 0.25)" : "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "3px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {pack.popular && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          background: "#6366f1",
                          color: "#ffffff",
                          fontSize: "8px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: "999px",
                          letterSpacing: "0.05em"
                        }}
                      >
                        Popular
                      </div>
                    )}
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", fontFamily: "monospace" }}>
                      ${pack.price}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: pack.popular ? "#ffffff" : "rgba(243, 241, 255, 0.8)", fontFamily: "monospace" }}>
                      {pack.credits.toLocaleString()}
                    </span>
                    <span style={{ fontSize: "9px", color: "rgba(243, 241, 255, 0.4)", textTransform: "lowercase" }}>
                      credits
                    </span>
                    {pack.bonus && (
                      <span
                        style={{
                          marginTop: "2px",
                          fontSize: "8px",
                          fontFamily: "monospace",
                          color: pack.popular ? "#a5b4fc" : "rgba(243, 241, 255, 0.5)",
                          background: pack.popular ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.06)",
                          padding: "1px 5px",
                          borderRadius: "4px"
                        }}
                      >
                        {pack.bonus}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "10px",
                  color: "rgba(243, 241, 255, 0.4)"
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Choose AI Provider, Logos & Trust Badges */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "22px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: "0 0 4px" }}>
                Choose AI provider
              </h3>
              <p style={{ fontSize: "12px", color: "rgba(243, 241, 255, 0.55)", margin: "0 0 16px" }}>
                Select which AI model you want to use.
              </p>

              {/* Provider List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  {
                    id: "openai",
                    name: "OpenAI",
                    desc: "Most capable models for text, vision and more.",
                    recommended: true,
                    logo: <OpenAILogo size={18} />,
                    bg: "#10a37f"
                  },
                  {
                    id: "gemini",
                    name: "Google Gemini",
                    desc: "Powerful multimodal models from Google.",
                    logo: <GeminiLogo size={18} />,
                    bg: "#1e293b"
                  },
                  {
                    id: "deepseek",
                    name: "DeepSeek",
                    desc: "High-performance models at lower cost.",
                    logo: <DeepSeekLogo size={16} />,
                    bg: "#0284c7"
                  },
                ].map((p) => {
                  const isSelected = selectedProvider === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "16px",
                        background: isSelected ? "rgba(99, 102, 241, 0.1)" : "rgba(255, 255, 255, 0.04)",
                        border: isSelected ? "1.5px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: p.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff"
                          }}
                        >
                          {p.logo}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{p.name}</span>
                            {p.recommended && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 600,
                                  background: "rgba(99, 102, 241, 0.2)",
                                  color: "#a5b4fc",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid rgba(99, 102, 241, 0.3)"
                                }}
                              >
                                Recommended
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "rgba(243, 241, 255, 0.5)", marginTop: "2px" }}>
                            {p.desc}
                          </div>
                        </div>
                      </div>

                      {/* Radio Circle Indicator */}
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          border: isSelected ? "2px solid #6366f1" : "2px solid rgba(255, 255, 255, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {isSelected && (
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1" }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Brand Logos Under Providers (As requested) */}
              <div style={{ marginTop: "18px", padding: "12px 14px", borderRadius: "14px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(243, 241, 255, 0.4)", marginBottom: "8px", textAlign: "center" }}>
                  Supported Payment Methods
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                  <ApplePayLogo className="hover:opacity-90 transition-opacity" />
                  <GooglePayLogo className="hover:opacity-90 transition-opacity" />
                  <VisaLogo className="hover:opacity-90 transition-opacity" />
                  <MastercardLogo className="hover:opacity-90 transition-opacity" />
                </div>
              </div>
            </div>

            {/* 3 Trust Features Under Providers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#818cf8", fontSize: "11px", fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Secure & private</span>
                </div>
                <p style={{ fontSize: "10px", color: "rgba(243, 241, 255, 0.4)", margin: "3px 0 0", lineHeight: 1.3 }}>
                  Your data is encrypted and never shared.
                </p>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#818cf8", fontSize: "11px", fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <span>Pay as you go</span>
                </div>
                <p style={{ fontSize: "10px", color: "rgba(243, 241, 255, 0.4)", margin: "3px 0 0", lineHeight: 1.3 }}>
                  Only pay for what you use.
                </p>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#818cf8", fontSize: "11px", fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>Works anywhere</span>
                </div>
                <p style={{ fontSize: "10px", color: "rgba(243, 241, 255, 0.4)", margin: "3px 0 0", lineHeight: 1.3 }}>
                  Use in any project with our SDK.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Terms */}
        <div
          style={{
            padding: "14px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
            fontSize: "11px",
            color: "rgba(243, 241, 255, 0.45)"
          }}
        >
          By continuing, you agree to our <a href="#terms" style={{ color: "#818cf8", textDecoration: "none" }}>Terms of Service</a> and <a href="#privacy" style={{ color: "#818cf8", textDecoration: "none" }}>Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
};
