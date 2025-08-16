import { Bot, BarChart3, ShieldCheck, Zap } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import anime from "animejs";
import Reveal from "@/components/marketing/Reveal";
import CandlestickChart from "@/components/marketing/CandlestickChart";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export const Features = () => {
  const features = [
    {
      icon: <Bot className="w-12 h-12 text-brand" aria-hidden />,
      title: "AI-Powered Signals",
      description:
        "Leverage advanced models that analyze market data 24/7 to provide high-probability trading signals.",
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-brand" aria-hidden />,
      title: "Multi-Factor Analysis",
      description:
        "Trends, volatility, momentum, and news sentiment combined for a holistic market view.",
    },
    {
      icon: <ShieldCheck className="w-12 h-12 text-brand" aria-hidden />,
      title: "Clear & Actionable",
      description:
        "Precise entry, take-profit, and stop-loss levels. No guesswork.",
    },
    {
      icon: <Zap className="w-12 h-12 text-brand" aria-hidden />,
      title: "Real-Time Delivery",
      description:
        "Get instant notifications through the app or integrate with Telegram and webhooks.",
    },
  ] as const;

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  // ---- Shared timer state ----
  const DURATION_MS = 5000;
  const rafIdRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const carriedMsRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancelRaf = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };
  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  // Progress ticker
  const tick = () => {
    const now = performance.now();
    const elapsed = now - startTsRef.current + carriedMsRef.current;
    const pct = Math.min((elapsed / DURATION_MS) * 100, 100);
    setProgress(pct);

    if (pct < 100 && !pausedRef.current) {
      rafIdRef.current = requestAnimationFrame(tick);
    } else {
      cancelRaf();
    }
  };

  const startProgressAndTimer = (fromMs = 0) => {
    cancelRaf();
    clearTimer();
    carriedMsRef.current = fromMs;
    startTsRef.current = performance.now();
    pausedRef.current = false;
    setProgress((fromMs / DURATION_MS) * 100);
    rafIdRef.current = requestAnimationFrame(tick);

    // schedule slide change
    const remaining = DURATION_MS - fromMs;
    timeoutRef.current = setTimeout(() => {
      if (api) {
        api.scrollNext();
      }
    }, remaining);
  };

  const pauseAll = () => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    cancelRaf();
    clearTimer();
    carriedMsRef.current += performance.now() - startTsRef.current;
  };

  const resumeAll = () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    startTsRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(tick);

    const remaining = DURATION_MS - carriedMsRef.current;
    timeoutRef.current = setTimeout(() => {
      if (api) {
        api.scrollNext();
      }
    }, remaining);
  };

  const resetAndStart = () => {
    setCurrent(api!.selectedScrollSnap());
    setProgress(0);
    carriedMsRef.current = 0;
    startProgressAndTimer(0);
  };

  // ---- Animate content entrance ----
  const playAnimation = useCallback(() => {
    anime({
      targets: ".feature-content-wrapper",
      translateX: ["30rem", 0],
      opacity: [0, 1],
      easing: "easeOutExpo",
      duration: 1000,
    });
  }, []);

  // ---- Wire Embla events ----
  useEffect(() => {
    if (!api) return;

    const onSelect = () => resetAndStart();
    const onReInit = () => resetAndStart();
    const onPointerDown = () => pauseAll();
    const onPointerUp = () => resumeAll();

    api.on("select", onSelect);
    api.on("reInit", onReInit);
    api.on("pointerDown", onPointerDown);
    api.on("pointerUp", onPointerUp);

    // Pause on hover over root
    const root = api.rootNode();
    const onEnter = () => pauseAll();
    const onLeave = () => resumeAll();
    root.addEventListener("mouseenter", onEnter);
    root.addEventListener("mouseleave", onLeave);

    onSelect(); // kick off

    return () => {
      cancelRaf();
      clearTimer();
      api.off("select", onSelect);
      api.off("reInit", onReInit);
      api.off("pointerDown", onPointerDown);
      api.off("pointerUp", onPointerUp);
      root.removeEventListener("mouseenter", onEnter);
      root.removeEventListener("mouseleave", onLeave);
    };
  }, [api]);

  return (
    <section
      id="features"
      className="relative z-10 py-16 md:py-20 px-4 overflow-hidden"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-3xl font-display font-semibold text-white">
              Why Choose Signal AI?
            </h2>
            <p className="text-gray-400 mt-4 text-lg leading-relaxed">
              Our platform is built on a foundation of powerful, data-driven
              features designed for modern traders.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="relative h-[450px] md:h-auto">
              <CandlestickChart />
            </div>
          </Reveal>

          <Reveal onVisible={playAnimation} className="opacity-0">
            <div className="feature-content-wrapper flex items-center gap-6">
              {/* Segmented progress bar */}
              <div className="segmented-progress-bar">
                {features.map((_, index) => (
                  <div key={index} className="progress-segment">
                    <div
                      className="progress-segment-fill"
                      style={{
                        height:
                          index < current
                            ? "100%"
                            : index === current
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Autoplaying vertical carousel */}
              <Carousel
                setApi={setApi}
                opts={{ loop: true }}
                orientation="vertical"
                className="w-full max-w-md"
              >
                <CarouselContent className="-mt-4 h-[200px]">
                  {features.map((feature, idx) => (
                    <CarouselItem key={idx} className="pt-4 basis-full">
                      <article className="flex items-start gap-6">
                        <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                        <div>
                          <h3 className="text-2xl font-semibold text-white mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-gray-300 text-lg leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </article>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};