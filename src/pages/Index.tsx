import HowItWorks from "@/components/marketing/HowItWorks";
import WhyDifferent from "@/components/marketing/WhyDifferent";
import UseCases from "@/components/marketing/UseCases";
import Integrations from "@/components/marketing/Integrations";
import TrustSection from "@/components/marketing/TrustSection";
import LivePreview from "@/components/marketing/LivePreview";
import Testimonials from "@/components/marketing/Testimonials";
import FAQ from "@/components/marketing/FAQ";
import RiskDisclaimer from "@/components/marketing/RiskDisclaimer";
import { Hero } from "@/components/marketing/Hero";
import { Footer } from "@/components/marketing/Footer";
import { Features } from "@/components/marketing/Features";

const Index = () => {
  return (
    // Shader background with content overlay
    <div className="relative text-white overflow-x-hidden">
      {/* Content Layer */}
      <div className="relative z-10">
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <WhyDifferent />
          <UseCases />
          <LivePreview />
          <Integrations />
          <TrustSection />
          <Testimonials />
          <FAQ />
          <RiskDisclaimer />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
