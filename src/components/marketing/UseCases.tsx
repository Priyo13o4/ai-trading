import { useState, useRef } from "react";
import { Clock, TrendingUp, Briefcase, CheckCircle, ArrowRight, Zap, LineChart, BarChart2 } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { cn } from "@/lib/utils";

const personas = [
  {
    id: "01",
    icon: Clock,
    accentColor: "#C8935A",
    title: "The Part-Time Trader",
    tagline: "The market doesn't wait. But now you can.",
    description:
      "Part-time traders miss setups because they can't monitor the economic calendar, news wires, and price action simultaneously. PipFactor's signal delivery engine monitors 40+ technical indicators and live news sentiment continuously — sending a structured trade setup only when the confidence scoring engine rates a setup as High or Very High.",
    before: [
      "Missed NFP setup by 30 minutes",
      "No context on the news catalyst",
      "Stopped out on an FOMC surprise",
    ],
    after: [
      "Signal delivered in real time with news context",
      "Sentiment score shows if news is already priced in",
      "Risk/reward defined before you look at the chart",
    ],
    stat: "Avg. 2–3 high-confidence setups/week",
  },
  {
    id: "02",
    icon: Zap,
    accentColor: "#4ADE80",
    title: "The Active Day Trader",
    tagline: "Speed meets structure.",
    description:
      "Active day traders generate discipline problems when every price move looks like a setup. PipFactor's confidence scoring engine assigns a conviction rating to each signal based on technical confluence, news sentiment alignment, and current market regime — so you can filter out low-probability setups before they become emotional trades.",
    before: [
      "Over-traded low-probability setups",
      "No systematic sentiment filter",
      "Revenge traded after stop-out",
    ],
    after: [
      "Only enter when confidence ≥ High",
      "Pre-defined R:R on every signal",
      "Regime context prevents counter-trend entries",
    ],
    stat: "5–10 signals/day across Forex pairs",
  },
  {
    id: "03",
    icon: BarChart2,
    accentColor: "#818CF8",
    title: "The Systematic Trader",
    tagline: "Data-driven decisions, every time.",
    description:
      "Systematic and algorithmic traders need structured, machine-readable signal data with macro context baked in. PipFactor outputs regime-classified signals — each tagged with a market state (Trending, Transitioning, or High-Risk) from the market regime detection model — so your system knows not just what the setup is, but whether the macro environment supports taking it.",
    before: [
      "System ignored macro and news context",
      "No regime-aware entry filtering",
      "Strategy underperformed in ranging markets",
    ],
    after: [
      "Signals include regime classification tag",
      "News sentiment alignment baked into signal",
      "API-ready structured output for systematic execution",
    ],
    stat: "Institutional-grade regime signal data",
  },
];

function PersonaCard({ persona }: { persona: typeof personas[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = ((e.clientX - cx) / rect.width) * 12;
    const dy = ((e.clientY - cy) / rect.height) * -12;
    setTilt({ x: dx, y: dy });
  };

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl border border-slate-700/30 bg-[#111315]/95 p-7 flex flex-col gap-5 overflow-hidden cursor-default transition-all duration-300 hover:border-opacity-50"
      style={{
        transform: hovered
          ? `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(1.02)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)",
        transition: "transform 0.25s ease, box-shadow 0.3s ease",
        borderColor: hovered ? persona.accentColor + "40" : undefined,
        boxShadow: hovered ? `0 20px 60px ${persona.accentColor}12` : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: persona.accentColor + "25" }}
      />
      {/* Top accent gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${persona.accentColor}, transparent)` }}
      />

      {/* Badge + Icon */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-600">#{persona.id}</span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: persona.accentColor + "20" }}
        >
          <persona.icon className="w-5 h-5" style={{ color: persona.accentColor }} />
        </div>
      </div>

      {/* Title */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: persona.accentColor + "90" }}>
          {persona.id === "01" ? "Weekday Traders" : persona.id === "02" ? "Day Traders" : "Algo / Quant"}
        </p>
        <h3 className="text-xl font-display font-bold text-white mb-1">{persona.title}</h3>
        <p className="text-sm italic text-slate-400">"{persona.tagline}"</p>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed">{persona.description}</p>

      {/* Before / After */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Before</p>
          {persona.before.map((b) => (
            <div key={b} className="flex items-start gap-2 text-slate-500">
              <span className="mt-0.5 text-red-500/60">✗</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">After</p>
          {persona.after.map((a) => (
            <div key={a} className="flex items-start gap-2 text-slate-400">
              <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: persona.accentColor }} />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat */}
      <div
        className="mt-auto flex items-center justify-between pt-4 border-t border-slate-700/30"
      >
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <LineChart className="w-3.5 h-3.5" style={{ color: persona.accentColor }} />
          {persona.stat}
        </span>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" style={{ color: persona.accentColor + "80" }} />
      </div>

      {/* Shine on hover */}
      <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-700 group-hover:translate-x-[100%] pointer-events-none" />
    </div>
  );
}

export const UseCases = () => {
  return (
    <section className="py-24 px-4" id="use-cases">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C8935A]/70 font-semibold mb-3">
              Who PipFactor Is Built For
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Built for Every Trading Style
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              PipFactor adapts to part-time traders, active day traders, and systematic strategies — delivering regime-classified, confidence-scored signals regardless of how or when you trade.
            </p>
          </div>
        </Reveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {personas.map((p, i) => (
            <Reveal key={p.id} delay={i * 120}>
              <PersonaCard persona={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;

