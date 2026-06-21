/**
 * Onboarding / product-tour type system.
 *
 * Tours are declarative DATA, not code. Adding a step = add one entry here +
 * a `data-tour="<anchor>"` attribute on the target element. Removing a feature
 * makes its anchor disappear and the engine gracefully skips the step.
 */
import type { ReactNode } from 'react';

export type StepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  /** Unique within the tour. */
  id: string;
  /**
   * The `data-tour` attribute value of the element to highlight.
   * Omit (and use placement 'center') for a centered modal-style step.
   */
  anchor?: string;
  title: string;
  body: ReactNode;
  placement?: StepPlacement;
  /** Navigate here before showing the step (enables cross-page tours). */
  route?: string;
  /** Extra px of breathing room around the spotlight cut-out. */
  spotlightPadding?: number;
  /** Side effects to run before the step is shown (open a panel, etc.). */
  beforeShow?: () => void | Promise<void>;
  /** Runtime gate — return false to skip this step (feature flags, plan tiers…). */
  enabled?: () => boolean;
}

export type TourTrigger = 'first-login' | 'first-visit' | 'manual';

export interface TourDefinition {
  /** Stable id, also the key used in persisted `completedTours`. */
  id: string;
  /** Short human label for the checklist / launcher. */
  label: string;
  description?: string;
  /** Bump when steps change meaningfully to re-show the tour to everyone. */
  version: number;
  trigger: TourTrigger;
  /** For `first-visit` tours: the pathname that auto-starts the tour. */
  routeMatch?: string;
  steps: TourStep[];
}

/** Shape persisted to `profiles.onboarding` (JSONB) + localStorage mirror. */
export interface OnboardingState {
  version: number;
  welcomeSeen: boolean;
  /** tourId -> highest tour `version` the user has completed/skipped. */
  completedTours: Record<string, number>;
  /** Beacon ids the user has dismissed. */
  dismissedBeacons: string[];
  /** Free-form "getting started" checklist flags. */
  checklist: Record<string, boolean>;
}

export const ONBOARDING_STATE_VERSION = 1;

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  version: ONBOARDING_STATE_VERSION,
  welcomeSeen: false,
  completedTours: {},
  dismissedBeacons: [],
  checklist: {},
};
