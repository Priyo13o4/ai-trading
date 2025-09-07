import { CheckCircle, Gauge, Sparkles, Bell } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

const steps = [
  {
    icon: <Sparkles className="h-6 w-6 text-brand" aria-hidden />,
    title: "AI Ingests the Market",
    desc: "Our pipelines read filings, news, price action and sentiment in real time.",
  },
  {
    icon: <Gauge className="h-6 w-6 text-brand" aria-hidden />,
    title: "Signals Scored",
    desc: "Multi-factor models score opportunities and define entries, TP and SL.",
  },
  {
    icon: <Bell className="h-6 w-6 text-brand" aria-hidden />,
    title: "Delivered to You",
    desc: "See them on the app or push to Telegram/other destinations.",
  },
] as const;

const HowItWorks = () => {
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <section aria-labelledby="hiw-heading" className="relative z-10 py-16 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 id="hiw-heading" className="text-center font-display text-3xl md:text-4xl font-semibold text-white">
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-300">
          From raw data to actionable signals in three clear steps.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 90}>
              <article 
                className="group trading-card p-6 shadow-sm transition hover:scale-105" 
                onMouseMove={handleMouseMove}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand/10 text-brand">
                    {s.icon}
                  </div>
                  <h3 className="font-medium text-white">{i + 1}. {s.title}</h3>
                </div>
                <p className="mt-3 text-sm text-gray-300">{s.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-4 w-4" aria-hidden />
                  Built for reliability and clarity
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
