import { BarChart3, Bell, Gauge, Sparkles } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="group rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-medium">{title}</h3>
    </div>
    <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
  </div>
);

const Features = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <h2 className="text-center font-display text-3xl md:text-4xl">
          Powerful Features built for modern investors
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Everything you need to make informed investment decisions, powered by AI and real-time data.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={Gauge} title="AI-Powered Score" desc="Get a simple score for every stock, synthesized from 100+ data points." />
          <FeatureCard icon={Bell} title="StoxieWatch" desc="Keep track of companies and receive alerts when something changes." />
          <FeatureCard icon={Sparkles} title="StoxiePilot" desc="Conversational assistant to ask questions and generate insights instantly." />
        </div>
      </div>
    </section>
  );
};

export default Features;
