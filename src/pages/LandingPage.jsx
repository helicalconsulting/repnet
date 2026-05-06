import React from 'react';
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import LogoStrip from "@/components/landing/LogoStrip";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
import DocsViewer from "@/components/landing/DocsViewer";
import TimelineSection from "@/components/landing/TimelineSection";
import PricingSection from "@/components/landing/PricingSection";
import WaitlistSection from "@/components/landing/WaitlistSection";
import Footer from "@/components/landing/Footer";
import EarlyBirdForm from "@/components/EarlyBirdForm";
import DotField from "@/components/DotField";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent relative" data-testid="app-root">
      {/* Global Background DotField */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-auto">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly={true}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom="#94A3B8"
          gradientTo="#CBD5E1"
          glowColor="transparent"
        />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] pointer-events-none" />
      </div>

      <div className="relative z-10">
        <Header />
        <main>
        <HeroSection />
        <LogoStrip />
        <FeaturesGrid />
        <ArchitectureSection />
        <DocsViewer />
        <TimelineSection />
        <PricingSection />
        <WaitlistSection />
      </main>
      <Footer />
      <EarlyBirdForm />
      </div>
    </div>
  );
}
