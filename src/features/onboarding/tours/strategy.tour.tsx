import type { TourDefinition } from '../types';

/** Strategies page tour — auto-starts the first time the user opens /strategy. */
export const strategyTour: TourDefinition = {
  id: 'strategy',
  label: 'Strategies',
  description: 'Read and filter AI strategy records',
  version: 1,
  trigger: 'first-visit',
  routeMatch: '/strategy',
  steps: [
    {
      id: 'header',
      anchor: 'strategy.header',
      title: 'Strategy monitor',
      body: 'Every AI-generated strategy lands here — live signals stream in real time, and the count keeps you posted at a glance.',
      placement: 'bottom',
      route: '/strategy',
    },
    {
      id: 'filters',
      anchor: 'strategy.filters',
      title: 'Filter the noise',
      body: 'Narrow strategies down by symbol, direction and confidence so you only see the setups that matter to you.',
      placement: 'bottom',
    },
    {
      id: 'live',
      anchor: 'strategy.live',
      title: 'Live strategy cards',
      body: 'Each card shows entry, take-profit, stop-loss and a confidence read. Click any card for the full breakdown.',
      placement: 'top',
    },
    {
      id: 'history',
      anchor: 'strategy.history',
      title: 'Historical record',
      body: 'Past strategies and how they played out — page through to study performance over time.',
      placement: 'top',
    },
  ],
};
