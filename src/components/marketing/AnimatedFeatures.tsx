import { useState, useEffect, useRef } from "react";
import { Bot, BarChart3, ShieldCheck } from "lucide-react";
import DynamicCandlestickChart from "./CandlestickChart";

export const AnimatedFeatures = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    {
      icon: <Bot className="w-8 h-8 text-primary" aria-hidden />,
      title: "AI-Powered Signals",
      description: "Leverage advanced models that analyze market data 24/7 to provide high-probability trading signals.",
      chartState: { volatility: 8, trend: 0.75, color: "#10b981" }
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-400" aria-hidden />,
      title: "Multi-Factor Analysis", 
      description: "Trends, volatility, momentum, and news sentiment combined for a holistic market view.",
      chartState: { volatility: 12, trend: 0.35, color: "#3b82f6" }
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" aria-hidden />,
      title: "Clear & Actionable",
      description: "Precise entry, take-profit, and stop-loss levels. No guesswork.",
      chartState: { volatility: 15, trend: 0.6, color: "#10b981" }
    },
  ];

  // Initialize chart
  useEffect(() => {
    // Chart is now handled by DynamicCandlestickChart component
  }, []);

  // Auto-rotate after first scroll
  useEffect(() => {
    if (autoRotate) {
      const interval = setInterval(() => {
        setCurrentCard(prev => (prev + 1) % features.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [autoRotate, features.length]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || hasScrolled) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible && !hasScrolled) {
        setHasScrolled(true);
        animateCardsSequentially();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

  const animateCardsSequentially = () => {
    let cardIndex = 0;
    const showNextCard = () => {
      if (cardIndex < features.length) {
        setCurrentCard(cardIndex);
        cardIndex++;
        setTimeout(showNextCard, 1500);
      } else {
        setTimeout(() => setAutoRotate(true), 2000);
      }
    };
    showNextCard();
  };

  return (
    <section ref={sectionRef} id="features" className="relative z-10 py-16 md:py-20 px-4 min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-display font-semibold text-center mb-12 text-foreground">
          Why Choose Signal AI?
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left Column - Dynamic Candlestick Chart */}
          <div className="relative h-[500px] bg-card/50 backdrop-blur border border-border rounded-xl p-6">
            <DynamicCandlestickChart />
          </div>

          {/* Right Column - Animated Cards */}
          <div className="relative h-[500px]">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-out ${
                  hasScrolled && index <= currentCard
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
                } ${
                  currentCard === index
                    ? 'z-10 scale-100'
                    : 'z-0 scale-95'
                }`}
                style={{
                  transitionDelay: hasScrolled && !autoRotate ? `${index * 500}ms` : '0ms'
                }}
              >
                <article className="h-full rounded-xl border border-border bg-card/80 backdrop-blur p-8 text-center flex flex-col justify-center transition-all duration-300 hover:bg-card/90">
                  <div className="flex justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {features.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentCard ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};