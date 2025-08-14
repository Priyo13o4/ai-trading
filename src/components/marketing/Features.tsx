import { Bot, BarChart3, ShieldCheck } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

export const Features = () => {
  const features = [
    {
      icon: <Bot className="w-8 h-8 text-brand" aria-hidden />,
      title: "AI-Powered Signals",
      description: "Leverage advanced models that analyze market data 24/7 to provide high-probability trading signals.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-brand" aria-hidden />,
      title: "Multi-Factor Analysis",
      description: "Trends, volatility, momentum, and news sentiment combined for a holistic market view.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-brand" aria-hidden />,
      title: "Clear & Actionable",
      description: "Precise entry, take-profit, and stop-loss levels. No guesswork.",
    },
  ] as const;

  return (
    <section id="features" className="relative z-10 py-16 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-display font-semibold text-center mb-12 text-white">
          Why Choose Signal AI?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <Reveal key={idx} delay={idx * 80}>
              <article className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur p-6 text-center transition-all duration-300 hover:bg-slate-800/70">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
