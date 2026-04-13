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
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" data-testid="app-root">
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
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
