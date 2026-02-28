import { useEffect, useState } from 'react';

type NavigatorConnection = {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  deviceMemory?: number;
  connection?: NavigatorConnection;
};


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

  return lowMemory || lowCpu || saveDataEnabled || reducedMotionEnabled;
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
