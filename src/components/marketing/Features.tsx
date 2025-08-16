import { Bot, BarChart3, ShieldCheck, Zap } from "lucide-react";
import anime from 'animejs';
import { useCallback } from 'react';
import Reveal from "@/components/marketing/Reveal";
import CandlestickChart from "@/components/marketing/CandlestickChart";

export const Features = () => {
  const features = [
    {
      icon: <Bot className="w-12 h-12 text-brand" aria-hidden />,
      title: "AI-Powered Signals",
      description: "Leverage advanced models that analyze market data 24/7 to provide high-probability trading signals.",
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-brand" aria-hidden />,
      title: "Multi-Factor Analysis",
      description: "Trends, volatility, momentum, and news sentiment combined for a holistic market view.",
    },
    {
      icon: <ShieldCheck className="w-12 h-12 text-brand" aria-hidden />,
      title: "Clear & Actionable",
      description: "Precise entry, take-profit, and stop-loss levels. No guesswork.",
    },
    {
        icon: <Zap className="w-12 h-12 text-brand" aria-hidden />,
        title: "Real-Time Delivery",
        description: "Get instant notifications through the app or integrate with Telegram and webhooks.",
    }
  ] as const;

  const playAnimation = useCallback(() => {
    anime({
      targets: '.feature-card',
      // Animate from 30rem (right) to 0 (final position)
      translateX: ['30rem', 0], 
      // Animate from transparent to fully visible
      opacity: [0, 1],
      delay: anime.stagger(500),
      easing: 'easeOutExpo',
      duration: 1000,
    });
  }, []);

  return (
    <section id="features" className="relative z-10 py-16 md:py-20 px-4 overflow-hidden">
      <div className="container mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-3xl font-display font-semibold text-white">
              Why Choose Signal AI?
            </h2>
            <p className="text-gray-400 mt-4 text-lg leading-relaxed">
              Our platform is built on a foundation of powerful, data-driven features designed for modern traders.
            </p>
          </Reveal>
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Candlestick Chart */}
          <div className="relative h-[450px] md:h-auto">
             <CandlestickChart />
          </div>

          {/* Right Column: Feature Cards */}
          <Reveal onVisible={playAnimation} className="opacity-0">
            <div className="space-y-12">
              {features.map((feature, idx) => (
                <article key={idx} className="feature-card flex items-start gap-6">
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
};