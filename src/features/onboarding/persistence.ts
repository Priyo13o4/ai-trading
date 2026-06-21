/**
 * Onboarding persistence.
 *
 * localStorage is the source of truth for instant, flicker-free reads.
 * Supabase (`profiles.onboarding` JSONB) is a best-effort cross-device mirror —
 * if RLS or the network ever blocks the write, the feature degrades silently to
 * localStorage-only. No backend/API changes required.
 */
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STATE_VERSION,
  type OnboardingState,
} from './types';

const LS_KEY = 'pipfactor-onboarding-v1';

/** Normalise any partial/untrusted blob into a full, safe state object. */
export function normalizeState(partial: Partial<OnboardingState> | null | undefined): OnboardingState {
  if (!partial || typeof partial !== 'object') {
    return { ...DEFAULT_ONBOARDING_STATE };
  }
  return {
    version: ONBOARDING_STATE_VERSION,
    welcomeSeen: Boolean(partial.welcomeSeen),
    completedTours:
      partial.completedTours && typeof partial.completedTours === 'object'
        ? { ...partial.completedTours }
        : {},
    dismissedBeacons: Array.isArray(partial.dismissedBeacons) ? [...partial.dismissedBeacons] : [],
    checklist:
      partial.checklist && typeof partial.checklist === 'object' ? { ...partial.checklist } : {},
  };
}

export function readLocal(): OnboardingState {
  if (typeof window === 'undefined') return { ...DEFAULT_ONBOARDING_STATE };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : { ...DEFAULT_ONBOARDING_STATE };
  } catch {
    return { ...DEFAULT_ONBOARDING_STATE };
  }
}

export function writeLocal(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/** Merge a remote snapshot with the local one (the most "progressed" wins). */
export function mergeStates(a: OnboardingState, b: OnboardingState): OnboardingState {
  const completedTours: Record<string, number> = { ...a.completedTours };
  for (const [id, v] of Object.entries(b.completedTours)) {
    completedTours[id] = Math.max(completedTours[id] ?? 0, v);
  }
  const checklist: Record<string, boolean> = { ...a.checklist };
  for (const [k, v] of Object.entries(b.checklist)) {
    checklist[k] = Boolean(checklist[k]) || Boolean(v);
  }
  return {
    version: ONBOARDING_STATE_VERSION,
    welcomeSeen: a.welcomeSeen || b.welcomeSeen,
    completedTours,
    dismissedBeacons: Array.from(new Set([...a.dismissedBeacons, ...b.dismissedBeacons])),
    checklist,
  };
}

export async function fetchRemote(userId: string): Promise<OnboardingState | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return normalizeState((data as { onboarding?: Partial<OnboardingState> }).onboarding);
  } catch {
    return null;
  }
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced, fire-and-forget remote sync. */
export function scheduleRemoteWrite(userId: string, state: OnboardingState): void {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    void supabase
      .from('profiles')
      .update({ onboarding: state })
      .eq('id', userId)
      .then(undefined, () => {
        /* degrade gracefully to localStorage-only */
      });
  }, 600);
}
