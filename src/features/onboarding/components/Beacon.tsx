import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BeaconProps {
  /** Click handler — typically opens a popover or starts a mini-tour. */
  onClick?: () => void;
  className?: string;
  label?: string;
  reducedMotion?: boolean;
}

/**
 * A non-blocking pulsing hotspot for optional feature discovery.
 * Drop it next to any advanced control; pair with `dismissBeacon` to hide it
 * once acknowledged. Reusable and self-contained.
 */
export function Beacon({ onClick, className, label = 'Learn more', reducedMotion }: BeaconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn('relative inline-flex h-3.5 w-3.5 items-center justify-center', className)}
    >
      {!reducedMotion && (
        <motion.span
          className="absolute inset-0 rounded-full bg-[#E2B485]"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <span className="relative h-2 w-2 rounded-full bg-[#E2B485] shadow-[0_0_8px_rgba(226,180,133,0.8)]" />
    </button>
  );
}
