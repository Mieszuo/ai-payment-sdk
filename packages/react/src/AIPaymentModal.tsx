import React, { useState } from "react";
import { OpenAILogo, GeminiLogo, DeepSeekLogo, ClaudeLogo, StripeLogo } from "./ProviderLogos";

export interface AIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance?: number;
  onCreditPurchased?: (credits: number, price: number) => void;
  onAuthRequested?: (provider: "google" | "github" | "email", email?: string) => void;
}

export const AIPaymentModal: React.FC<AIPaymentModalProps> = ({
  isOpen,
  onClose,
  initialBalance = 20,
  onCreditPurchased,
  onAuthRequested
}) => {
  const [balance, setBalance] = useState(initialBalance);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [email, setEmail] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePurchase = (credits: number, price: number) => {
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
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "16px",
        fontFamily: "'Inter', -apple-system, sans-serif",
        colorScheme: "dark"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#0f1117",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "860px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8)",
          color: "#f4f4f5",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Toast message banner */}
        {toastMessage && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#10b981",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              padding: "6px 16px",
              borderRadius: "999px",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
              zIndex: 20
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "transparent",
            border: "none",
            color: "#71717a",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          aria-label="Close modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            padding: "32px"
          }}
        >
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>Use AI</h2>
                <p style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>
                  Log in to continue and unlock AI features
                </p>
              </div>
            </div>

            {/* Social Auth */}
            {authenticatedUser ? (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span style={{ fontSize: "10px", color: "#10b981", textTransform: "uppercase", fontWeight: 700 }}>
                    Authenticated
                  </span>
                  <div style={{ fontSize: "13px", color: "#f4f4f5", fontWeight: 600, fontFamily: "monospace" }}>
                    {authenticatedUser}
                  </div>
                </div>
                <button
                  onClick={() => setAuthenticatedUser(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#71717a",
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
                    padding: "11px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "#ffffff",
                    color: "#09090b",
                    border: "none"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
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
                    padding: "11px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "#18181b",
                    color: "#ffffff",
                    border: "1px solid #27272a"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  Continue with GitHub
                </button>

                <div style={{ display: "flex", alignItems: "center", color: "#52525b", fontSize: "11px", textTransform: "uppercase" }}>
                  <div style={{ flex: 1, borderBottom: "1px solid #27272a" }}></div>
                  <span style={{ padding: "0 10px" }}>or</span>
                  <div style={{ flex: 1, borderBottom: "1px solid #27272a" }}></div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email.trim()) handleLogin("email", email.trim());
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "10px",
                      color: "#f4f4f5",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "11px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Continue with Email
                  </button>
                </form>
              </div>
            )}

            {/* Balance */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "#18181b",
                border: "1px solid #27272a"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#818cf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#71717a", textTransform: "uppercase" }}>Your balance</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", fontFamily: "monospace" }}>
                    {balance.toLocaleString()} AI credits
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Packs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#e4e4e7" }}>Add AI credits</div>
                <div style={{ fontSize: "11px", color: "#818cf8" }}>More credits, more possibilities.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[
                  { price: 1, credits: 100 },
                  { price: 3, credits: 350, bonus: "+17%" },
                  { price: 5, credits: 650, bonus: "+30%", popular: true },
                  { price: 10, credits: 1400, bonus: "+40%" }
                ].map((pack) => (
                  <div
                    key={pack.price}
                    onClick={() => handlePurchase(pack.credits, pack.price)}
                    style={{
                      background: pack.popular ? "rgba(99, 102, 241, 0.08)" : "#18181b",
                      border: pack.popular ? "1px solid #6366f1" : "1px solid #27272a",
                      borderRadius: "12px",
                      padding: "10px 4px",
                      textAlign: "center",
                      cursor: "pointer",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                      transition: "transform 0.1s ease, border-color 0.1s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#818cf8")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = pack.popular ? "#6366f1" : "#27272a")}
                  >
                    {pack.popular && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-8px",
                          background: "#6366f1",
                          color: "#ffffff",
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "999px",
                          textTransform: "uppercase"
                        }}
                      >
                        Popular
                      </span>
                    )}
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>${pack.price}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#a1a1aa", fontFamily: "monospace" }}>
                      {pack.credits.toLocaleString()}
                    </span>
                    <span style={{ fontSize: "9px", color: "#71717a" }}>credits</span>
                    {pack.bonus && (
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#a78bfa", marginTop: "2px" }}>
                        {pack.bonus}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "#71717a",
                  marginTop: "4px"
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Secure payment powered by Stripe
              </div>
            </div>
          </div>

          {/* Right Column: AI Providers */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>Choose AI provider</h3>
              <p style={{ fontSize: "12px", color: "#71717a", marginTop: "3px" }}>Select which AI model you want to use.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  id: "openai",
                  name: "OpenAI",
                  badge: "Recommended",
                  desc: "GPT-4o, o1, o3-mini models for reasoning & text.",
                  color: "#10a37f",
                  icon: <OpenAILogo size={20} className="text-white" />
                },
                {
                  id: "gemini",
                  name: "Google Gemini",
                  desc: "Gemini 1.5/2.0 Flash multimodal models.",
                  color: "#1e293b",
                  icon: <GeminiLogo size={22} />
                },
                {
                  id: "deepseek",
                  name: "DeepSeek",
                  desc: "DeepSeek V3 & R1 with ultra-low token cost.",
                  color: "#0284c7",
                  icon: <DeepSeekLogo size={20} className="text-white" />
                },
                {
                  id: "claude",
                  name: "Anthropic Claude",
                  desc: "Claude 3.5 Sonnet & Haiku for elite coding.",
                  color: "#d97757",
                  icon: <ClaudeLogo size={20} className="text-white" />
                }
              ].map((p) => {
                const isSelected = selectedProvider === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProvider(p.id);
                      showToast(`AI Provider switched to ${p.name}`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: isSelected ? "rgba(99, 102, 241, 0.08)" : "#18181b",
                      border: isSelected ? "1px solid #6366f1" : "1px solid #27272a",
                      borderRadius: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: p.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          flexShrink: 0
                        }}
                      >
                        {p.icon}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>{p.name}</span>
                          {p.badge && (
                            <span
                              style={{
                                background: "rgba(99, 102, 241, 0.2)",
                                color: "#a5b4fc",
                                border: "1px solid rgba(99, 102, 241, 0.3)",
                                fontSize: "9px",
                                fontWeight: 600,
                                padding: "1px 5px",
                                borderRadius: "999px"
                              }}
                            >
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#71717a", marginTop: "1px" }}>{p.desc}</div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: isSelected ? "2px solid #6366f1" : "2px solid #3f3f46",
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

            {/* Value Props Footer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #27272a",
                marginTop: "auto"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#e4e4e7" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Secure & private
                </div>
                <div style={{ fontSize: "10px", color: "#71717a", lineHeight: 1.3 }}>
                  Your data is encrypted and never shared.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#e4e4e7" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path>
                  </svg>
                  Pay as you go
                </div>
                <div style={{ fontSize: "10px", color: "#71717a", lineHeight: 1.3 }}>
                  Only pay for what you use.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#e4e4e7" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                  </svg>
                  Works anywhere
                </div>
                <div style={{ fontSize: "10px", color: "#71717a", lineHeight: 1.3 }}>
                  Use in any project with our SDK.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            color: "#52525b",
            padding: "12px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            background: "rgba(0, 0, 0, 0.2)"
          }}
        >
          By continuing, you agree to our <a href="#" style={{ color: "#71717a" }}>Terms of Service</a> and{" "}
          <a href="#" style={{ color: "#71717a" }}>Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
};
