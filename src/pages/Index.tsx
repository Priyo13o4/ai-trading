import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, ChevronRight, Menu, X, BarChart3, ShieldCheck } from "lucide-react";
import StockBackground from "@/components/marketing/StockBackground";
import HowItWorks from "@/components/marketing/HowItWorks";
import LivePreview from "@/components/marketing/LivePreview";
import Testimonials from "@/components/marketing/Testimonials";
import FAQ from "@/components/marketing/FAQ";
import Reveal from "@/components/marketing/Reveal";
import CinematicChart from "@/components/marketing/CinematicChart";

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Signal AI",
    url: typeof window !== "undefined" ? window.location.origin : "https://example.com",
    logo: "/favicon.ico",
  } as const;

  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    { icon: <Bot className="w-8 h-8 text-brand" aria-hidden />, title: "AI-Powered Signals", description: "Leverage advanced models that analyze market data 24/7 to provide high-probability trading signals." },
    { icon: <BarChart3 className="w-8 h-8 text-brand" aria-hidden />, title: "Multi-Factor Analysis", description: "Trends, volatility, momentum, and news sentiment combined for a holistic market view." },
    { icon: <ShieldCheck className="w-8 h-8 text-brand" aria-hidden />, title: "Clear & Actionable", description: "Precise entry, take-profit, and stop-loss levels. No guesswork." },
  ] as const;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Elegant background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div className="absolute top-[-10%] left-[10%] h-72 w-72 rounded-full bg-[hsl(var(--brand)/0.35)] blur-3xl animate-blob" />
        <div className="absolute bottom-[-10%] right-[10%] h-72 w-72 rounded-full bg-[hsl(var(--accent)/0.25)] blur-3xl animate-blob animation-delay-2000" />
      </div>
      <StockBackground symbol="XAUUSD" anchorId="live-preview-section" />

      {/* Navbar */}
      <header className="p-4 md:px-8">
        <nav className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-7 h-7 text-brand" aria-hidden />
            <span className="text-xl font-display font-semibold tracking-tight">Signal AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#about" className="transition-colors hover:text-foreground">About</a>
          </div>
          <Button size="sm" variant="gradient" onClick={() => navigate('/signal')}>
            Get Started
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden ml-2" aria-label="Toggle menu">
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
        {isMenuOpen && (
          <div className="container mx-auto md:hidden mt-4 rounded-lg border bg-card/80 backdrop-blur p-4 flex flex-col items-center gap-4">
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            <Button onClick={() => { setIsMenuOpen(false); navigate('/signal'); }} className="w-full" variant="gradient">Get Started</Button>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="text-center py-20 md:py-32 px-4">
          <Badge variant="outline" className="mb-4 border-brand/40 text-foreground bg-[hsl(var(--brand)/0.08)]">Next-Generation Trading Signals</Badge>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
            Stop Guessing. <br className="hidden md:block" /> Start <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">Data-Driven</span> Trading.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Advanced AI analyzes the markets for you, delivering high-quality trading signals directly to your device.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="gradient" onClick={() => navigate('/signal')}>
              View Live Demo
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline">Join Telegram</Button>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-display font-semibold text-center mb-12">Why Choose Signal AI?</h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, idx) => (
                <Reveal key={idx} delay={idx * 80}>
                  <article
                    className="rounded-xl border bg-card/60 p-6 text-center transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
                    style={{ transform: `translateY(calc(var(--stock-progress, 0) * ${((idx % 3) - 1) * -14}px))` }}
                  >
                    <div className="flex justify-center mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Cinematic Chart Animation */}
        <CinematicChart />
        
        <HowItWorks />
        <LivePreview />
        <Testimonials />
        <FAQ />
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Footer */}
      <footer className="text-center py-12 px-4 border-t">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Signal AI. All rights reserved.</p>
        <p className="text-xs text-muted-foreground/70 mt-2">Trading involves substantial risk and is not for every investor.</p>
      </footer>
    </div>
  );
};

export default Index;
