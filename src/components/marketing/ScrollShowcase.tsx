import { useEffect, useMemo, useRef, useState } from "react";
import anime from "animejs";

// ScrollShowcase
// A scroll-synced, sticky section that draws an SVG line for XAUUSD then dissolves
// and transitions to EURUSD as you scroll down. Floating cards move subtly around
// the chart. Scrolling up reverses the sequence.
//
// Implementation notes:
// - Uses Anime.js to control strokeDashoffset seeking via scroll progress
// - Progress map: [0, 0.45] draw GOLD, [0.45, 0.55] dissolve, [0.55, 1] draw EURUSD
// - Content cards transform based on progress. No business logic affected.
// - Accessible with aria labels and responsive layout.

const GOLD_UP_THEN_DOWN =
  "M 0 180 C 130 150 220 110 310 120 S 470 175 560 145 S 730 95 830 135 S 950 200 1000 165";

const EURUSD_MILD_TREND =
  "M 0 170 C 120 160 200 140 280 150 S 430 175 520 165 S 700 150 800 160 S 900 185 1000 170";

const SECTION_HEIGHT_VH = 220; // tall scroll range for a smooth experience

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function ScrollShowcase() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const pathGoldRef = useRef<SVGPathElement | null>(null);
  const pathEurRef = useRef<SVGPathElement | null>(null);
  const animGoldRef = useRef<anime.AnimeInstance | null>(null);
  const animEurRef = useRef<anime.AnimeInstance | null>(null);
  const [progress, setProgress] = useState(0);
  const [sizes, setSizes] = useState({ w: 1000, h: 260 });

  // Prepare stroke animation for each path
  useEffect(() => {
    const pg = pathGoldRef.current;
    const pe = pathEurRef.current;
    if (!pg || !pe) return;

    const lenG = pg.getTotalLength();
    pg.style.strokeDasharray = String(lenG);
    pg.style.strokeDashoffset = String(lenG);

    const lenE = pe.getTotalLength();
    pe.style.strokeDasharray = String(lenE);
    pe.style.strokeDashoffset = String(lenE);

    animGoldRef.current = anime({
      targets: pg,
      strokeDashoffset: [lenG, 0],
      easing: "linear",
      duration: 2200,
      autoplay: false,
    });

    animEurRef.current = anime({
      targets: pe,
      strokeDashoffset: [lenE, 0],
      easing: "linear",
      duration: 2200,
      autoplay: false,
    });
  }, []);

  // Handle sizing (soft responsiveness for the svg viewBox)
  useEffect(() => {
    const onResize = () => {
      const baseW = typeof window !== "undefined" ? window.innerWidth : 1000;
      const w = Math.max(640, Math.min(1400, baseW));
      const h = Math.round((w / 1000) * 260);
      setSizes({ w, h });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Scroll handler – computes local progress within the section
  useEffect(() => {
    const onScroll = () => {
      if (!outerRef.current || !stickyRef.current) return;
      const rect = outerRef.current.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      const full = rect.height - vh; // distance over which sticky is pinned
      const into = clamp01((vh - rect.top) / (full + vh));
      const p = clamp01(into);
      setProgress(p);

      // Expose progress as CSS variable (for optional usage)
      outerRef.current.style.setProperty("--scroll-showcase-progress", String(p));

      // Phase mapping
      const drawEnd = 0.45;
      const dissolveEnd = 0.55;

      // Draw GOLD
      const g = clamp01(p / drawEnd);
      if (animGoldRef.current) animGoldRef.current.seek(animGoldRef.current.duration * g);

      // Dissolve crossfade
      const xfade = p < drawEnd ? 0 : p > dissolveEnd ? 1 : (p - drawEnd) / (dissolveEnd - drawEnd);

      // Draw EUR
      const e = p <= dissolveEnd ? 0 : clamp01((p - dissolveEnd) / (1 - dissolveEnd));
      if (animEurRef.current) animEurRef.current.seek(animEurRef.current.duration * e);

      // Opacities
      const goldOpacity = 1 - xfade; // 1 -> 0 across dissolve
      const eurOpacity = xfade; // 0 -> 1 across dissolve

      if (pathGoldRef.current) pathGoldRef.current.style.opacity = String(goldOpacity);
      if (pathEurRef.current) pathEurRef.current.style.opacity = String(eurOpacity);

      // Floating cards motion (simple parallax curves)
      const cards = outerRef.current.querySelectorAll<HTMLElement>("[data-float-card]");
      cards.forEach((el, idx) => {
        const dir = idx % 2 === 0 ? 1 : -1; // alternate directions
        const amp = 18 + idx * 6; // amplitude in px
        const x = Math.sin(p * Math.PI) * amp * dir;
        const y = (1 - Math.cos(p * Math.PI)) * (8 + idx * 4);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.style.opacity = String(0.85 + 0.15 * Math.cos(p * Math.PI));
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

  const { w, h } = sizes;
  const viewBox = useMemo(() => `0 0 1000 260`, []);

  const phaseLabel = progress < 0.5 ? "XAUUSD" : "EURUSD";

  return (
    <section aria-label="Scroll-synced trading animation" className="relative px-4">
      <div
        ref={outerRef}
        className="relative w-full"
        style={{ height: `${SECTION_HEIGHT_VH}vh` }}
      >
        {/* Sticky stage */}
        <div ref={stickyRef} className="sticky top-0">
          <div className="container mx-auto">
            <div className="relative w-full overflow-visible rounded-2xl border bg-card/60 backdrop-blur px-3 py-4 md:px-6 md:py-6">
              {/* Header row with symbol that crossfades */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--brand))] shadow-[var(--shadow-glow)]" aria-hidden />
                  <span className="text-xs md:text-sm text-muted-foreground">Scroll to draw the market path</span>
                </div>
                <div className="relative h-6 w-28 md:h-7 md:w-36" aria-live="polite">
                  <span
                    className="absolute inset-0 flex items-center justify-end font-medium text-xs md:text-sm transition-opacity"
                    style={{ opacity: progress < 0.5 ? 1 : 0 }}
                  >
                    XAUUSD
                  </span>
                  <span
                    className="absolute inset-0 flex items-center justify-end font-medium text-xs md:text-sm transition-opacity"
                    style={{ opacity: progress < 0.5 ? 0 : 1 }}
                  >
                    EURUSD
                  </span>
                </div>
              </div>

              <div className="relative w-full overflow-visible">
                <svg viewBox={viewBox} width={w} height={h} className="w-full h-56 md:h-64">
                  <defs>
                    <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* grid */}
                  <g opacity="0.25">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <line key={`v-${i}`} x1={(i + 1) * (1000 / 10)} y1={20} x2={(i + 1) * (1000 / 10)} y2={240} stroke="hsl(var(--muted-foreground))" strokeWidth={0.5} />
                    ))}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <line key={`h-${i}`} x1={30} y1={(i + 1) * (220 / 6) + 40} x2={970} y2={(i + 1) * (220 / 6) + 40} stroke="hsl(var(--muted-foreground))" strokeWidth={0.5} />
                    ))}
                  </g>

                  {/* GOLD path */}
                  <path
                    ref={pathGoldRef}
                    d={GOLD_UP_THEN_DOWN}
                    fill="none"
                    stroke="hsl(var(--brand))"
                    strokeWidth={3}
                    filter="url(#glow-soft)"
                    opacity={1}
                  />

                  {/* EURUSD path */}
                  <path
                    ref={pathEurRef}
                    d={EURUSD_MILD_TREND}
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    filter="url(#glow-soft)"
                    opacity={0}
                  />
                </svg>

                {/* Floating cards around the chart */}
                <div className="pointer-events-none md:pointer-events-auto">
                  <div
                    data-float-card
                    className="absolute left-[8%] top-6 md:top-4 w-36 md:w-44 rounded-lg border bg-background/90 px-3 py-2 shadow-sm"
                    aria-label="Momentum breakout"
                  >
                    <p className="text-[10px] md:text-xs text-muted-foreground">Pattern</p>
                    <p className="text-xs md:text-sm font-medium">Breakout forming</p>
                  </div>

                  <div
                    data-float-card
                    className="absolute left-[42%] -top-3 md:top-0 w-36 md:w-44 rounded-lg border bg-background/90 px-3 py-2 shadow-sm"
                    aria-label="Pullback area"
                  >
                    <p className="text-[10px] md:text-xs text-muted-foreground">Zone</p>
                    <p className="text-xs md:text-sm font-medium">Healthy pullback</p>
                  </div>

                  <div
                    data-float-card
                    className="absolute right-[6%] top-10 md:top-8 w-36 md:w-44 rounded-lg border bg-background/90 px-3 py-2 shadow-sm"
                    aria-label="New high label"
                  >
                    <p className="text-[10px] md:text-xs text-muted-foreground">Signal</p>
                    <p className="text-xs md:text-sm font-medium">New local high</p>
                  </div>
                </div>
              </div>

              {/* Scroll hint */}
              <div className="mt-3 flex items-center justify-between text-[11px] md:text-xs text-muted-foreground">
                <span>Pair: <span className="font-medium">{phaseLabel}</span></span>
                <span className="hidden md:block">Scroll down to continue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
