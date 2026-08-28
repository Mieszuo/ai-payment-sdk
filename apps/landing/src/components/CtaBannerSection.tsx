import React from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { getEcosystemUrls } from "@ai-credits/shared";

export interface CtaBannerSectionProps {
  onOpenModal?: () => void;
}

export const CtaBannerSection: React.FC<CtaBannerSectionProps> = ({ onOpenModal }) => {
  const urls = getEcosystemUrls();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden card-dark-glass border border-blue-500/30 p-8 sm:p-12 lg:p-16">
        
        {/* Background glow flares */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to monetize your AI?
            </h2>
            <p className="text-base sm:text-lg text-zinc-300">
              Join thousands of developers building the future.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={onOpenModal}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={urls.docs}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#090f20]/90 hover:bg-[#0d162d] border border-blue-500/30 text-sm font-semibold text-zinc-200 hover:text-white transition-all"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>View Documentation</span>
              </a>
            </div>
          </div>

          {/* Right 3D Emblem Graphic */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Radial flare behind 3D emblem */}
              <div className="absolute inset-0 bg-blue-500/25 blur-3xl rounded-full" />
              <div className="absolute bottom-4 w-48 h-8 pedestal-glow rounded-full" />

              {/* 3D Delta Monolith */}
              <div className="relative z-10 w-36 h-36 rounded-3xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-400 p-[2px] shadow-2xl shadow-blue-500/50 transform hover:rotate-6 transition-transform duration-500">
                <div className="w-full h-full bg-[#070e20] rounded-[22px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-transparent to-indigo-900/40 pointer-events-none" />
                  
                  {/* Holographic Delta Symbol */}
                  <svg className="w-20 h-20 text-blue-300 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-8.5 15h17L12 3z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
