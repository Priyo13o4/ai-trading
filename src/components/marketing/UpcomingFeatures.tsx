import { Bot, Cable, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const UpcomingFeatures = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 px-4 overflow-hidden border-t border-[#C8935A]/5">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#C8935A]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#4ADE80]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <Reveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C8935A]/30 bg-[#C8935A]/10 text-[#C8935A] text-sm font-semibold tracking-wide mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8935A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8935A]"></span>
              </span>
              Upcoming Features
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Advanced Integrations & Personalization
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              We are constantly evolving. Here's a look at the powerful new tools rolling out soon to help you automate your trading and tailor our AI to your unique style.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* MT5 EA Card */}
          <Reveal delay={100} className="relative group/card h-full">
            <div className="h-full bg-[#111315]/95  border border-slate-700/60 hover:border-[#C8935A]/40 rounded-3xl p-8 sm:p-10 transition-all duration-500 overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/card:opacity-20 transition-opacity duration-700 pointer-events-none">
                <Cable className="w-48 h-48 text-[#C8935A] -rotate-12 translate-x-8 -translate-y-8" />
              </div>
              
              <div className="bg-[#C8935A]/10 w-16 h-16 rounded-2xl border border-[#C8935A]/20 flex items-center justify-center mb-8 relative z-10 group-hover/card:scale-110 transition-transform duration-500">
                <Cable className="w-8 h-8 text-[#C8935A]" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Seamless MT5 Integration</h3>
              
              <p className="text-slate-400 text-base leading-relaxed mb-8 relative z-10 flex-grow">
                Connect your MetaTrader 5 account using our tailored Expert Advisor (EA). It automatically processes our high-confidence signals according to your pre-set risk limits, allowing for disciplined and consistent trade execution without requiring constant monitoring.
              </p>
              
              <div className="inline-flex items-center text-[#C8935A] font-semibold text-sm relative z-10 group-hover/card:translate-x-2 transition-transform duration-300 w-fit">
                Coming Soon <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Reveal>

          {/* AI Chatbot Card */}
          <Reveal delay={200} className="relative group/card h-full">
            <div className="h-full bg-[#111315]/95  border border-slate-700/60 hover:border-[#C8935A]/40 rounded-3xl p-8 sm:p-10 transition-all duration-500 overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/card:opacity-20 transition-opacity duration-700 pointer-events-none">
                <Bot className="w-48 h-48 text-[#C8935A] rotate-12 translate-x-8 -translate-y-8" />
              </div>

              <div className="bg-[#C8935A]/10 w-16 h-16 rounded-2xl border border-[#C8935A]/20 flex items-center justify-center mb-8 relative z-10 group-hover/card:scale-110 transition-transform duration-500">
                <Bot className="w-8 h-8 text-[#C8935A]" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Your Personal AI Trading Assistant</h3>
              
              <p className="text-slate-400 text-base leading-relaxed mb-8 relative z-10 flex-grow">
                Every trader has a unique approach. Chat directly with our AI to refine strategies, filter signals based on your specific risk profile, and gain real-time market insights customized just for you.
              </p>
              
              <div className="inline-flex items-center text-[#C8935A] font-semibold text-sm relative z-10 group-hover/card:translate-x-2 transition-transform duration-300 w-fit">
                In Development <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default UpcomingFeatures;
