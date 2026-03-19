import { ArrowDownRight, ShieldCheck, Newspaper, TrendingDown, Clock } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";
import bearishImage from "@/assets/bearish_market_crash.png";

const WhyDifferent = () => {
  return (
    <section aria-labelledby="why-different-heading" className="relative z-10 py-24 md:py-32 px-4 overflow-hidden border-t border-[#C8935A]/5">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#E53E3E]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#C8935A]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Column: The Narrative & Value Proposition */}
          <Reveal className="flex flex-col justify-center">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E53E3E]/30 bg-[#E53E3E]/10 text-[#FC8181] text-sm font-semibold tracking-wide mb-8 w-fit backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FC8181] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E53E3E]"></span>
              </span>
              Built for Black Swan Events
            </div>

            <h2 id="why-different-heading" className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#E0E0E0] leading-tight mb-6 drop-shadow-xl">
              When the market breaks, <span className="text-[#C8935A] italic">we don't.</span>
            </h2>

            <p className="text-[#9CA3AF] text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
              High-impact news events — Federal Reserve decisions, NFP releases, geopolitical shocks — can liquidate leveraged positions within seconds. PipFactor's sentiment analysis engine scores breaking news for directional market impact in real time, so you know whether to stay in the trade or step aside before the volatility spike hits.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#111315]/50 border border-[#C8935A]/10 hover:border-[#C8935A]/30 transition-colors backdrop-blur-sm">
                <div className="bg-[#E53E3E]/10 p-3 rounded-xl border border-[#E53E3E]/20">
                  <TrendingDown className="w-6 h-6 text-[#FC8181]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">Detect Flash Crashes Before They Hit</h4>
                  <p className="text-slate-400 text-sm">PipFactor's momentum shift detection algorithm flags abnormal order-flow imbalances across correlated pairs — typically 15–30 seconds before retail indicators react.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#111315]/50 border border-[#C8935A]/10 hover:border-[#C8935A]/30 transition-colors backdrop-blur-sm">
                <div className="bg-[#10B981]/10 p-3 rounded-xl border border-[#10B981]/20">
                  <ShieldCheck className="w-6 h-6 text-[#34D399]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">Automated Capital Protection</h4>
                  <p className="text-slate-400 text-sm">When the market regime detection model identifies a high-risk state — such as low-liquidity gaps or news-driven whipsaws — signals automatically apply tighter stop-loss parameters and reduced position sizing recommendations.</p>
                </div>
              </div>
            </div>

          </Reveal>

          {/* Right Column: The Visual Disaster Scenario */}
          <Reveal delay={200} className="relative w-full h-[400px] sm:h-[500px] lg:h-full lg:min-h-[500px] flex items-center justify-center lg:justify-end mt-12 lg:mt-0">

            {/* The Bearish Crash Parallax Background */}
            <div className="absolute inset-0 w-full lg:w-[120%] lg:-right-[20%] h-full rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-[#E53E3E]/10 shadow-[0_0_80px_rgba(229,62,62,0.1)]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#040506] via-[#040506]/80 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#040506] via-transparent to-[#040506]/40 z-10" />

              <img
                src={bearishImage}
                alt="Plunging Red Candlestick Chart"
                className="w-full h-full object-cover opacity-60 mix-blend-screen scale-110 object-right"
              />
            </div>

            {/* The Floating 'Breaking News' Tweet/Alert Card */}
            <a
              href="https://www.bbc.com/news/live/ckgx1yldxg4t"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-20 w-full max-w-xs sm:max-w-sm mx-4 sm:mx-0 sm:mr-10 transform -rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-[1.02] block group/card"
            >
              <div className="bg-[#111315]/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden p-0">
                {/* News Provider Header */}
                <div className="bg-[#B80000] px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-white text-[#B80000] font-bold px-1.5 py-0.5 text-xs rounded-sm tracking-tighter">BBC</div>
                    <span className="text-white text-xs font-bold uppercase tracking-wider">News Live</span>
                  </div>
                  <span className="text-[10px] text-white/80 flex items-center gap-1"><Clock className="w-3 h-3" /> 12:58 GMT</span>
                </div>

                <div className="p-4 sm:p-6 pb-6 sm:pb-8">
                  {/* Article Thumbnail/Context */}
                  <div className="w-full h-24 sm:h-32 bg-[#1A1C1E] border border-slate-800 rounded-lg mb-4 relative overflow-hidden flex flex-col justify-end p-3 bg-[url('https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111315]/95 via-[#111315]/60 to-transparent"></div>
                    <span className="relative text-white font-bold text-xs sm:text-sm leading-snug drop-shadow-md group-hover/card:text-[#C8935A] transition-colors">Trump nominates Kevin Warsh as new Federal Reserve chair</span>
                  </div>

                  <div className="mb-4 sm:mb-6">
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed border-l-2 border-[#B80000] pl-3 italic">
                      "Markets tumbled within seconds following the announcement, with gold experiencing a historic single-day drop as traders reacted to the nomination."
                    </p>
                  </div>

                  <div className="bg-[#040506] rounded-xl p-3 sm:p-4 border border-[#E53E3E]/20 relative overflow-hidden group-hover/card:border-[#E53E3E]/50 transition-colors">
                    {/* Pulse effect */}
                    <div className="absolute inset-0 bg-[#E53E3E]/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>

                    <div className="flex justify-between items-end mb-0 sm:mb-2 relative z-10">
                      <span className="text-slate-400 font-medium text-xs sm:text-sm">Market Impact</span>
                      <span className="flex items-center text-[#FC8181] font-bold text-lg sm:text-xl drop-shadow-[0_0_8px_rgba(229,62,62,0.8)]">
                        <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 mr-1" />
                        Bearish
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Action Result Overlay */}
              <div className="absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-4 bg-gradient-to-r from-[#C8935A] to-[#E2B485] text-[#111315] font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-[0_10px_20px_rgba(200,147,90,0.3)] text-xs sm:text-sm flex items-center gap-2 animate-bounce border-2 border-[#111315] z-30 whitespace-nowrap">
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                Automated Capital Protection
              </div>
            </a>

          </Reveal>

        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
