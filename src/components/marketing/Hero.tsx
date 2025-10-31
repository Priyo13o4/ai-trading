import { useNavigate } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useCursorGlow } from "@/hooks/useCursorGlow";
import Lottie from "lottie-react";
import animationData from "@/assets/animation.json";

const HEADLINE_VARIANTS = [
  "Stop Guessing.\nStart Data-Driven\nTrading.",
  "AI-Powered Signals.\nReal-Time Analysis.\nMaximize Profits.",
  "Smart Trading.\nBacked by Data.\nBuilt for Winners."
];

export const Hero = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const heroGlowRef = useCursorGlow();

  // --- Start of Fade Cycle Logic ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const cycleDuration = 4000; // Show each variant for 4 seconds
    const fadeDuration = 800;   // Fade transition duration

    const scheduleNext = () => {
      timerRef.current = window.setTimeout(() => {
        setIsFading(true);
        
        // After fade out, switch to next variant
        timerRef.current = window.setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % HEADLINE_VARIANTS.length);
          setIsFading(false);
        }, fadeDuration);
      }, cycleDuration - fadeDuration);
    };

    scheduleNext();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex]);
  // --- End of Fade Cycle Logic ---  // Simple fade in animation for content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.transform = "translateY(0)";
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section 
      ref={heroGlowRef as React.RefObject<HTMLElement>}
      id="home" 
      className="relative h-screen w-full overflow-hidden mesh-gradient-hero cursor-glow pt-16 md:pt-0"
    >
      {/* Subtle animated overlay for depth */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0 animate-blob"
          style={{
            background: `radial-gradient(circle at 30% 40%, rgba(43, 108, 176, 0.1) 0%, transparent 50%)`,
          }}
        />
        <div 
          className="absolute inset-0 animate-blob animation-delay-2000"
          style={{
            background: `radial-gradient(circle at 70% 60%, rgba(45, 55, 72, 0.1) 0%, transparent 50%)`,
          }}
        />
      </div>
      
      {/* Container for the hero text and graph */}
      <div
        ref={contentRef}
        className={cn(
          "relative z-10 flex h-full items-center justify-between opacity-0 transform translate-y-5 transition-all duration-1000 ease-out",
          "container mx-auto px-4 flex-col md:flex-row"
        )}
      >
        {/* Text Section */}
        <div className="w-full md:w-1/2 space-y-8">
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="inline-flex items-center rounded-full bg-blue-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
                Free Beta Access
              </span>
              <span className="text-sm text-blue-100/80">
                Every feature is unlocked while we build PipFactor with early traders.
              </span>
            </div>
            {/* Headline with Fade Transition */}
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-white min-h-[9rem] sm:min-h-[10rem] md:min-h-[12rem] flex items-start">
              <span
                className={cn(
                  "transition-opacity duration-800 whitespace-pre-line",
                  isFading ? "opacity-0" : "opacity-100"
                )}
              >
                {HEADLINE_VARIANTS[currentIndex]}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
              Advanced AI analyzes the markets for you, delivering high-quality trading signals directly to your device.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
            <RequireAuth to="/signal">
              <Button
                size="lg"
                variant="hero"
                className="rounded-full w-full sm:w-auto"
              >
                Get Started
              </Button>
            </RequireAuth>
            <Button
              variant="link"
              className="text-gray-300 hover:text-white text-lg font-medium"
              onClick={() => {
                window.scrollTo({ top: document.getElementById('features')?.offsetTop || 0, behavior: 'smooth' });
              }}
            >
              Explore Our Features
            </Button>
          </div>
        </div>

        {/* Animation Section */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};