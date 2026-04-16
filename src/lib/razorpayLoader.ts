const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const DEFAULT_TIMEOUT_MS = 15000;

type RazorpayLoaderWindow = Window & {
  __pipfactorRazorpayLoaderPromise?: Promise<void>;
};

const withWindow = (): RazorpayLoaderWindow | null => {
  if (typeof window === 'undefined') return null;
  return window as RazorpayLoaderWindow;
};

export const loadRazorpayCheckoutScript = async (timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> => {
  const runtimeWindow = withWindow();
  if (!runtimeWindow || typeof document === 'undefined') {
    throw new Error('Razorpay checkout cannot load in this runtime.');
  }

  if (typeof runtimeWindow.Razorpay === 'function') {
    return;
  }

  if (runtimeWindow.__pipfactorRazorpayLoaderPromise) {
    return runtimeWindow.__pipfactorRazorpayLoaderPromise;
  }

  runtimeWindow.__pipfactorRazorpayLoaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const clearAndReject = (message: string) => {
      runtimeWindow.__pipfactorRazorpayLoaderPromise = undefined;
      reject(new Error(message));
    };

    const clearAndResolve = () => {
      resolve();
    };

    const timeoutId = window.setTimeout(() => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      clearAndReject('Timed out while loading Razorpay checkout script.');
    }, timeoutMs);

    const onLoad = () => {
      window.clearTimeout(timeoutId);
      if (typeof runtimeWindow.Razorpay === 'function') {
        clearAndResolve();
        return;
      }
      clearAndReject('Razorpay loaded without an SDK constructor.');
    };

    const onError = () => {
      window.clearTimeout(timeoutId);
      clearAndReject('Failed to load Razorpay checkout script.');
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    if (!existing) {
      script.src = RAZORPAY_CHECKOUT_SRC;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  });

  return runtimeWindow.__pipfactorRazorpayLoaderPromise;
};
