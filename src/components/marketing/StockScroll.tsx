import { useEffect, useRef } from "react";
import anime from "animejs";

// Scroll-synced SVG stock-like line using anime.js
// - Animates strokeDashoffset as you scroll through the section
// - Adds subtle glow and optional parallax badges

const StockScroll = ({ symbol = "XAUUSD" }: { symbol?: string }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const animRef = useRef<anime.AnimeInstance | null>(null);
  const lengthRef = useRef(0);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    // Compute total length and set initial dash
    const total = path.getTotalLength();
    lengthRef.current = total;
    path.style.strokeDasharray = String(total);
    path.style.strokeDashoffset = String(total);

    // Create anime instance (autoplay disabled, controlled by scroll)
    animRef.current = anime({
      targets: path,
      strokeDashoffset: [total, 0],
      easing: "linear",
      duration: 2000,
      autoplay: false,
    });

    const onScroll = () => {
      if (!wrapperRef.current || !animRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // progress: when top hits middle of screen to when bottom leaves middle
      const start = vh * 0.15;
      const end = vh * 0.85;
      const totalDist = rect.height + (end - start);
      const dist = end - rect.top; // how far we have scrolled into the section
      const progress = Math.min(1, Math.max(0, dist / totalDist));
      const inst = animRef.current;
      inst.seek(inst.duration * progress);

      // Simple parallax for badges
      const badges = wrapperRef.current.querySelectorAll("[data-badge]");
      badges.forEach((el, idx) => {
        const depth = (idx + 1) * 8; // px offset multiplier
        (el as HTMLElement).style.transform = `translateY(${(1 - progress) * depth}px)`;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section aria-label="Scroll stock animation" className="py-8 md:py-10 px-4">
      <div ref={wrapperRef} className="container mx-auto">
        <div className="mb-4 text-center text-sm text-muted-foreground">{symbol} intraday momentum (illustrative)</div>
        <div className="relative w-full overflow-visible">
          <svg viewBox="0 0 1000 260" className="w-full h-48 md:h-56">
            {/* Glow */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              ref={pathRef}
              d="M 0 190 C 120 160, 160 120, 240 130 S 380 190, 460 150 S 640 100, 720 150 S 860 220, 1000 140"
              fill="none"
              stroke="hsl(var(--brand))"
              strokeWidth="3"
              filter="url(#glow)"
            />
          </svg>

          {/* Parallax badges */}
          <div className="absolute left-[18%] top-6 text-xs" data-badge>
            <span className="rounded-full border bg-card/80 px-2 py-1 shadow-sm">Breakout</span>
          </div>
          <div className="absolute left-[48%] -top-1 text-xs" data-badge>
            <span className="rounded-full border bg-card/80 px-2 py-1 shadow-sm">Pullback</span>
          </div>
          <div className="absolute left-[78%] top-10 text-xs" data-badge>
            <span className="rounded-full border bg-card/80 px-2 py-1 shadow-sm">New High</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StockScroll;
