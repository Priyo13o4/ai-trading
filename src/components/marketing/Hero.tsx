import { Button } from "@/components/ui/button";
import Particles from "./Particles";

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--brand)/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_80%_70%,hsl(var(--accent)/0.08),transparent_60%)]" />
      </div>

      <Particles />

      <div className="container mx-auto max-w-5xl py-24 md:py-32 text-center">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          AI-Powered Market Intelligence
        </span>
        <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight md:text-6xl">
          <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">StoxieX</span>{" "}
          brings clarity to markets
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Discover actionable insights, real-time sentiment, and a simple AI score — all in one platform.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" variant="gradient">Explore</Button>
          <Button size="lg" variant="secondary">Sign Up</Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
