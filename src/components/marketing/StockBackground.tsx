import { useEffect, useMemo, useRef, useState } from "react";
import anime from "animejs";

// A fixed, full-page background stock-like simulation.
// - Controlled by page scroll from top until the anchor section
// - Smooth stroke draw, gradient area, and moving particles along the path

function generatePath(width: number, height: number, points = 18) {
  // Generate a smooth pseudo-price path
  const margin = 24;
  const w = Math.max(640, width);
  const h = Math.max(240, height);
  const stepX = w / (points - 1);

  let y = h * 0.6;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < points; i++) {
    // controlled random walk with gentle drift
    const drift = (i / points) * (h * -0.15);
    const noise = (Math.sin(i * 0.9) + Math.cos(i * 0.6)) * (h * 0.04);
    const jitter = (Math.random() - 0.5) * (h * 0.06);
    y = Math.max(margin, Math.min(h - margin, y + noise + jitter + drift * 0.1));
    pts.push({ x: i * stepX, y });
  }

  // Build a path using straight lines (good enough visually for a background)
  const d = [
    `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`,
    ...pts.slice(1).map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
  ].join(" ");

  // Area path (close to bottom)
  const dArea = `${d} L ${pts[pts.length - 1].x.toFixed(1)} ${h} L ${pts[0].x.toFixed(1)} ${h} Z`;

  return { d, dArea };
}

const StockBackground = ({ symbol = "XAUUSD", anchorId = "live-preview-section" }: { symbol?: string; anchorId?: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const areaRef = useRef<SVGPathElement | null>(null);
  const particlesRef = useRef<SVGCircleElement[]>([]);
  const animRef = useRef<anime.AnimeInstance | null>(null);
  const [size, setSize] = useState({ w: 1200, h: 420 });
  const [paths, setPaths] = useState({ d: "", dArea: "" });

  // Recompute paths on resize
  useEffect(() => {
    const onResize = () => {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const w = vw * 1.25; // extra width for parallax look
      const h = Math.max(360, Math.min(520, Math.round(vh * 0.48)));
      setSize({ w, h });
      setPaths(generatePath(w, h, 22));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Initialize draw animation
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const total = path.getTotalLength();
    path.style.strokeDasharray = String(total);
    path.style.strokeDashoffset = String(total);

    animRef.current = anime({
      targets: path,
      strokeDashoffset: [total, 0],
      easing: "easeOutSine",
      duration: 2200,
      autoplay: false,
    });
  }, [paths.d]);

  // Scroll handler: control progress and particle positions
  useEffect(() => {
    const onScroll = () => {
      const inst = animRef.current;
      const path = pathRef.current;
      // Ensure animation and path are ready and path data exists
      if (!inst || !path || !paths.d) return;

      // Safely get total length; bail if path is not ready
      let total = 0;
      try {
        total = path.getTotalLength();
      } catch (_) {
        return;
      }
      if (!isFinite(total) || total <= 0) return;

      const anchor = document.getElementById(anchorId);
      const limit = anchor ? anchor.getBoundingClientRect().top + window.scrollY : window.innerHeight * 2;
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, limit - 100)));
      inst.seek(inst.duration * progress);

      // Move particles along the path
      const offsets = [0.1, 0.45, 0.8];
      particlesRef.current.forEach((c, i) => {
        if (!c) return;
        const l = (progress + offsets[i]) % 1;
        const dist = Math.max(0, Math.min(total, total * l));
        try {
          const pos = path.getPointAtLength(dist);
          c.setAttribute("cx", String(pos.x));
          c.setAttribute("cy", String(pos.y));
        } catch (_) {
          // If querying before the path is fully ready, skip this frame
        }
      });

      // Fade background as we approach the anchor
      const container = containerRef.current;
      if (container) container.style.opacity = String(1 - Math.max(0, progress - 0.85) / 0.15);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [anchorId, paths.d]);

  const setParticleRef = (el: SVGCircleElement | null, i: number) => {
    if (!el) return;
    particlesRef.current[i] = el;
  };

  const viewBox = useMemo(() => `0 0 ${size.w} ${size.h}`, [size]);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 -z-10 select-none">
      <svg className="absolute inset-x-0 top-24 w-[140%] max-w-none" height={size.h} viewBox={viewBox} aria-hidden>
        <defs>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glowBg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Area fill */}
        <path ref={areaRef} d={paths.dArea} fill="url(#areaGrad)" stroke="none" />
        {/* Main line */}
        <path
          ref={pathRef}
          d={paths.d}
          fill="none"
          stroke="hsl(var(--brand))"
          strokeWidth={3}
          filter="url(#glowBg)"
        />

        {/* Moving particles following the line */}
        <circle ref={(el) => setParticleRef(el, 0)} r={3} fill="hsl(var(--accent))" />
        <circle ref={(el) => setParticleRef(el, 1)} r={2.5} fill="hsl(var(--brand))" />
        <circle ref={(el) => setParticleRef(el, 2)} r={2.5} fill="hsl(var(--brand-2, var(--brand)))" />
      </svg>

      {/* Subtle label in corner */}
      <div className="absolute right-6 top-20 text-xs text-muted-foreground/70">
        {symbol} simulated path
      </div>
    </div>
  );
};

export default StockBackground;
