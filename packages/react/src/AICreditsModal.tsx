import React, { useState } from "react";
import {
  OpenAILogo,
  GeminiLogo,
  DeepSeekLogo
} from "./ProviderLogos";

export interface AICreditsModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialBalance?: number;
  onCreditPurchased?: (credits: number, price: number) => void;
  onAuthRequested?: (provider: "google" | "github" | "email", email?: string) => void;
  checkoutUrl?: (packId: string) => Promise<string>;
  title?: string;
  tagline?: string;
  accentColor?: string;
  isInline?: boolean;
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
  accentColor = "#6e44ff",
  isInline = false
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
    showToast(`+${credits.toLocaleString()} credits added ($${price})`);
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

  const modalContent = (
    <div
      style={{
        backgroundColor: "rgba(20, 23, 31, 0.96)",
        backdropFilter: "blur(40px) saturate(1.8)",
        WebkitBackdropFilter: "blur(40px) saturate(1.8)",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        boxShadow: "0 30px 90px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "840px",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        boxSizing: "border-box"
      }}
    >
      {/* Ambient purple spotlight in top-left */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          left: "-80px",
          width: "280px",
          height: "280px",
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(124, 58, 237, 0) 70%)",
          pointerEvents: "none"
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ffffff",
            color: "#0a0a0f",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 16px",
            borderRadius: "100px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
            zIndex: 50
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Right Close Button (✕) */}
      <button
        onClick={onClose || (() => {})}
        style={{
          position: "absolute",
          top: "18px",
          right: "18px",
          background: "transparent",
          border: "none",
          color: "rgba(255, 255, 255, 0.35)",
          cursor: "pointer",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.15s ease",
          zIndex: 20,
          padding: 0
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.35)")}
        aria-label="Close"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Main 2-Column Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "28px",
          padding: "28px 32px 20px"
        }}
      >
        {/* ==================== LEFT COLUMN ==================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Header Row: Sparkle Icon + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "2px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "11px",
                background: "linear-gradient(135deg, #381d77 0%, #1e1140 100%)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                boxShadow: "0 0 16px rgba(124, 58, 237, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c4b5fd",
                flexShrink: 0
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <path d="m12 2 2.4 7.2 7.2 2.4-7.2 2.4L12 21.2l-2.4-7.2L2.4 11.6l7.2-2.4L12 2Z" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 }}>
                {title}
              </h2>
              <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)", margin: "2px 0 0" }}>
                {tagline}
              </p>
            </div>
          </div>

          {/* Auth Section */}
          {authenticatedUser ? (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(94, 255, 168, 0.08)",
                border: "1px solid rgba(94, 255, 168, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <span style={{ fontSize: "9px", color: "#5effa8", textTransform: "uppercase", fontWeight: 700, fontFamily: "monospace" }}>
                  ✓ Logged In
                </span>
                <div style={{ fontSize: "11.5px", color: "#ffffff", fontWeight: 600, marginTop: "1px" }}>
                  {authenticatedUser}
                </div>
              </div>
              <button
                onClick={() => setAuthenticatedUser(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "11px",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Switch
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {/* 1. Continue with Google */}
              <button
                onClick={() => handleLogin("google")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: "9px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "none",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  transition: "opacity 0.15s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.95")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>

              {/* 2. Continue with GitHub */}
              <button
                onClick={() => handleLogin("github")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: "9px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "#161922",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  transition: "background 0.15s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1d212d")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#161922")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                Continue with GitHub
              </button>

              {/* Divider: or */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "1px 0" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.07)" }} />
                <span style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.3)" }}>or</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.07)" }} />
              </div>

              {/* 3. Email Input + Continue with Email */}
              <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "9px",
                    background: "#131620",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#ffffff",
                    fontSize: "12px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "9px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: accentColor,
                    color: "#ffffff",
                    border: "none",
                    boxShadow: `0 4px 14px ${accentColor}55`,
                    transition: "opacity 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Continue with Email
                </button>
              </form>
            </div>
          )}

          {/* Balance Widget Card */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "11px",
              background: "#161924",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "rgba(124, 58, 237, 0.2)",
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c4b5fd"
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m12 2 2.4 7.2 7.2 2.4-7.2 2.4L12 21.2l-2.4-7.2L2.4 11.6l7.2-2.4L12 2Z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "9.5px", color: "rgba(255, 255, 255, 0.4)" }}>Your balance</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", marginTop: "1px" }}>
                  {balance}{" "}
                  <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)", fontWeight: 400 }}>
                    AI credits
                  </span>
                </div>
              </div>
            </div>
            <div style={{ color: "rgba(255, 255, 255, 0.3)", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
          </div>

          {/* Add AI credits Box */}
          <div
            style={{
              padding: "12px 12px 9px",
              borderRadius: "12px",
              background: "#161924",
              border: "1px solid rgba(255, 255, 255, 0.07)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>Add AI credits</span>
              <span style={{ fontSize: "10px", color: "#8b5cf6", fontWeight: 500 }}>More credits, more possibilities.</span>
            </div>

            {/* 4 Packs Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {[
                { id: "pack_1", price: 1, credits: "100" },
                { id: "pack_3", price: 3, credits: "350", bonus: "+17%" },
                { id: "pack_5", price: 5, credits: "650", bonus: "+30%", popular: true },
                { id: "pack_10", price: 10, credits: "1,400", bonus: "+40%" },
              ].map((pack) => {
                const isPop = pack.popular;
                return (
                  <div
                    key={pack.id}
                    onClick={() => handlePurchase(parseInt(pack.credits.replace(",", "")), pack.price, pack.id)}
                    style={{
                      position: "relative",
                      padding: "10px 2px 8px",
                      borderRadius: "10px",
                      background: isPop ? "rgba(139, 92, 246, 0.12)" : "#131620",
                      border: isPop ? "1.5px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.06)",
                      boxShadow: isPop ? "0 0 16px rgba(139, 92, 246, 0.35)" : "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      cursor: "pointer",
                      transition: "transform 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    {isPop && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          background: "#8b5cf6",
                          color: "#ffffff",
                          fontSize: "8px",
                          fontWeight: 700,
                          padding: "1px 7px",
                          borderRadius: "100px",
                          letterSpacing: "0.02em"
                        }}
                      >
                        Popular
                      </div>
                    )}
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>
                      ${pack.price}
                    </span>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#ffffff" }}>
                      {pack.credits}
                    </span>
                    <span style={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.4)" }}>
                      credits
                    </span>
                    {pack.bonus && (
                      <span
                        style={{
                          marginTop: "2px",
                          fontSize: "8px",
                          fontWeight: 600,
                          color: isPop ? "#c4b5fd" : "#8b949e",
                          background: isPop ? "rgba(139, 92, 246, 0.3)" : "rgba(255, 255, 255, 0.05)",
                          padding: "1px 5px",
                          borderRadius: "3px"
                        }}
                      >
                        {pack.bonus}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Secure payment note */}
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                fontSize: "9.5px",
                color: "rgba(255, 255, 255, 0.35)"
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN ==================== */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: "0 0 2px" }}>
              Choose AI provider
            </h3>
            <p style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.45)", margin: "0 0 12px" }}>
              Select which AI model you want to use.
            </p>

            {/* Provider List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {[
                {
                  id: "openai",
                  name: "OpenAI",
                  desc: "Most capable models for text, vision and more.",
                  recommended: true,
                  logo: <OpenAILogo size={17} />,
                  bg: "#10a37f"
                },
                {
                  id: "gemini",
                  name: "Google Gemini",
                  desc: "Powerful multimodal models from Google.",
                  logo: <GeminiLogo size={17} />,
                  bg: "#1e293b"
                },
                {
                  id: "deepseek",
                  name: "DeepSeek",
                  desc: "High-performance models at lower cost.",
                  logo: <DeepSeekLogo size={15} />,
                  bg: "#0284c7"
                },
              ].map((p) => {
                const isSelected = selectedProvider === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    style={{
                      padding: "11px 14px",
                      borderRadius: "12px",
                      background: isSelected ? "rgba(139, 92, 246, 0.1)" : "#161924",
                      border: isSelected ? "1.5px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.07)",
                      boxShadow: isSelected ? "0 0 16px rgba(124, 58, 237, 0.2)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          background: p.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          flexShrink: 0
                        }}
                      >
                        {p.logo}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#ffffff" }}>{p.name}</span>
                          {p.recommended && (
                            <span
                              style={{
                                fontSize: "8.5px",
                                fontWeight: 600,
                                background: "rgba(124, 58, 237, 0.25)",
                                border: "1px solid rgba(124, 58, 237, 0.4)",
                                color: "#c4b5fd",
                                padding: "1px 5px",
                                borderRadius: "3px"
                              }}
                            >
                              Recommended
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.45)", marginTop: "1px" }}>
                          {p.desc}
                        </div>
                      </div>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        border: isSelected ? "2px solid #8b5cf6" : "2px solid rgba(255, 255, 255, 0.2)",
                        background: isSelected ? "#8b5cf6" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {isSelected && (
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ffffff" }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 Trust Features (1:1 with reference) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", paddingTop: "12px" }}>
            {/* Feature 1 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#818cf8", fontSize: "10.5px", fontWeight: 700 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Secure & private</span>
              </div>
              <p style={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.4)", margin: "2px 0 0", lineHeight: 1.3 }}>
                Your data is encrypted and never shared.
              </p>
            </div>

            {/* Feature 2 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#818cf8", fontSize: "10.5px", fontWeight: 700 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>Pay as you go</span>
              </div>
              <p style={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.4)", margin: "2px 0 0", lineHeight: 1.3 }}>
                Only pay for what you use.
              </p>
            </div>

            {/* Feature 3 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#818cf8", fontSize: "10.5px", fontWeight: 700 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Works anywhere</span>
              </div>
              <p style={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.4)", margin: "2px 0 0", lineHeight: 1.3 }}>
                Use in any project with our SDK.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Bottom Legal Line */}
      <div
        style={{
          padding: "10px 20px 16px",
          textAlign: "center",
          fontSize: "10.5px",
          color: "rgba(255, 255, 255, 0.35)"
        }}
      >
        By continuing, you agree to our <a href="#terms" style={{ color: "#818cf8", textDecoration: "none" }}>Terms of Service</a> and <a href="#privacy" style={{ color: "#818cf8", textDecoration: "none" }}>Privacy Policy</a>.
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        {modalContent}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 7, 13, 0.85)",
        backdropFilter: "blur(28px) saturate(1.5)",
        WebkitBackdropFilter: "blur(28px) saturate(1.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "16px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {modalContent}
    </div>
  );
};
