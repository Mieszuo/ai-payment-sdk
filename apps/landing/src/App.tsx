import React, { useState, useEffect } from "react";
import { LandingHeader } from "./components/LandingHeader";
import { HeroSection } from "./components/HeroSection";
import { ArchitectureComparison } from "./components/ArchitectureComparison";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { ProfitCalculator } from "./components/ProfitCalculator";
import { FeatureGrid } from "./components/FeatureGrid";
import { LiveActionDemo } from "./components/LiveActionDemo";
import { ComponentStudio } from "./components/ComponentStudio";
import { LandingFooter } from "./components/LandingFooter";
import { AIPaymentModal } from "@ai-credits/react";

export const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<"landing" | "studio">("landing");

  // Sync with URL hash
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#studio" || window.location.hash === "#components") {
        setActiveView("studio");
      } else if (window.location.hash === "" || window.location.hash === "#") {
        setActiveView("landing");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleSelectView = (view: "landing" | "studio") => {
    setActiveView(view);
    if (view === "studio") {
      window.location.hash = "studio";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <LandingHeader activeView={activeView} onSelectView={handleSelectView} />

      <main className="flex-1">
        {activeView === "studio" ? (
          <ComponentStudio />
        ) : (
          <>
            <HeroSection onOpenModal={() => setIsModalOpen(true)} />
            <ArchitectureComparison />
            <HowItWorksSection />
            <ProfitCalculator />
            <FeatureGrid />
            <LiveActionDemo />
          </>
        )}
      </main>

      <LandingFooter />

      {/* Drop-in AI Payment Modal matching exact design */}
      <AIPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialBalance={142}
      />
    </div>
  );
};
