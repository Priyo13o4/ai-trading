import { Code2, Smartphone, Workflow } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";
import { useState } from "react";

const integrations = [
  {
    icon: <Code2 className="h-8 w-8 text-brand" aria-hidden />,
    title: "MetaTrader 5 Compatible",
    desc: "Signals are formatted for easy execution on MT5 trading platforms.",
  },
  {
    icon: <Smartphone className="h-8 w-8 text-brand" aria-hidden />,
    title: "Multi-Platform Delivery",
    desc: "Receive signals via web dashboard, mobile notifications, and Telegram alerts.",
  },
  {
    icon: <Workflow className="h-8 w-8 text-brand" aria-hidden />,
    title: "API & Webhook Ready",
    desc: "Integrate with your own trading systems using our structured JSON format.",
  },
] as const;

const Integrations = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  
  return (
    <section aria-labelledby="integrations-heading" className="relative z-10 py-16 md:py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <Reveal>
            <h2 id="integrations-heading" className="font-display text-3xl md:text-4xl font-semibold text-white">
              Integrates With Your Workflow
            </h2>
            <p className="text-gray-300 mt-4 text-lg leading-relaxed">
              Use PipFactor however you prefer—manual execution, automated systems, or hybrid approaches.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {integrations.map((integration, i) => {
            const directions = ['translate-y-8', 'translate-y-8', 'translate-y-8'];
            return (
            <Reveal key={i} delay={i * 100}>
              <article 
                className={`group relative overflow-hidden rounded-xl border bg-slate-800/30 p-6 backdrop-blur-sm transition-all duration-500 cursor-pointer ${
                  activeCard === i 
                    ? 'border-brand shadow-lg shadow-brand/20 scale-105' 
                    : 'border-slate-700/50'
                }`}
                onMouseEnter={() => setActiveCard(i)}
                onMouseLeave={() => setActiveCard(null)}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand/5 opacity-0 transition-opacity duration-500 ${
                  activeCard === i ? 'opacity-100' : ''
                }`} />
                
                <div className="relative">
                  <div className={`mb-4 inline-flex items-center justify-center rounded-lg bg-brand/10 p-3 transition-all duration-500 ${
                    activeCard === i ? 'animate-bounce bg-brand/20' : ''
                  }`}>
                    {integration.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white transition-colors duration-300">
                    {integration.title}
                  </h3>
                  <p className={`text-sm text-gray-300 leading-relaxed transition-all duration-500 ${
                    activeCard === i ? 'text-gray-200' : ''
                  }`}>
                    {integration.desc}
                  </p>
                  
                  {/* Expand indicator */}
                  <div className={`mt-4 flex items-center gap-2 text-xs text-brand font-medium transition-all duration-300 ${
                    activeCard === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                    <span>Ready to integrate</span>
                  </div>
                </div>
              </article>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
