import { Target, TrendingUp, FileText, Users } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";
import { useState } from "react";

const differentiators = [
  {
    icon: <Target className="h-6 w-6 text-brand" aria-hidden />,
    title: "Regime-Aware Intelligence",
    desc: "Signals adapt to trending, ranging, or volatile market conditions.",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-brand" aria-hidden />,
    title: "News-Sensitive Strategy Adjustments",
    desc: "High-impact economic events are factored into signal generation.",
  },
  {
    icon: <FileText className="h-6 w-6 text-brand" aria-hidden />,
    title: "Structured & Machine-Readable",
    desc: "Every signal follows a consistent format for clarity and execution.",
  },
  {
    icon: <Users className="h-6 w-6 text-brand" aria-hidden />,
    title: "Built for Serious Traders",
    desc: "Designed for both discretionary and systematic traders.",
  },
] as const;

const WhyDifferent = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section aria-labelledby="why-different-heading" className="relative z-10 py-16 md:py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Reveal>
            <h2 id="why-different-heading" className="font-display text-3xl md:text-4xl font-semibold text-white">
              Why PipFactor Is Different
            </h2>
            <p className="text-gray-300 mt-4 text-lg leading-relaxed">
              Not just another signal service. A complete trading intelligence system.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {differentiators.map((item, i) => (
            <Reveal key={i} delay={i * 80}>
              <article 
                className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm transition-all duration-500 hover:scale-105"
                style={{
                  background: hoveredIndex === i 
                    ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(30, 41, 59, 0.5) 100%)'
                    : 'rgba(30, 41, 59, 0.3)'
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Animated gradient border */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-brand/0 via-brand/50 to-brand/0 opacity-0 transition-opacity duration-500 ${
                  hoveredIndex === i ? 'opacity-100' : ''
                } blur-xl`} />
                
                <div className="relative flex flex-col items-start gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand transition-all duration-300 ${
                    hoveredIndex === i ? 'scale-110 rotate-6' : ''
                  }`}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-white text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
