import type { ReactNode } from "react";
import { WaveLoader } from "@/components/ui/wave-loader";

interface LoadingScreenProps {
  message?: string;
  hint?: string;
  /**
   * Optional custom animation node. Pass whatever animated element you like
   * (Lottie, GIF, etc.) and it will replace the default spinner.
   */
  animationSlot?: ReactNode;
  /**
   * When true, the background uses the mesh gradient applied across the app.
   */
  meshBackground?: boolean;
  children?: ReactNode;
}

/**
 * Full screen loading surface that keeps layout consistent while async auth/data
 * work happens. Provides an animation slot you can swap later without updating
 * every caller.
 */
export function LoadingScreen({
  message = "Loading...",
  hint,
  animationSlot,
  meshBackground = true,
  children,
}: LoadingScreenProps) {
  return (
    <div
      className={
        meshBackground
          ? "min-h-screen w-full bg-gradient-to-b from-[#0a0d1a] via-[#0f1419] to-[#0a0d1a] text-slate-200 flex items-center justify-center"
          : "min-h-screen w-full bg-slate-950 text-slate-200 flex items-center justify-center"
      }
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative flex items-center justify-center py-8">
          {animationSlot ?? <WaveLoader bars={5} className="bg-white w-1.5 h-8" />}
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-white">{message}</p>
          {hint ? <p className="text-sm text-slate-400 max-w-sm mx-auto">{hint}</p> : null}
        </div>
        {children ? <div className="flex flex-col items-center gap-2">{children}</div> : null}
      </div>
    </div>
  );
}

interface InlineLoaderProps {
  label?: string;
}

/**
 * Compact inline loader for sections/cards. Keeps look consistent with the full screen variant.
 */
export function InlineLoader({ label }: InlineLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
      <WaveLoader bars={5} className="bg-primary h-8 w-1.5" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
