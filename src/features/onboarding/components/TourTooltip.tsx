import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepPlacement, TourStep } from '../types';

interface TourTooltipProps {
  step: TourStep;
  index: number;
  total: number;
  rect: DOMRect | null;
  reducedMotion?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const PANEL_WIDTH = 340;
const GAP = 14;

function computePanelStyle(
  rect: DOMRect | null,
  placement: StepPlacement,
  isMobile: boolean,
): { style: CSSProperties; resolved: StepPlacement } {
  // Centered modal step, or a small screen → bottom-anchored sheet.
  if (!rect || placement === 'center') {
    return {
      resolved: 'center',
      style: {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? 'calc(100vw - 32px)' : PANEL_WIDTH,
      },
    };
  }

  if (isMobile) {
    return {
      resolved: 'bottom',
      style: {
        left: 16,
        right: 16,
        bottom: 16,
        width: 'auto',
      },
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const clampLeft = (l: number) => Math.max(GAP, Math.min(l, vw - PANEL_WIDTH - GAP));
  const clampTop = (t: number) => Math.max(GAP, Math.min(t, vh - 180 - GAP));

  switch (placement) {
    case 'top':
      return {
        resolved: 'top',
        style: { left: clampLeft(cx - PANEL_WIDTH / 2), top: rect.top - GAP, transform: 'translateY(-100%)', width: PANEL_WIDTH },
      };
    case 'left':
      return {
        resolved: 'left',
        style: { left: rect.left - GAP, top: clampTop(cy - 80), transform: 'translateX(-100%)', width: PANEL_WIDTH },
      };
    case 'right':
      return {
        resolved: 'right',
        style: { left: rect.right + GAP, top: clampTop(cy - 80), width: PANEL_WIDTH },
      };
    case 'bottom':
    default:
      return {
        resolved: 'bottom',
        style: { left: clampLeft(cx - PANEL_WIDTH / 2), top: rect.bottom + GAP, width: PANEL_WIDTH },
      };
  }
}

export function TourTooltip({
  step,
  index,
  total,
  rect,
  reducedMotion,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 480 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const placement = step.placement ?? (step.anchor ? 'bottom' : 'center');
  const { style } = computePanelStyle(rect, placement, isMobile);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const enter = reducedMotion
    ? { opacity: 1, scale: 1, y: 0 }
    : { opacity: 1, scale: 1, y: 0 };
  const initial = reducedMotion
    ? { opacity: 1, scale: 1, y: 0 }
    : { opacity: 0, scale: 0.96, y: 6 };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="fixed z-[9999] rounded-2xl border border-[#E2B485]/25 bg-[#0b0c0e]/95 p-4 text-slate-200 shadow-2xl shadow-black/50 backdrop-blur-md"
        style={style}
        initial={initial}
        animate={enter}
        exit={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 6 }}
        transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold tracking-tight text-white">{step.title}</h3>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Close tour"
            className="-mr-1 -mt-1 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-[13px] leading-relaxed text-slate-400">{step.body}</div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-4 bg-[#E2B485]' : 'w-1.5 bg-white/15',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="rounded-lg bg-[#E2B485] px-3.5 py-1.5 text-xs font-bold text-black shadow-lg shadow-[#E2B485]/20 transition-all hover:bg-[#edc79c]"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {!isLast && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 text-[11px] font-medium text-slate-600 transition-colors hover:text-slate-400"
          >
            Skip tour
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
