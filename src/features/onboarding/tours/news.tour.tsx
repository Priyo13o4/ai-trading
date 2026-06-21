import type { TourDefinition } from '../types';

/** Market news tour — auto-starts the first time the user opens /news. */
export const newsTour: TourDefinition = {
  id: 'news',
  label: 'Market news',
  description: 'Navigate the live intelligence feed',
  version: 1,
  trigger: 'first-visit',
  routeMatch: '/news',
  steps: [
    {
      id: 'snapshot',
      anchor: 'news.snapshot',
      title: 'Market snapshot',
      body: 'A quick pulse of the market — sentiment, pressure and volatility distilled into one strip at the top.',
      placement: 'bottom',
      route: '/news',
    },
    {
      id: 'tabs',
      anchor: 'news.tabs',
      title: 'Three ways to read the news',
      body: 'Switch between the live News Feed, the forward-looking Weekly Playbook and deep Event Analysis.',
      placement: 'bottom',
    },
    {
      id: 'filters',
      anchor: 'news.filters',
      title: 'Search & filter',
      body: 'Search headlines, then filter by time, instrument, event type or breaking-only to focus the feed.',
      placement: 'bottom',
    },
    {
      id: 'importance',
      anchor: 'news.importance',
      title: 'Importance threshold',
      body: 'Hide low-impact noise by raising the importance level — the same star rating you see on chart news markers.',
      placement: 'bottom',
    },
    {
      id: 'detail',
      title: 'Open the AI breakdown',
      body: 'Click any news item to open its full AI intelligence card — impact, affected instruments and the reasoning behind the call.',
      placement: 'center',
    },
  ],
};
