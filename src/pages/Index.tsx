import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, ChevronRight, Menu, X, BarChart3, ShieldCheck } from "lucide-react";
import CandlestickChart from "@/components/marketing/CandlestickChart";
import HowItWorks from "@/components/marketing/HowItWorks";
import LivePreview from "@/components/marketing/LivePreview";
import Testimonials from "@/components/marketing/Testimonials";
import FAQ from "@/components/marketing/FAQ";
import Reveal from "@/components/marketing/Reveal";

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
    <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
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

      {/* Navbar */}
      <header className="relative z-50 p-4 md:px-8">
        <nav className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-7 h-7 text-blue-400" aria-hidden />
            <span className="text-xl font-display font-semibold tracking-tight text-white">Signal AI</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <a href="#home" className="transition-colors hover:text-white">Home</a>
            <a href="#about" className="transition-colors hover:text-white">About</a>
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#contact" className="transition-colors hover:text-white">Contact</a>
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden ml-2 text-white" 
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="container mx-auto md:hidden mt-4 rounded-lg border border-slate-700 bg-slate-800/90 backdrop-blur p-4 flex flex-col items-center gap-4">
            <a href="#home" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors">Home</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors">About</a>
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors">Contact</a>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section id="home" className="relative z-10 min-h-screen flex items-center">
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight">
                  <span className="text-white italic">Unlock the</span><br />
                  <span className="text-white italic">Power of AI-</span><br />
                  <span className="text-white italic">Driven Crypto</span><br />
                  <span className="text-white italic">Trading</span>
                </h1>
                
                <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
                  Discover the future of investment with Signal AI
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium"
                  onClick={() => navigate('/signal')}
                >
                  Get Started
                </Button>
                <button className="text-gray-300 hover:text-white transition-colors text-lg font-medium underline underline-offset-4">
                  Explore Our Features
                </button>
              </div>
            </div>

            {/* Right Content - Candlestick Chart */}
            <div className="relative">
              <CandlestickChart />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative z-10 py-16 md:py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-display font-semibold text-center mb-12 text-white">Why Choose Signal AI?</h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, idx) => (
                <Reveal key={idx} delay={idx * 80}>
                  <article
                    className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur p-6 text-center transition-all duration-300 hover:bg-slate-800/70"
                  >
                    <div className="flex justify-center mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />
        <LivePreview />
        <Testimonials />
        <FAQ />
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 px-4 border-t border-slate-700">
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Signal AI. All rights reserved.</p>
        <p className="text-xs text-gray-500 mt-2">Trading involves substantial risk and is not for every investor.</p>
      </footer>
    </div>
  );
};

export default Index;