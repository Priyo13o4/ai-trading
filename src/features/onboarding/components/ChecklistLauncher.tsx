import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, HelpCircle, Play, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '../context';
import { TOURS, SIGNALS_GATED_TOUR_IDS } from '../registry';

/**
 * Floating "getting started" launcher (bottom-right). Auto-hides 1.5s after
 * all tours are complete. Replay is available from the Profile page.
 */
export function ChecklistLauncher() {
  const { startTour, isTourCompleted, reducedMotion } = useOnboarding();
  const { canAccessSignals } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const visibleTours = TOURS.filter((t) => canAccessSignals || !SIGNALS_GATED_TOUR_IDS.has(t.id));
  const completed = visibleTours.filter((t) => isTourCompleted(t.id)).length;
  const pct = Math.round((completed / visibleTours.length) * 100);
  const allDone = completed === visibleTours.length;

  // Auto-hide 1.5s after all tours complete so user briefly sees 100%.
  useEffect(() => {
    if (!allDone) return;
    const t = window.setTimeout(() => setDismissed(true), 1500);
    return () => window.clearTimeout(t);
  }, [allDone]);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-80 overflow-hidden rounded-2xl border border-[#E2B485]/20 bg-[#0b0c0e]/95 shadow-2xl shadow-black/50 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/5 p-4">
              <div>
                <h3 className="text-sm font-bold text-white">Getting started</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {allDone ? 'All tours complete — nice work!' : `${completed} of ${visibleTours.length} complete`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-4 pt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-[#E2B485]"
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: reducedMotion ? 0 : 0.4 }}
                />
              </div>
            </div>

            <ul className="flex flex-col gap-1 p-2">
              {visibleTours.map((tour) => {
                const done = isTourCompleted(tour.id);
                return (
                  <li key={tour.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        startTour(tour.id);
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/5"
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ring-1 transition-colors',
                          done
                            ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
                            : 'bg-white/[0.03] text-slate-500 ring-white/10',
                        )}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-slate-200">
                          {tour.label}
                        </span>
                        {tour.description && (
                          <span className="block truncate text-[11px] text-slate-500">
                            {tour.description}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                        {done ? <RotateCcw className="h-3 w-3" /> : null}
                        {done ? 'Replay' : 'Start'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Help and product tours"
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#E2B485]/30 bg-[#0b0c0e] text-[#E2B485] shadow-lg shadow-black/40 transition-colors hover:bg-[#E2B485]/10"
      >
        <HelpCircle className="h-5 w-5" />
        {!allDone && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            {!reducedMotion && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E2B485]/60" />
            )}
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#E2B485]" />
          </span>
        )}
      </motion.button>
    </div>
  );
}
