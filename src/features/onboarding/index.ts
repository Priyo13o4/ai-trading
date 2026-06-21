/**
 * Onboarding / product-tour feature.
 *
 * Usage:
 *   <OnboardingProvider> wraps the app once (inside Auth + Router).
 *   useOnboarding() to start/replay tours or flag checklist items from anywhere.
 *   Add `data-tour="<anchor>"` to elements referenced by a tour step.
 *   Add a new page tour: create tours/<name>.tour.tsx and register it in registry.ts.
 */
export { OnboardingProvider } from './OnboardingProvider';
export { useOnboarding } from './context';
export { Beacon } from './components/Beacon';
export { TOURS, getTour } from './registry';
export type { TourDefinition, TourStep, OnboardingState } from './types';
