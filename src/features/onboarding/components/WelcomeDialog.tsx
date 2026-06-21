import { motion } from 'framer-motion';
import { Sparkles, LineChart, Newspaper, Target } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface WelcomeDialogProps {
  open: boolean;
  onTakeTour: () => void;
  onDismiss: () => void;
  reducedMotion?: boolean;
  /** true = paid/trial user → signal tour; false = free user → news tour */
  hasSignalsAccess?: boolean;
}

const HIGHLIGHTS_SIGNALS = [
  { icon: Target, label: 'AI strategy overlays', tone: 'text-emerald-400' },
  { icon: Newspaper, label: 'Live news markers', tone: 'text-blue-400' },
  { icon: LineChart, label: 'Pro charting tools', tone: 'text-[#E2B485]' },
];

const HIGHLIGHTS_FREE = [
  { icon: Newspaper, label: 'Live news feed', tone: 'text-blue-400' },
  { icon: Target, label: 'Event analysis', tone: 'text-emerald-400' },
  { icon: LineChart, label: 'Weekly playbook', tone: 'text-[#E2B485]' },
];

/** First-login welcome modal. Routes to signal tour (paid) or news tour (free). */
export function WelcomeDialog({
  open,
  onTakeTour,
  onDismiss,
  reducedMotion,
  hasSignalsAccess = true,
}: WelcomeDialogProps) {
  const highlights = hasSignalsAccess ? HIGHLIGHTS_SIGNALS : HIGHLIGHTS_FREE;
  const description = hasSignalsAccess
    ? "Take a quick 60-second tour and we'll show you the chart, AI strategies and the live news desk."
    : "Explore live market news — free for every account. Upgrade anytime to unlock AI strategies and the signal chart.";

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onDismiss() : undefined)}>
      <DialogContent className="border border-[#E2B485]/25 bg-[#0b0c0e] text-slate-200 sm:max-w-md">
        <DialogHeader>
          <motion.div
            initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E2B485]/15 ring-1 ring-[#E2B485]/30"
          >
            <Sparkles className="h-6 w-6 text-[#E2B485]" />
          </motion.div>
          <DialogTitle className="text-center text-xl font-bold text-white">
            Welcome to PipFactor
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex justify-center gap-5">
          {highlights.map(({ icon: Icon, label, tone }, i) => (
            <motion.div
              key={label}
              initial={reducedMotion ? false : { y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.1 + i * 0.08 }}
              className="flex w-20 flex-col items-center gap-1.5 text-center"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10">
                <Icon className={`h-4 w-4 ${tone}`} />
              </span>
              <span className="text-[10px] font-medium leading-tight text-slate-500">{label}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onTakeTour}
            className="w-full rounded-xl bg-[#E2B485] px-4 py-2.5 text-sm font-bold text-black shadow-lg shadow-[#E2B485]/20 transition-all hover:bg-[#edc79c]"
          >
            {hasSignalsAccess ? 'Take the tour' : 'Explore Market News'}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
