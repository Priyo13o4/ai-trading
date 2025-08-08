import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import Stats from "@/components/marketing/Stats";
import Features from "@/components/marketing/Features";
import Footer from "@/components/marketing/Footer";

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StoxieX",
    url: typeof window !== "undefined" ? window.location.origin : "https://example.com",
    logo: "/favicon.ico",
  } as const;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Footer />
    </div>
  );
};

export default Index;
