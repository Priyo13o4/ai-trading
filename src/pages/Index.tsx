import HowItWorks from "@/components/marketing/HowItWorks";
import LivePreview from "@/components/marketing/LivePreview";
import Testimonials from "@/components/marketing/Testimonials";
import FAQ from "@/components/marketing/FAQ";
import { Hero } from "@/components/marketing/Hero";
import { Footer } from "@/components/marketing/Footer";
import { Features } from "@/components/marketing/Features"; // Import the Features component

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
  name: "PipFactor",
    url: typeof window !== "undefined" ? window.location.origin : "https://example.com",
    logo: "/favicon.ico",
  } as const;

  return (
    // Seamless mesh gradient background applied to the entire page
    <div className="relative text-white overflow-x-hidden mesh-gradient-seamless">

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
  );
};

export default Index;
