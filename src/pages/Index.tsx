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
    // FIX: Removed `overflow-hidden` from this line.
    <div className="relative text-white overflow-x-hidden">
      {/* Dark gradient background removed from here*/}
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

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
