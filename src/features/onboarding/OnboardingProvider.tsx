import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLowSpecDevice } from '@/hooks/useLowSpecDevice';
import { OnboardingContext, type OnboardingContextValue } from './context';
import { DEFAULT_ONBOARDING_STATE, type OnboardingState } from './types';
import {
  fetchRemote,
  mergeStates,
  readLocal,
  scheduleRemoteWrite,
  writeLocal,
} from './persistence';
import { getAutoTourForRoute, getTour, SIGNALS_GATED_TOUR_IDS } from './registry';
import { TourHost } from './components/TourHost';
import { WelcomeDialog } from './components/WelcomeDialog';
import { ChecklistLauncher } from './components/ChecklistLauncher';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}


export function OnboardingProvider({ children }: { children: ReactNode }) {
  // `isAuthenticated` gates the welcome + news tour (news is free for all).
  // `canAccessSignals` additionally gates signal/strategy tours.
  const { user, isAuthenticated, canAccessSignals, authResolved } = useAuth();
  const location = useLocation();
  const lowSpec = useLowSpecDevice();
  const prefersReduced = usePrefersReducedMotion();
  const reducedMotion = lowSpec || prefersReduced;

  const userId = user?.id ?? null;
  const [state, setState] = useState<OnboardingState>(() => readLocal());
  const [loaded, setLoaded] = useState(false);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const userIdRef = useRef<string | null>(userId);
  userIdRef.current = userId;

  // Persist helper: localStorage is source of truth, Supabase is best-effort.
  const persist = useCallback((next: OnboardingState) => {
    setState(next);
    writeLocal(next);
    if (userIdRef.current) scheduleRemoteWrite(userIdRef.current, next);
  }, []);

  // Load + merge state when the signed-in user changes.
  useEffect(() => {
    if (!authResolved) return;

    if (!userId) {
      // Sign-out: wipe localStorage so the next sign-in/sign-up always gets fresh onboarding.
      const fresh = { ...DEFAULT_ONBOARDING_STATE };
      setState(fresh);
      writeLocal(fresh);
      setLoaded(true);
      return;
    }

    const local = readLocal();
    setState(local);
    setLoaded(true);

    let cancelled = false;
    void fetchRemote(userId).then((remote) => {
      if (cancelled) return;
      if (!remote) return;
      // Remote profile is empty → brand-new user (or just deleted account that re-signed up).
      // Prefer the clean remote over any stale local data so onboarding fires again.
      const remoteIsBlank = !remote.welcomeSeen && Object.keys(remote.completedTours).length === 0;
      if (remoteIsBlank) {
        const fresh = { ...DEFAULT_ONBOARDING_STATE };
        setState(fresh);
        writeLocal(fresh);
      } else {
        const merged = mergeStates(local, remote);
        setState(merged);
        writeLocal(merged);
        scheduleRemoteWrite(userId, merged);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, authResolved]);

  // End any running tour on sign-out.
  // Also end signal/strategy tours when access is lost (trial exhausted etc.).
  useEffect(() => {
    if (!isAuthenticated) { setActiveTourId(null); return; }
    if (!canAccessSignals) {
      setActiveTourId((id) => (id && SIGNALS_GATED_TOUR_IDS.has(id) ? null : id));
    }
  }, [isAuthenticated, canAccessSignals]);

  const activeTour = useMemo(() => (activeTourId ? getTour(activeTourId) ?? null : null), [activeTourId]);

  const completeActive = useCallback(() => {
    setActiveTourId((current) => {
      if (current) {
        const tour = getTour(current);
        if (tour) {
          persist({
            ...state,
            welcomeSeen: true,
            completedTours: { ...state.completedTours, [tour.id]: tour.version },
          });
        }
      }
      return null;
    });
    setStepIndex(0);
  }, [persist, state]);

  const startTour = useCallback((id: string) => {
    if (!getTour(id)) return;
    setStepIndex(0);
    setActiveTourId(id);
  }, []);

  const next = useCallback(() => {
    setStepIndex((idx) => {
      const tour = activeTourId ? getTour(activeTourId) : null;
      if (!tour) return idx;
      if (idx >= tour.steps.length - 1) {
        completeActive();
        return idx;
      }
      return idx + 1;
    });
  }, [activeTourId, completeActive]);

  const prev = useCallback(() => setStepIndex((idx) => Math.max(0, idx - 1)), []);

  const skip = useCallback(() => completeActive(), [completeActive]);

  const isTourCompleted = useCallback(
    (id: string) => {
      const tour = getTour(id);
      if (!tour) return false;
      return (state.completedTours[id] ?? 0) >= tour.version;
    },
    [state.completedTours],
  );

  const markChecklist = useCallback(
    (key: string, done = true) => {
      if (Boolean(state.checklist[key]) === done) return;
      persist({ ...state, checklist: { ...state.checklist, [key]: done } });
    },
    [persist, state],
  );

  const dismissBeacon = useCallback(
    (id: string) => {
      if (state.dismissedBeacons.includes(id)) return;
      persist({ ...state, dismissedBeacons: [...state.dismissedBeacons, id] });
    },
    [persist, state],
  );

  const isBeaconDismissed = useCallback(
    (id: string) => state.dismissedBeacons.includes(id),
    [state.dismissedBeacons],
  );

  const resetOnboarding = useCallback(() => {
    const fresh = { ...DEFAULT_ONBOARDING_STATE };
    persist(fresh);
    if (userIdRef.current) scheduleRemoteWrite(userIdRef.current, fresh);
  }, [persist]);

  const isAuthRoute = location.pathname.startsWith('/auth/');

  // First-login welcome modal — for any authenticated user (news is free for all).
  const welcomeOpen =
    loaded && isAuthenticated && !state.welcomeSeen && !activeTourId && !isAuthRoute;

  const handleTakeTour = useCallback(() => {
    persist({ ...state, welcomeSeen: true });
    // Route to the appropriate first tour based on access level.
    startTour(canAccessSignals ? 'signal' : 'news');
  }, [persist, state, startTour, canAccessSignals]);

  const handleDismissWelcome = useCallback(() => {
    persist({ ...state, welcomeSeen: true });
  }, [persist, state]);

  // Auto-start first-visit tours (once the welcome flow is done).
  // Signal/strategy tours additionally require canAccessSignals.
  useEffect(() => {
    if (!loaded || !isAuthenticated || activeTourId || !state.welcomeSeen) return;
    const tour = getAutoTourForRoute(location.pathname);
    if (!tour) return;
    if (SIGNALS_GATED_TOUR_IDS.has(tour.id) && !canAccessSignals) return;
    if ((state.completedTours[tour.id] ?? 0) >= tour.version) return;
    const timer = window.setTimeout(() => startTour(tour.id), 900);
    return () => window.clearTimeout(timer);
  }, [loaded, isAuthenticated, canAccessSignals, activeTourId, state.welcomeSeen, state.completedTours, location.pathname, startTour]);

  const value: OnboardingContextValue = useMemo(
    () => ({
      state,
      activeTour,
      stepIndex,
      startTour,
      next,
      prev,
      skip,
      isTourCompleted,
      markChecklist,
      dismissBeacon,
      isBeaconDismissed,
      reducedMotion,
      resetOnboarding,
    }),
    [
      state,
      activeTour,
      stepIndex,
      startTour,
      next,
      prev,
      skip,
      isTourCompleted,
      markChecklist,
      dismissBeacon,
      isBeaconDismissed,
      reducedMotion,
      resetOnboarding,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <TourHost />
      {isAuthenticated && (
        <>
          <WelcomeDialog
            open={welcomeOpen}
            onTakeTour={handleTakeTour}
            onDismiss={handleDismissWelcome}
            reducedMotion={reducedMotion}
            hasSignalsAccess={canAccessSignals}
          />
          {!activeTourId && !isAuthRoute && <ChecklistLauncher />}
        </>
      )}
    </OnboardingContext.Provider>
  );
}
