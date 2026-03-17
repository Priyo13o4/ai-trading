import { useEffect, useMemo, useRef, useState } from 'react';
import { getTurnstileSiteKey } from '@/config/turnstile';

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
};

type TurnstileInstance = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';

const waitForTurnstile = (timeoutMs = 5000): Promise<void> =>
  new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.turnstile) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Cloudflare Turnstile did not initialize in time'));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });

type TurnstileWidgetProps = {
  enabled: boolean;
  action: 'login' | 'signup';
  onTokenChange: (token: string | null) => void;
  onExpired: () => void;
  onRenderError: (message: string) => void;
  resetSignal?: number;
};

const ensureTurnstileLoaded = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is unavailable'));
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
  if (!existingScript) {
    return Promise.reject(new Error('Turnstile script tag is missing. Add it to index.html with id="cf-turnstile-script".'));
  }

  return new Promise<void>((resolve, reject) => {
    const onLoad = () => {
      waitForTurnstile().then(resolve).catch(reject);
    };
    const onError = () => reject(new Error('Failed to load Cloudflare Turnstile script'));

    existingScript.addEventListener('load', onLoad, { once: true });
    existingScript.addEventListener('error', onError, { once: true });

    // Handle race where the script already loaded before listeners were attached.
    waitForTurnstile().then(resolve).catch(() => {
      // no-op: onLoad/onError listeners still handle in-flight loads.
    });
  });
};

export const TurnstileWidget = ({
  enabled,
  action,
  onTokenChange,
  onExpired,
  onRenderError,
  resetSignal = 0,
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onExpiredRef = useRef(onExpired);
  const onRenderErrorRef = useRef(onRenderError);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const siteKey = useMemo(() => getTurnstileSiteKey(), []);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
    onExpiredRef.current = onExpired;
    onRenderErrorRef.current = onRenderError;
  }, [onExpired, onRenderError, onTokenChange]);

  useEffect(() => {
    if (!enabled || !siteKey) {
      return;
    }

    let cancelled = false;
    ensureTurnstileLoaded()
      .then(() => {
        if (!cancelled) {
          setIsScriptReady(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          onRenderErrorRef.current(error instanceof Error ? error.message : 'Unable to load captcha');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, siteKey]);

  useEffect(() => {
    if (!enabled || !siteKey || !isScriptReady || !containerRef.current || !window.turnstile) {
      return;
    }

    if (widgetIdRef.current) {
      return;
    }

    onTokenChangeRef.current(null);
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: 'dark',
      callback: (token: string) => {
        onTokenChangeRef.current(token);
      },
      'expired-callback': () => {
        onTokenChangeRef.current(null);
        onExpiredRef.current();
      },
      'error-callback': () => {
        onTokenChangeRef.current(null);
        onRenderErrorRef.current('Captcha verification failed. Please try again.');
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, enabled, isScriptReady, siteKey]);

  useEffect(() => {
    if (!enabled || !window.turnstile || !widgetIdRef.current) {
      return;
    }
    window.turnstile.reset(widgetIdRef.current);
    onTokenChangeRef.current(null);
  }, [enabled, resetSignal]);

  if (!enabled || !siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} />
      <p className="text-xs text-slate-400">Protected by Cloudflare Turnstile</p>
    </div>
  );
};
