import { useEffect, useState } from 'react';

type NavigatorConnection = {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  deviceMemory?: number;
  connection?: NavigatorConnection;
};

function isSafariWebKit(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  const vendor = navigator.vendor || '';
  const isAppleVendor = /Apple/i.test(vendor);
  const isWebKit = /AppleWebKit/i.test(ua);
  const isCriOS = /CriOS|Chrome|Edg|OPR|Firefox|FxiOS/i.test(ua);

  return isAppleVendor && isWebKit && !isCriOS;
}


function isLowSpecDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const nav = navigator as NavigatorWithConnection;

  const lowMemory =
    typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;

  const lowCpu =
    typeof nav.hardwareConcurrency === 'number' &&
    nav.hardwareConcurrency <= 4;

  const saveDataEnabled = nav.connection?.saveData === true;

  const reducedMotionEnabled = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Safari/WebKit can aggressively reload tabs when heavy WebGL canvases and auth overlays
  // contend for resources on mobile and lower-memory desktop devices.
  const safariWebKit = isSafariWebKit();

  return lowMemory || lowCpu || saveDataEnabled || reducedMotionEnabled || safariWebKit;
}

export function useLowSpecDevice(): boolean {
  const [isLowSpec, setIsLowSpec] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setIsLowSpec(isLowSpecDevice());

    update();

    mediaQuery.addEventListener('change', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
    };
  }, []);

  return isLowSpec;
}
