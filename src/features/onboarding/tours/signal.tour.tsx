import type { TourDefinition } from '../types';

/**
 * Signal workspace tour — the first-login centrepiece.
 * Passive "Next"-style coach marks that point at each chart control and explain
 * what it does. No forced clicks, no live canvas demo.
 */
export const signalTour: TourDefinition = {
  id: 'signal',
  label: 'Signal workspace',
  description: 'Learn the chart, overlays and controls',
  version: 1,
  trigger: 'first-login',
  routeMatch: '/signal',
  steps: [
    {
      id: 'symbol',
      anchor: 'signal.symbol',
      title: 'Pick your market',
      body: 'Switch between gold (XAUUSD), FX pairs and other instruments. Your last choice is remembered next time you visit.',
      placement: 'bottom',
      route: '/signal',
    },
    {
      id: 'timeframe',
      anchor: 'signal.timeframe',
      title: 'Choose a timeframe',
      body: 'Zoom from M1 scalps all the way to daily swings. The chart and overlays redraw instantly.',
      placement: 'bottom',
    },
    {
      id: 'strategy',
      anchor: 'signal.strategy',
      title: 'Strategy overlay',
      body: 'Toggle the AI strategy lines — entry, take-profit and stop-loss — directly on the candles, and switch between any active strategy for this market.',
      placement: 'bottom',
    },
    {
      id: 'news',
      anchor: 'signal.news',
      title: 'News markers',
      body: 'Drop high-impact news events right onto the chart so you can see exactly what moved price — click a marker to read the event.',
      placement: 'bottom',
    },
    {
      id: 'indicators',
      anchor: 'signal.indicators',
      title: 'Technical indicators',
      body: 'Add EMAs, RSI, MACD, Bollinger Bands and more. Each indicator has its own settings you can fine-tune.',
      placement: 'bottom',
    },
    {
      id: 'drawing',
      anchor: 'signal.drawing',
      title: 'Drawing tools',
      body: 'Mark up the chart your way with trend lines, Fibonacci levels and channels.',
      placement: 'top',
    },
    {
      id: 'done',
      title: "You're all set",
      body: 'Live strategies and the news feed for your selected market sit in the right-hand panel. You can replay this tour any time from the Help button in the corner.',
      placement: 'center',
    },
  ],
};
