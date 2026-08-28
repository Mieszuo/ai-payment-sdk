import React, { useState, useEffect } from "react";
import { LandingHeader } from "./components/LandingHeader";
import { HeroSection } from "./components/HeroSection";
import { DeveloperFirstSection } from "./components/DeveloperFirstSection";
import { SimpleIntegrationSection } from "./components/SimpleIntegrationSection";
import { KeyStatsSection } from "./components/KeyStatsSection";
import { CtaBannerSection } from "./components/CtaBannerSection";
import { ProfitCalculator } from "./components/ProfitCalculator";
import { FeatureGrid } from "./components/FeatureGrid";
import { ComponentStudio } from "./components/ComponentStudio";
import { LandingFooter } from "./components/LandingFooter";
import { AICreditsModal } from "@ai-credits/react";

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
    <div className="min-h-screen bg-[#030712] text-zinc-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200 bg-cyber-grid">
      <LandingHeader
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <main className="flex-1">
        {activeView === "studio" ? (
          <ComponentStudio />
        ) : (
          <>
            {/* 1. Hero Section with 3D Holographic IDE & Connected Architecture */}
            <HeroSection onOpenModal={() => setIsModalOpen(true)} />

            {/* 2. Developer First: Feature Highlights & Interactive Dashboard Overview */}
            <DeveloperFirstSection />

            {/* 3. Simple Integration: 3 Lines of code in 3 Stepper Cards */}
            <SimpleIntegrationSection />

            {/* 4. Key Performance & Security Stats */}
            <KeyStatsSection />

            {/* 5. Production Grade Security & Invariants Grid */}
            <FeatureGrid />

            {/* 6. Interactive Monthly Profit Calculator */}
            <ProfitCalculator />

            {/* 7. Call To Action Banner with 3D Emblem */}
            <CtaBannerSection onOpenModal={() => setIsModalOpen(true)} />
          </>
        )}
      </main>

      <LandingFooter />

      {/* Drop-in AI Credits Modal */}
      <AICreditsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialBalance={142}
      />
    </div>
  );
};
