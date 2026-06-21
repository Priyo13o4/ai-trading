import { motion } from 'framer-motion';

interface TourSpotlightProps {
  /** Target rect in viewport coords, or null for a plain dimmed backdrop. */
  rect: DOMRect | null;
  padding?: number;
  reducedMotion?: boolean;
}

const RADIUS = 12;

/**
 * Dims the whole screen and "cuts a hole" around the active element using an SVG
 * mask. The hole + accent ring morph smoothly between targets with a spring.
 * The overlay captures pointer events, so the page underneath can't be clicked
 * mid-tour (advance via the tooltip buttons).
 */
export function TourSpotlight({ rect, padding = 8, reducedMotion }: TourSpotlightProps) {
  const transition = reducedMotion
    ? { duration: 0 }
    : ({ type: 'spring', stiffness: 320, damping: 32 } as const);

  if (!rect) {
    return (
      <motion.div
        className="fixed inset-0 z-[9998] bg-[#040506]/75"
        style={{ backdropFilter: 'blur(2px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.25 }}
      />
    );
  }

  const x = Math.max(0, rect.left - padding);
  const y = Math.max(0, rect.top - padding);
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;

  return (
    <motion.svg
      className="fixed inset-0 z-[9998] h-full w-full"
      width="100%"
      height="100%"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25 }}
      style={{ pointerEvents: 'auto' }}
    >
      <defs>
        <mask id="pf-spotlight-mask">
          <rect x={0} y={0} width="100%" height="100%" fill="white" />
          <motion.rect
            initial={false}
            animate={{ x, y, width: w, height: h }}
            transition={transition}
            rx={RADIUS}
            ry={RADIUS}
            fill="black"
          />
        </mask>
      </defs>

      <rect
        x={0}
        y={0}
        width="100%"
        height="100%"
        fill="rgba(4,5,6,0.72)"
        mask="url(#pf-spotlight-mask)"
      />

      {/* Accent ring around the spotlight */}
      <motion.rect
        initial={false}
        animate={{ x, y, width: w, height: h }}
        transition={transition}
        rx={RADIUS}
        ry={RADIUS}
        fill="none"
        stroke="#E2B485"
        strokeWidth={1.5}
        opacity={0.9}
      />
    </motion.svg>
  );
}
