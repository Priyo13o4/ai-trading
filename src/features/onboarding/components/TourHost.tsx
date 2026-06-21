import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context';
import { useAnchorRect } from '../hooks/useAnchorRect';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';

/**
 * Renders the active tour. Handles cross-page navigation, `beforeShow` side
 * effects, anchor resolution, keyboard control and graceful skipping of steps
 * whose target element is missing. Mounted once by the provider.
 */
export function TourHost() {
  const { activeTour, stepIndex, next, prev, skip, reducedMotion } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  const step = activeTour ? activeTour.steps[stepIndex] : null;
  const running = Boolean(activeTour && step);
  const rect = useAnchorRect(step?.anchor, running);

  // Navigate to the step's route (if any) and run its side effects.
  useEffect(() => {
    if (!activeTour || !step) return;
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
    }
    if (step.beforeShow) {
      void Promise.resolve(step.beforeShow()).catch(() => {
        /* non-fatal — keep the tour going */
      });
    }
    // Only react to step changes, not every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTour?.id, stepIndex]);

  // If an anchored element never appears, skip the step rather than stalling.
  useEffect(() => {
    if (!running || !step?.anchor || rect) return;
    const timer = window.setTimeout(() => next(), 2600);
    return () => window.clearTimeout(timer);
  }, [running, step, rect, next]);

  // Keyboard navigation.
  useEffect(() => {
    if (!running) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip();
      else if (event.key === 'ArrowRight') next();
      else if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, next, prev, skip]);

  if (!running || !step || typeof document === 'undefined') return null;

  const targetRect = step.anchor ? rect : null;

  return createPortal(
    <AnimatePresence>
      <TourSpotlight
        key="spotlight"
        rect={targetRect}
        padding={step.spotlightPadding ?? 8}
        reducedMotion={reducedMotion}
      />
      <TourTooltip
        key="tooltip"
        step={step}
        index={stepIndex}
        total={activeTour!.steps.length}
        rect={targetRect}
        reducedMotion={reducedMotion}
        onNext={next}
        onPrev={prev}
        onSkip={skip}
      />
    </AnimatePresence>,
    document.body,
  );
}
