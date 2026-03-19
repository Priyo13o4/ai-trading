import { Shield, Zap, AlertTriangle, Lock } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

const trustFactors = [
  {
    icon: <Shield className="h-5 w-5" aria-hidden />,
    label: "Signal Transparency",
    description:
      "Every signal shows direction, entry zone, stop-loss, and confidence score — no black boxes.",
  },
  {
    icon: <Zap className="h-5 w-5" aria-hidden />,
    label: "Real-Time Delivery",
    description:
      "Signals generated within seconds of a news event or technical breakout.",
  },
  {
    icon: <AlertTriangle className="h-5 w-5" aria-hidden />,
    label: "Risk-First Design",
    description:
      "Risk/reward is calculated before you see the signal. We don't give you setups without defined exits.",
  },
  {
    icon: <Lock className="h-5 w-5" aria-hidden />,
    label: "Your Data, Protected",
    description:
      "No trading account access required. Encrypted sessions, no data sold to third parties.",
  },
] as const;

const TrustSection = () => {
  return (
    <section className="relative z-10 py-16 md:py-20 px-4 bg-gradient-to-b from-slate-900/50 to-transparent">
      <div className="container mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white">
              Built for trust, not just performance
            </h2>
            <p className="text-gray-300 mt-4 text-lg leading-relaxed">
              PipFactor is a signal tool — not a broker, advisor, or fund. We make it clear what we do and what we don't.
            </p>
          </Reveal>
        </div>

        {/* Horizontal scrolling on mobile, grid on desktop */}
        <div className="relative">
          <Reveal delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trustFactors.map((factor, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden"
                  style={{
                    animation: `fadeSlideUp 0.6s ease-out ${i * 0.1}s both`,
                  }}
                >
                  {/* Card with horizontal layout */}
                  <div className="flex items-start gap-4 rounded-lg border border-slate-700/40 bg-slate-800/20 p-5 backdrop-blur-sm transition-all duration-300 hover:border-brand/40 hover:bg-slate-800/40">
                    {/* Icon with pulsing background */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 animate-ping rounded-full bg-brand/20 opacity-0 group-hover:opacity-100" />
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand transition-colors duration-300 group-hover:bg-brand/20">
                        {factor.icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 text-sm font-semibold text-white">
                        {factor.label}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default TrustSection;
