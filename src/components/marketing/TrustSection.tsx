import { Shield, Zap, Database, Code } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

const trustFactors = [
  {
    icon: <Shield className="h-5 w-5" aria-hidden />,
    label: "Secure by design",
    description: "Privacy-first workflows and robust data handling.",
  },
  {
    icon: <Zap className="h-5 w-5" aria-hidden />,
    label: "Real-time",
    description: "Signals update as markets move.",
  },
  {
    icon: <Database className="h-5 w-5" aria-hidden />,
    label: "Battle-tested stack",
    description: "n8n • Supabase • Postgres • Redis",
  },
  {
    icon: <Code className="h-5 w-5" aria-hidden />,
    label: "Fast & Lightweight",
    description: "Optimized UI with smooth interactions.",
  },
] as const;

const TrustSection = () => {
  return (
    <section className="relative z-10 py-16 md:py-20 px-4 bg-gradient-to-b from-slate-900/50 to-transparent">
      <div className="container mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white">
              Trusted, efficient, and ready
            </h2>
            <p className="text-gray-300 mt-4 text-lg leading-relaxed">
              Join traders who rely on clean, actionable insights.
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
