import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

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
          ? "min-h-screen w-full mesh-gradient-seamless text-slate-200 flex items-center justify-center"
          : "min-h-screen w-full bg-slate-950 text-slate-200 flex items-center justify-center"
      }
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative h-24 w-24 flex items-center justify-center">
          {animationSlot ?? (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-slate-800/70" aria-hidden />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-hidden />
              <Loader2 className="h-10 w-10 text-primary/80" aria-label="Loading" />
            </>
          )}
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
      <div className="relative h-12 w-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800/40" aria-hidden />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-hidden />
        <Loader2 className="h-6 w-6 text-primary/80" aria-label={label ?? "Loading"} />
      </div>
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
