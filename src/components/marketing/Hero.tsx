import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCursorGlow } from "@/hooks/useCursorGlow";
import Lottie from "lottie-react";
import animationData from "@/assets/animation.json";
import { TrueFocusText } from "@/components/marketing/TrueFocusText";
import { ShinyText } from "@/components/marketing/ShinyText";
import { useLowSpecDevice } from "@/hooks/useLowSpecDevice";

export const Hero = () => {
  const isLowSpecDevice = useLowSpecDevice();
  const shouldEnableGlow = !isLowSpecDevice;
  const heroGlowRef = useCursorGlow(shouldEnableGlow);
  // Note: fade-in handled by CSS animation (hero-fade-in class) to avoid
  // JS-driven opacity:0 delaying the Largest Contentful Paint element.

  return (
    <section
      ref={heroGlowRef as React.RefObject<HTMLElement>}
      id="home"
      className={cn(
        "relative min-h-screen md:h-screen w-full md:overflow-hidden pt-16 md:pt-0",
        shouldEnableGlow && "cursor-glow"
      )}
    >

      {/* Container for the hero text and graph */}
      <div
        className={cn(
          "relative z-10 flex h-full items-center justify-between hero-fade-in",
          "container mx-auto px-4 flex-col md:flex-row"
        )}
      >
        {/* Text Section */}
        <div className="w-full md:w-1/2 space-y-8">
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="inline-flex items-center rounded-full bg-[#C8935A]/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#E2B485]">
                7-Day Free Trial
              </span>
              <span className="text-sm text-[#E2B485]/80">
                Every feature unlocked. No card required.
              </span>
            </div>
            {/*
             * Single h1 containing the full headline for correct heading hierarchy.
             * TrueFocusText animates "Stop Guessing" inline; ShinyText animates
             * "Start Trading with AI" — both are semantically part of the same heading.
             */}
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-white">
              <TrueFocusText
                words={["Stop", "Guessing"]}
                pauseBetweenAnimations={2}
                borderColor="#D4AF37"
                glowColor="rgba(212, 175, 55, 0.6)"
                blurAmount={6}
                className="mb-2"
              />
              <ShinyText text="Start Trading with AI" speed={4} className="text-white" />
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
              PipFactor continuously analyzes price structure, volatility, and major economic events to deliver structured, high-confidence trading signals in real time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
            <RequireAuth to="/signal">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full bg-[#E2B485] text-[#111315] hover:bg-[#C8935A] hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(226,180,133,0.4)] px-10 py-6 text-lg font-bold tracking-wide border border-[#C8935A]"
              >
                Get Early Access
              </Button>
            </RequireAuth>
            <Button
              variant="link"
              className="text-gray-300 hover:text-white text-lg font-medium"
              onClick={() => {
                window.scrollTo({ top: document.getElementById('how-it-works')?.offsetTop || 0, behavior: 'smooth' });
              }}
            >
              See How It Works
            </Button>
          </div>
        </div>

        {/* Animation Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            <Lottie
              animationData={animationData}
              loop={!isLowSpecDevice}
              autoplay={!isLowSpecDevice}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};