import React, { useState } from "react";
import { LandingHeader } from "./components/LandingHeader";
import { HeroSection } from "./components/HeroSection";
import { ArchitectureComparison } from "./components/ArchitectureComparison";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { ProfitCalculator } from "./components/ProfitCalculator";
import { FeatureGrid } from "./components/FeatureGrid";
import { LiveActionDemo } from "./components/LiveActionDemo";
import { LandingFooter } from "./components/LandingFooter";
import { AIPaymentModal } from "@platform/react";

export const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection onOpenModal={() => setIsModalOpen(true)} />
        <ArchitectureComparison />
        <HowItWorksSection />
        <ProfitCalculator />
        <FeatureGrid />
        <LiveActionDemo />
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
