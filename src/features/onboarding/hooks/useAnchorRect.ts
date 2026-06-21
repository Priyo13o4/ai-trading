import { useEffect, useState } from 'react';

/**
 * Resolves a `[data-tour="<anchor>"]` element to its viewport rect and keeps it
 * in sync across scroll, resize and late/animated mounts. Returns null while the
 * element is absent — the tour host uses that to gracefully skip missing steps.
 */
export function useAnchorRect(anchor: string | undefined, active: boolean): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!anchor || !active || typeof document === 'undefined') {
      setRect(null);
      return;
    }

    let raf = 0;
    let scrolledIntoView = false;

    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      if (!scrolledIntoView) {
        scrolledIntoView = true;
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
      const next = el.getBoundingClientRect();
      setRect((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      );
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    // Poll briefly to catch elements that mount/animate in after navigation.
    const interval = window.setInterval(measure, 350);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      window.clearInterval(interval);
    };
  }, [anchor, active]);

  return rect;
}
