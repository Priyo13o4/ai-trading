import { Star, ArrowRight, ArrowLeft } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatarUrl?: string; // Optional avatar
}

const testimonials: Testimonial[] = [
  {
    quote: "I was getting stopped out on almost every high-impact news release. Since using PipFactor , I've started skipping those setups entirely based on the sentiment score — that alone changed my results.",
    name: "Marcus T.",
    role: "Beginner Trader",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAT12-cjGEHvWfT1IFpI1DbxLQtqCyUXnPVKqInyjt20X4oz65AAEB-jYrQWeetzxgL0hvIaa6ChkoN405312nkeb8sbcF1rf5drCoRcos9LjTZAstHFvqlYejX9ssU1j4eortXuOUXZDgpzgQVAaNSyXjkzqilk0DNmEvWu6HJ6GRbPXkzgyiB7cMo-J4c9O9hi7nUApcga24GOXGiIbwWHJTtbHkBfwqizI9jPgHuyO0z-h7Ur5CtxrinV58Qe0Mgcqhwy93SpYM",
  },
  {
    quote: "The sentiment scoring is the part I use most. As a prop firm trader, I need to know whether a move is news-driven or technical before I take it — PipFactor gives me that instantly.",
    name: "Sarah L.",
    role: "Prop Firm Trader",
  },
  {
    quote: "As a newbie, understanding market data was overwhelming. PipFactor simplifies everything into clear, actionable trade setups with defined risk — I finally know when to step in and when to stay out.",
    name: "James K.",
    role: "Retail Trader",
  },
  {
    quote: "I love how context-aware the signals are. It's not just a level and an arrow — you get the regime, the news driver, and the confidence. It actually feels like a second opinion from someone who's done the homework.",
    name: "Elena R.",
    role: "Swing Trader",
  }
];

export const Testimonials = () => {
  return (
    <section className="relative z-10 py-20 md:py-32 overflow-hidden bg-transparent">
      {/* Background Glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#C8935A]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-[#C8935A]/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between mb-16 gap-8">
          <Reveal>
            <div className="max-w-xl">
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-full">
                Early Reviews
              </span>
              <h2 className="text-4xl lg:text-5xl font-display font-semibold text-white mb-6">
                What <span className="text-[#E2B485] drop-shadow-[0_0_15px_rgba(226,180,133,0.3)]">Traders</span> Are Saying
              </h2>
              <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                Feedback from traders during the 7-day free trial. No incentives offered — unfiltered experience.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex items-center gap-4 pt-4 md:pt-0">
              <button className="group flex items-center justify-center w-12 h-12 rounded-full border border-slate-700 hover:bg-[#C8935A]/20 hover:border-[#C8935A]/50 transition-all duration-300">
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-[#E2B485]" />
              </button>
              <button className="group flex items-center justify-center w-12 h-12 rounded-full border border-slate-700 hover:bg-[#C8935A]/20 hover:border-[#C8935A]/50 transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#E2B485]" />
              </button>
            </div>
          </Reveal>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">

          {/* Main Hero Testimonial */}
          <div className="col-span-1 md:col-span-12 lg:col-span-7">
            <Reveal delay={200} className="h-full">
              <div className="flex flex-col h-full justify-between rounded-3xl p-8 md:p-12 relative overflow-hidden border border-[#C8935A]/10 bg-[#111315]/95 group hover:bg-[#C8935A]/5 shadow-lg transition-colors duration-500">
                {/* Watermark Quote */}
                <div className="absolute -top-6 -left-2 opacity-[0.03] pointer-events-none text-[160px] font-display text-white italic leading-none">
                  "
                </div>

                <div className="relative z-10">
                  <div className="flex gap-1 mb-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 text-[#F59E0B] fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed mb-10 text-slate-200 italic font-display">
                    "{testimonials[0].quote}"
                  </blockquote>
                </div>

                <div className="flex items-center gap-5 mt-auto relative z-10">
                  {testimonials[0].avatarUrl ? (
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-[#C8935A] to-[#F59E0B] rounded-full blur opacity-50"></div>
                      <img alt={testimonials[0].name} className="relative w-14 h-14 rounded-full object-cover border-2 border-white/20" src={testimonials[0].avatarUrl} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-semibold">
                      {testimonials[0].name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-lg text-white">{testimonials[0].name}</p>
                    <p className="text-slate-400 text-sm tracking-wide font-medium">{testimonials[0].role}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C8935A]/40 to-transparent"></div>
              </div>
            </Reveal>
          </div>

          <div className="col-span-1 md:col-span-12 lg:col-span-5 grid grid-rows-2 gap-6">
            {/* Secondary Testimonial 1 */}
            <Reveal delay={300} className="h-full">
              <div className="flex flex-col justify-between h-full rounded-3xl p-8 relative overflow-hidden group transition-all duration-300 hover:border-[#C8935A]/30 border border-[#C8935A]/10 bg-[#111315]/95 hover:bg-[#C8935A]/5 shadow-lg">
                <div className="relative z-10">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-[#F59E0B] fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-slate-300 mb-6 italic leading-relaxed">
                    "{testimonials[1].quote}"
                  </blockquote>
                </div>
                <div className="mt-auto relative z-10">
                  <p className="font-semibold text-white">{testimonials[1].name}</p>
                  <p className="text-slate-400 text-xs tracking-wide">{testimonials[1].role}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#C8935A]/0 via-[#C8935A]/0 to-[#C8935A]/5 group-hover:to-[#C8935A]/10 transition-colors duration-500 rounded-3xl pointer-events-none"></div>
              </div>
            </Reveal>

            {/* Secondary Testimonial 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Reveal delay={400} className="h-full">
                <div className="flex flex-col justify-between h-full rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:border-[#C8935A]/30 border border-[#C8935A]/10 bg-[#111315]/95 hover:bg-[#C8935A]/5 shadow-lg">
                  <div className="relative z-10">
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 text-[#F59E0B] fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-sm text-slate-300 mb-4 italic leading-relaxed">
                      "{testimonials[2].quote}"
                    </blockquote>
                  </div>
                  <div className="mt-auto relative z-10">
                    <p className="font-semibold text-sm text-white">{testimonials[2].name}</p>
                    <p className="text-slate-400 text-[10px] tracking-wide line-clamp-1">{testimonials[2].role}</p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={500} className="h-full">
                <div className="flex flex-col justify-between h-full rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:border-[#C8935A]/30 border border-[#C8935A]/10 bg-[#111315]/95 hover:bg-[#C8935A]/5 shadow-lg">
                  <div className="relative z-10">
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 text-[#F59E0B] fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-sm text-slate-300 mb-4 italic leading-relaxed">
                      "{testimonials[3].quote}"
                    </blockquote>
                  </div>
                  <div className="mt-auto relative z-10">
                    <p className="font-semibold text-sm text-white">{testimonials[3].name}</p>
                    <p className="text-slate-400 text-[10px] tracking-wide line-clamp-1">{testimonials[3].role}</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Testimonials;
