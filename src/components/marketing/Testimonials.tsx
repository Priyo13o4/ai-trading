import { BadgeCheck, Database, Rocket, Shield, Zap } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

const items = [
  { icon: <Shield className="h-5 w-5 text-brand" aria-hidden />, title: "Secure by design", desc: "Privacy-first workflows and robust data handling." },
  { icon: <Zap className="h-5 w-5 text-brand" aria-hidden />, title: "Real-time", desc: "Signals update as markets move." },
  { icon: <Database className="h-5 w-5 text-brand" aria-hidden />, title: "Battle-tested stack", desc: "n8n • Supabase • Postgres • Redis" },
  { icon: <Rocket className="h-5 w-5 text-brand" aria-hidden />, title: "Fast & Lightweight", desc: "Optimized UI with smooth interactions." },
] as const;

const Testimonials = () => {
  return (
    <section aria-labelledby="trust-heading" className="py-16 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 id="trust-heading" className="text-center font-display text-3xl md:text-4xl font-semibold">
          Trusted, efficient, and ready
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Join traders who rely on clean, actionable insights.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, idx) => (
            <Reveal key={idx} delay={idx * 90}>
              <article className="rounded-xl border bg-card/70 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand/10 text-brand">
                    {it.icon}
                  </div>
                  <h3 className="font-medium">{it.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{it.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
