import { createContext, useContext } from 'react';
import type { OnboardingState, TourDefinition } from './types';

export interface OnboardingContextValue {
  state: OnboardingState;
  /** The tour currently running, or null. */
  activeTour: TourDefinition | null;
  stepIndex: number;
  /** Start (or replay) a tour by id; navigates to its first routed step. */
  startTour: (id: string) => void;
  next: () => void;
  prev: () => void;
  /** Skip the active tour — marks it complete so it won't auto-trigger again. */
  skip: () => void;
  isTourCompleted: (id: string) => boolean;
  markChecklist: (key: string, done?: boolean) => void;
  dismissBeacon: (id: string) => void;
  isBeaconDismissed: (id: string) => boolean;
  /** True on low-spec devices or when the user prefers reduced motion. */
  reducedMotion: boolean;
  /** Reset all onboarding progress (tours + welcome). Re-shows the welcome dialog. */
  resetOnboarding: () => void;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an <OnboardingProvider>');
  }
  return ctx;
}
