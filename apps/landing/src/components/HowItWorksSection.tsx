import React from "react";
import { Settings, User, DollarSign } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Settings,
    iconColor: "text-blue-400",
    bgColor: "bg-blue-600/10 border-blue-500/20",
    title: "Developer Defines Action",
    subtitle: "1 minute in the Dashboard",
    description: "Declare your system prompt, template variables, AI model, and credit price. Publish immutable action versions with your secret key (sk_live_*).",
    code: `POST /v1/developer/actions
{
  "actionName": "optimize-resume",
  "model": "gpt-4o-mini",
  "priceCredits": 15,
  "systemPrompt": "You are an executive recruiter...",
  "userPromptTemplate": "CV:\\n{{cvText}}"
}`
  },
  {
    number: "02",
    icon: User,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-600/10 border-amber-500/20",
    title: "User Authenticates via Widget",
    subtitle: "30 seconds for end-users",
    description: "Drop a single HTML tag into your page. Users sign in with Google, receive 20 free welcome credits, and can top up instantly via Stripe Checkout.",
    code: `<!-- One line of HTML -->
<ai-credits-widget
  project="pk_live_demo123">
</ai-credits-widget>

<!-- User gets: -->
<!-- Google PKCE login -->
<!-- 20 free credits on first sign-in -->
<!-- Stripe top-up when credits run out -->`
  },
  {
    number: "03",
    icon: DollarSign,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-600/10 border-emerald-500/20",
    title: "Automated Settlement & Payouts",
    subtitle: "Zero manual intervention",
    description: "The Gateway locks credits via two-phase reservation, executes the model with Margin Guard protection, and settles the margin profit into your developer account.",
    code: `// What happens under the hood:
// 1. Reserve 15 credits (SELECT...FOR UPDATE)
// 2. Execute GPT-4o-mini (cost: $0.004)
// 3. Settle: User -15cr, Platform +15cr
// 4. Payout: Developer gets ~$0.13 spread
// 5. Immutable audit record (SHA-256)

// Developer monthly payout: automatic`
  }
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">How It Works</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-lg mx-auto">
          From idea to revenue in 3 steps. No backend code, no Stripe account, no provider API keys on the client.
        </p>
      </div>

      <div className="space-y-8">
        {steps.map((step) => (
          <div key={step.number} className="glass-panel p-6 flex flex-col lg:flex-row gap-6">
            {/* Left: Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${step.bgColor} border flex items-center justify-center shrink-0`}>
                  <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Step {step.number}</span>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                </div>
              </div>
              <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-medium mb-3">
                {step.subtitle}
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">{step.description}</p>
            </div>

            {/* Right: Code */}
            <div className="lg:w-[45%] shrink-0">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800 text-[11px] font-mono text-zinc-500">
                  Step {step.number}
                </div>
                <pre className="p-3.5 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre select-all">
                  {step.code}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
