import { useEffect, useRef, useState } from "react";
import { Sparkles, Gauge, Bell, CheckCircle } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const steps = [
  {
    number: "01",
    icon: Sparkles,
    title: "Continuous Market Monitoring",
    description:
      "The AI tracks price action, economic events, and shifting volatility across markets — 24 hours a day, across 40+ indicators simultaneously.",
    outcome: "40+ signals tracked in real-time",
    color: "#C8935A",
  },
  {
    number: "02",
    icon: Gauge,
    title: "Intelligent Strategy Generation",
    description:
      "Based on current market conditions, the system generates structured trade setups with defined risk parameters and confidence scoring.",
    outcome: "Risk/reward defined before entry",
    color: "#6CB4EE",
  },
  {
    number: "03",
    icon: Bell,
    title: "Instant Delivery",
    description:
      "You receive clear, ready-to-use signals with all the details needed to execute confidently — on any device, the moment they're live.",
    outcome: "Signal in your hands within seconds",
    color: "#A3C9A8",
  },
];

export const HowItWorks = () => {
  const lineRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const end = 100;
          const duration = 1200;
          const step = (end - start) / (duration / 16);
          const timer = setInterval(() => {
            start = Math.min(start + step, end);
            setProgress(start);
            if (start >= end) clearInterval(timer);
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 px-4"
      id="how-it-works"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <Reveal>
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C8935A]/70 font-semibold mb-3">
              Three-Step Intelligence Pipeline
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              From raw market data to an actionable trade signal — in three precise steps.
            </p>
          </div>
        </Reveal>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[2.35rem] top-10 bottom-10 w-px bg-slate-700/50 hidden md:block" />
          {/* Animated fill */}
          <div
            className="absolute left-[2.35rem] top-10 w-px bg-gradient-to-b from-[#C8935A] via-[#6CB4EE] to-[#A3C9A8] hidden md:block transition-all duration-100"
            style={{ height: `${progress}%`, maxHeight: "calc(100% - 2.5rem)" }}
          />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <Reveal key={step.number} delay={i * 150}>
                <div className="group relative flex gap-6 md:gap-8 items-start p-6 rounded-2xl border border-slate-700/30 bg-[#111315]/95 hover:bg-[#111315] hover:border-[#C8935A]/20 transition-all duration-300 ">
                  {/* Step Badge */}
                  <div
                    className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border-2 transition-all duration-300 group-hover:scale-110"
                    style={{
                      borderColor: step.color + "60",
                      color: step.color,
                      background: step.color + "15",
                      boxShadow: `0 0 16px ${step.color}20`,
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <step.icon
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: step.color }}
                        />
                        <h3 className="text-lg font-display font-semibold text-white">
                          {step.title}
                        </h3>
                      </div>
                      {/* Outcome pill */}
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0"
                        style={{
                          background: step.color + "18",
                          color: step.color,
                          border: `1px solid ${step.color}30`,
                        }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {step.outcome}
                      </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                      {step.description}
                    </p>
                  </div>

                  {/* Hover accent */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}05 0%, transparent 60%)`,
                    }}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

