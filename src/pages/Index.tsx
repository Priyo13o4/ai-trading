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
import { SEOHead } from "@/components/SEOHead";

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------

/**
 * SoftwareApplication
 * ✅ Google rich result eligible — surfaces app metadata in SERPs
 *    (price, category, rating, OS).
 * Source: Hero.tsx copy, HowItWorks steps, Pricing.tsx tier data, Integrations.tsx
 */
const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PipFactor",
  url: "https://pipfactor.com",
  description:
    "PipFactor continuously analyzes price structure, volatility, and major economic events to deliver structured, high-confidence trading signals in real time for Forex, Gold, and major commodities.",
  applicationCategory: "FinanceApplication",
  applicationSubCategory: "Trading Signal Platform",
  operatingSystem: "Web, iOS, Android",
  screenshot: "https://pipfactor.com/og-image.png",
  featureList: [
    "Continuous market monitoring across 40+ indicators simultaneously",
    "AI-generated trade strategies with defined risk/reward parameters",
    "Confidence scoring on every signal",
    "Market regime intelligence — trend, transition, and risk-state context",
    "AI-powered market news analysis with sentiment and relevance scoring",
    "Real-time signal delivery via web dashboard and Telegram",
    "Flash crash detection and automated capital protection",
    "Universal compatibility — execute on any trading platform",
    "API and Webhook ready for systematic traders",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description:
      "7-day free trial on the Elite plan — every feature unlocked for testing.",
    availability: "https://schema.org/InStock",
    url: "https://pipfactor.com/pricing",
  },
  provider: {
    "@type": "Organization",
    name: "PipFactor",
    url: "https://pipfactor.com",
  },
  inLanguage: "en",
  isAccessibleForFree: true,
};

/**
 * FinancialProduct + Service (dual @type)
 * ❌ Not a Google visual rich result — intended for AI search systems
 *    (Perplexity, Bing Copilot, ChatGPT web search) and semantic knowledge graphs.
 * Source: Pricing.tsx PRICING_TIERS data, planCatalog.ts, FAQ.tsx
 */
const financialProductSchema = {
  "@context": "https://schema.org",
  "@type": ["FinancialProduct", "Service"],
  name: "PipFactor Core Plan",
  alternateName: "PipFactor Trading Signal Service",
  description:
    "AI-generated trading signal service for active Forex, commodities, and crypto traders. Provides market regime intelligence, confidence-scored trade setups, AI news sentiment analysis, and real-time signal delivery. Currently available with a 7-day free trial.",
  url: "https://pipfactor.com/pricing",
  serviceType: "Trading Signal Service",
  category: "Financial Technology",
  areaServed: {
    "@type": "Place",
    name: "Worldwide",
  },
  availableChannel: {
    "@type": "ServiceChannel",
    serviceUrl: "https://pipfactor.com",
    availableLanguage: "English",
  },
  offers: {
    "@type": "Offer",
    description: "7-day free trial.",
    availability: "https://schema.org/InStock",
    url: "https://pipfactor.com/pricing",
    priceSpecification: [
      {
        "@type": "UnitPriceSpecification",
        price: "0",
        priceCurrency: "USD",
        name: "Free Trial (7 days)",
        validFrom: "2026-01-01",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: "7",
          unitCode: "DAY",
        },
      },
    ],
  },
  provider: {
    "@type": "Organization",
    name: "PipFactor",
    url: "https://pipfactor.com",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "PipFactor Subscription Plans",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "7-Day Free Trial",
          description:
            "Full platform access for 7 days at no cost. Includes AI signals, news sentiment, and market regime intelligence.",
        },
        price: "0",
        priceCurrency: "USD",
      },
    ],
  },
};

/**
 * Organization
 * Enhanced with contactPoint and description for knowledge panel eligibility.
 * Source: FAQ.tsx (support email), Hero.tsx (description)
 */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PipFactor",
  url: "https://pipfactor.com",
  logo: {
    "@type": "ImageObject",
    url: "https://pipfactor.com/pipfactor.svg",
    width: "512",
    height: "512",
  },
  description:
    "PipFactor is an AI-powered trading signal platform that continuously analyzes price structure, volatility, and economic events to deliver high-confidence trade setups for Forex, Gold, and commodities traders.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@pipfactor.ai",
    contactType: "customer support",
    availableLanguage: "English",
  },
  sameAs: [
    // Add your social profile URLs here when available
    // "https://twitter.com/pipfactor",
    // "https://www.linkedin.com/company/pipfactor",
  ],
};

// ---------------------------------------------------------------------------

const Index = () => {
  return (
    // Shader background with content overlay
    <div className="relative text-white overflow-x-hidden">
      <SEOHead
        title="AI-Powered Trading Signals"
        description="PipFactor delivers real-time, AI-powered trading signals for Forex, Gold, and major commodities. 7-day free trial — every feature unlocked for early traders."
        canonical="https://pipfactor.com/"
        structuredData={[
          organizationSchema,
          softwareApplicationSchema,
          financialProductSchema,
        ]}
      />

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
            <FAQ showSearch={false} />
            <RiskDisclaimer />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
