import HowItWorks from "@/components/marketing/HowItWorks";
import LivePreview from "@/components/marketing/LivePreview";
import Testimonials from "@/components/marketing/Testimonials";
import FAQ from "@/components/marketing/FAQ";
import { Hero } from "@/components/marketing/Hero";
import { Footer } from "@/components/marketing/Footer";
import { Features } from "@/components/marketing/Features";
import DemoOne from "@/components/ui/demo";

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
  name: "PipFactor",
    url: typeof window !== "undefined" ? window.location.origin : "https://example.com",
  logo: "/pipfactor.svg",
  } as const;

  return (
    // Shader background with content overlay
    <div className="relative text-white overflow-x-hidden">
      {/* Background Shader Layer */}
      <div className="fixed inset-0 z-0">
        <DemoOne />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <LivePreview />
          <Testimonials />
          <FAQ />
        </main>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <Footer />
      </div>
    </div>
  );
};

export default Index;
