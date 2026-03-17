import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MessageCircle } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

const faqs = [
  {
    q: "What exactly does PipFactor do?",
    a: "We provide AI-generated strategies for trade executions. Our system analyzes real-time news sentiment and robust technical data, combining them into curated strategies so you don't have to.",
  },
  {
    q: "Is there a free trial available?",
    a: "Yes, we offer a 7-day free trial. You can test our news sentiment analysis and AI strategies completely risk-free.",
  },
  {
    q: "Do I need trading experience to use the platform?",
    a: "Not at all. Our strategy generation is highly user-focused and designed specifically for beginners. If you have a hard time understanding technical data or frequently get stopped out by high news volatility, our AI curates safe, context-aware strategies for you.",
  },
  {
    q: "Does PipFactor integrate directly with MT5?",
    a: "Direct MT5 integration is currently on our roadmap for future scope. For now, you can easily execute our clear, actionable AI strategies manually on your preferred trading platform.",
  },
];

const FAQ = () => {
  return (
    <section className="relative z-10 pt-48 pb-24 md:pt-56 px-4 bg-[#111315] text-[#E0E0E0] overflow-hidden">

      {/* Top Neon Green Highlight Border */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FF41] to-transparent opacity-80 shadow-[0_0_20px_#00FF41]" />

      {/* Background Graphic/Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8935A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C8935A]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">

        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

            {/* Left Column: Header & Search */}
            <div className="lg:col-span-4 flex flex-col justify-center">
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#E2B485] mb-6">
                PipFactor FAQ
              </h2>
              <p className="text-[#9CA3AF] text-lg leading-relaxed mb-10">
                Need help with our AI trading platform? Explore frequently asked questions about trading, account management, and advanced features.
              </p>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#C8935A] transition-colors" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="w-full bg-[#111315] border border-[#C8935A]/30 rounded-full py-4 pl-12 pr-6 text-[#E0E0E0] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C8935A] focus:border-[#C8935A] transition-all shadow-[0_0_15px_rgba(200,147,90,0.15)] hover:border-[#E2B485]/50"
                />
              </div>
            </div>

            {/* Right Column: Accordion List */}
            <div className="lg:col-span-8">
              <Accordion type="single" collapsible defaultValue="item-0" className="w-full flex flex-col gap-4">
                {faqs.map((f, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="border border-[#C8935A]/20 bg-[#111315]/80 rounded-2xl px-6 py-2 overflow-hidden data-[state=open]:bg-[#C8935A]/5 transition-all shadow-md"
                  >
                    <AccordionTrigger className="text-left text-[#E0E0E0] hover:text-[#E2B485] font-medium text-base md:text-lg hover:no-underline [&[data-state=open]]:text-[#E2B485] py-4">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-[#9CA3AF] leading-relaxed text-[15px] md:text-base pb-6">
                      <div className="pt-2 border-t border-[#C8935A]/10 mt-2">
                        {f.a}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

          </div>
        </Reveal>

        {/* Bottom Support Card */}
        <Reveal delay={200}>
          <div className="mt-20 mx-auto max-w-4xl rounded-[2rem] p-[1px] relative group overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">

            {/* Gradient Border for bottom card */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#C8935A]/30 to-transparent pointer-events-none rounded-[2rem]" />

            <div className="relative bg-[#111315] rounded-[2rem] px-8 py-16 text-center border top-0 border-[#C8935A]/10 flex flex-col items-center justify-center">

              <h3 className="text-3xl font-display font-bold text-[#E0E0E0] mb-4">
                Still have questions?
              </h3>
              <p className="text-[#9CA3AF] mb-8 max-w-md mx-auto">
                Join over 10,000+ traders already maximizing profits with our AI models.
              </p>

              <button className="flex items-center gap-2 rounded-full border border-[#C8935A]/40 bg-[#111315] hover:bg-[#C8935A]/10 backdrop-blur-md px-8 py-4 text-[#E2B485] font-medium transition-all group-hover:border-[#E2B485] group-hover:shadow-[0_0_25px_rgba(200,147,90,0.3)]">
                <MessageCircle className="w-5 h-5 text-[#E2B485]" />
                Chat to our team
              </button>

              <p className="mt-6 text-sm text-slate-500">
                Or email us at <a href="mailto:support@pipfactor.ai" className="text-[#C8935A] hover:underline hover:text-[#E2B485] transition-colors">support@pipfactor.ai</a>
              </p>

            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
};

export default FAQ;
