import Header from './landing/Header';
import HeroSection from './landing/HeroSection';
import LogoStrip from './landing/LogoStrip';
import FeaturesGrid from './landing/FeaturesGrid';
import ArchitectureSection from './landing/ArchitectureSection';
import DocsViewer from './landing/DocsViewer';
import TimelineSection from './landing/TimelineSection';
import PricingSection from './landing/PricingSection';
import Footer from './landing/Footer';

export default function LandingDashboard() {
  return (
    <div className="min-h-screen bg-white" data-testid="landing-dashboard-root">
      <Header />
      <main>
        <HeroSection />
        <LogoStrip />
        <FeaturesGrid />
        <ArchitectureSection />
        <DocsViewer />
        <TimelineSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
