import HowItWorks from "@/components/marketing/HowItWorks";
import WhyDifferent from "@/components/marketing/WhyDifferent";
import UseCases from "@/components/marketing/UseCases";

import TrustSection from "@/components/marketing/TrustSection";
import LivePreview from "@/components/marketing/LivePreview";
import Testimonials from "@/components/marketing/Testimonials";
import FAQ from "@/components/marketing/FAQ";
import RiskDisclaimer from "@/components/marketing/RiskDisclaimer";
import { Hero } from "@/components/marketing/Hero";
import { Footer } from "@/components/marketing/Footer";
import { FinalCTA } from "@/components/marketing/FinalCTA";

const Index = () => {
  return (
    // Shader background with content overlay
    <div className="relative text-white overflow-x-hidden">
      {/* Content Layer */}
      <div className="relative z-10">
        <main>
          <Hero />

          <div className="dot-grid-bg relative w-full h-full pb-0 rounded-t-3xl overflow-hidden border-t border-[#C8935A]/5">
            <HowItWorks />
            <WhyDifferent />
            <UseCases />
            <LivePreview />

            <Testimonials />
            <FinalCTA />
            <FAQ />
            <RiskDisclaimer />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
