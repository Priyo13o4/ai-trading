import type { TourDefinition } from './types';
import { signalTour } from './tours/signal.tour';
import { strategyTour } from './tours/strategy.tour';
import { newsTour } from './tours/news.tour';
import { profileTour } from './tours/profile.tour';

/**
 * The single source of truth for which tours exist.
 * To add a page tour: create `tours/<name>.tour.tsx` and add it to this array.
 */
export const TOURS: TourDefinition[] = [signalTour, strategyTour, newsTour, profileTour];

/** Tour IDs that require an active signals subscription or trial. */
export const SIGNALS_GATED_TOUR_IDS = new Set(['signal', 'strategy']);

export const TOUR_MAP: Record<string, TourDefinition> = Object.fromEntries(
  TOURS.map((tour) => [tour.id, tour]),
);

export function getTour(id: string): TourDefinition | undefined {
  return TOUR_MAP[id];
}

/** First-visit tour registered for a given pathname, if any. */
export function getAutoTourForRoute(pathname: string): TourDefinition | undefined {
  return TOURS.find((t) => t.trigger === 'first-visit' && t.routeMatch === pathname);
}
