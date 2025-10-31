import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "pipfactor-beta-banner";
const SHOW_DELAY_MS = 220;
const DISMISS_ANIMATION_MS = 300;

export const BetaBanner = () => {
  const { isAuthenticated, status } = useAuth();
  const [visible, setVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const manualDismissRef = useRef(false);

  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current !== null) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearDelayTimer();
      clearDismissTimer();
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, [clearDelayTimer, clearDismissTimer]);

  const showAfterDelay = useCallback(() => {
    if (delayTimerRef.current !== null || visible || isAuthenticated) {
      return;
    }

    delayTimerRef.current = window.setTimeout(() => {
      manualDismissRef.current = false;
      setIsAnimatingOut(false);
      setVisible(true);
      delayTimerRef.current = null;
    }, SHOW_DELAY_MS);
  }, [isAuthenticated, visible]);

  const dismiss = useCallback(
    (recordDismissal: boolean) => {
      manualDismissRef.current = recordDismissal;
      clearDelayTimer();
      clearDismissTimer();

      if (!visible) {
        if (!recordDismissal) {
          manualDismissRef.current = false;
        }
        return;
      }

      setIsAnimatingOut(true);
      dismissTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        setIsAnimatingOut(false);
        dismissTimerRef.current = null;
      }, DISMISS_ANIMATION_MS);
    },
    [clearDelayTimer, clearDismissTimer, visible]
  );

  const handleDismiss = useCallback(() => {
    dismiss(true);
  }, [dismiss]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (visible) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        manualDismissRef.current = false;
      } else if (manualDismissRef.current) {
        window.sessionStorage.setItem(STORAGE_KEY, "true");
      }
    } catch (error) {
      console.error("Failed to persist beta banner state", error);
    }
  }, [visible]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (isAuthenticated) {
      dismiss(false);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    let dismissedForSession = false;
    try {
      dismissedForSession = window.sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch (error) {
      console.error("Failed to read beta banner state", error);
    }

    if (dismissedForSession) {
      manualDismissRef.current = true;
      dismiss(false);
      return;
    }

    showAfterDelay();

    return () => {
      clearDelayTimer();
    };
  }, [status, isAuthenticated, dismiss, showAfterDelay, clearDelayTimer]);

  useEffect(() => {
    const updateOffset = () => {
      if (typeof document === "undefined") return;
      const root = document.documentElement;
      if (!visible) {
        root.style.setProperty("--beta-banner-offset", "0px");
        return;
      }
      const height = containerRef.current?.getBoundingClientRect().height ?? 0;
      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
      const offset = Math.max(height - scrollY, 0);
      root.style.setProperty("--beta-banner-offset", `${offset}px`);
    };

    const scheduleUpdate = () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      scrollRafRef.current = requestAnimationFrame(updateOffset);
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener("resize", updateOffset);
      window.removeEventListener("scroll", scheduleUpdate);
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      if (typeof document !== "undefined") {
        document.documentElement.style.removeProperty("--beta-banner-offset");
      }
    };
  }, [visible]);

  if (!visible && !isAnimatingOut) return null;

  return (
    <div
      ref={containerRef}
      className={`relative z-50 bg-gradient-to-r from-blue-900/80 via-slate-900/80 to-slate-950/80 text-slate-100 backdrop-blur-sm border-b border-blue-500/30 transition-all duration-300 ease-in-out ${
        isAnimatingOut ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
      }`}
    >
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-sm sm:text-base">
        <span className="rounded-full bg-blue-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100">Beta</span>
        <p className="text-center text-slate-200">
          All features are free while we build in beta. Your feedback helps shape PipFactor.
        </p>
        <button
          type="button"
          aria-label="Dismiss beta announcement"
          onClick={handleDismiss}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-200 transition hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
