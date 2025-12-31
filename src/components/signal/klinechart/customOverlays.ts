/**
 * Custom Chart Overlays
 * 
 * Custom overlays for KLineChart with configurable options.
 */

import { registerOverlay } from 'klinecharts';

// Default Fibonacci levels (can be customized)
export const DEFAULT_FIBONACCI_LEVELS = [
  { value: 0, label: '0%' },
  { value: 0.236, label: '23.6%' },
  { value: 0.382, label: '38.2%' },
  { value: 0.5, label: '50%' },
  { value: 0.618, label: '61.8%' },
  { value: 0.786, label: '78.6%' },
  { value: 1, label: '100%' },
];

// Store for custom Fibonacci levels
let customFibLevels = [...DEFAULT_FIBONACCI_LEVELS];

/**
 * Set custom Fibonacci levels
 */
export const setFibonacciLevels = (levels: Array<{ value: number; label: string }>) => {
  customFibLevels = levels.sort((a, b) => a.value - b.value);
};

/**
 * Get current Fibonacci levels
 */
export const getFibonacciLevels = () => [...customFibLevels];

/**
 * Register custom Fibonacci overlay with configurable levels
 */
export const registerCustomFibonacci = () => {
  try {
    registerOverlay({
      name: 'customFibonacci',
      totalStep: 3,
      needDefaultPointFigure: true,
      needDefaultXAxisFigure: true,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ chart, coordinates, bounding, overlay, yAxis }) => {
        const points = overlay.points;

        if (coordinates.length > 0) {
          let precision = 2;
          
          // Get precision from chart symbol
          try {
            const symbol = chart?.getSymbol?.();
            if (symbol?.pricePrecision !== undefined) {
              precision = symbol.pricePrecision;
            }
          } catch (e) {
            // Use default precision
          }

          const lines: Array<{ coordinates: Array<{ x: number; y: number }> }> = [];
          const texts: Array<{ x: number; y: number; text: string; baseline: string }> = [];
          const startX = 0;
          const endX = bounding.width;

          if (coordinates.length > 1) {
            const point0Value = points[0]?.value;
            const point1Value = points[1]?.value;
            
            if (typeof point0Value === 'number' && typeof point1Value === 'number') {
              const yDif = coordinates[0].y - coordinates[1].y;
              const valueDif = point0Value - point1Value;

              // Use current custom levels
              const levels = customFibLevels;

              levels.forEach(level => {
                const y = coordinates[1].y + yDif * level.value;
                const priceValue = point1Value + valueDif * level.value;
                const formattedPrice = priceValue.toFixed(precision);

                lines.push({ 
                  coordinates: [
                    { x: startX, y }, 
                    { x: endX, y }
                  ] 
                });

                texts.push({
                  x: startX + 10,
                  y,
                  text: `${formattedPrice} (${level.label})`,
                  baseline: 'bottom'
                });
              });
            }
          }

          return [
            {
              type: 'line',
              attrs: lines
            },
            {
              type: 'text',
              ignoreEvent: true,
              attrs: texts
            }
          ];
        }
        return [];
      }
    });
    console.log('[CustomOverlays] Custom Fibonacci overlay registered');
  } catch (e) {
    console.warn('[CustomOverlays] Failed to register custom Fibonacci:', e);
  }
};

/**
 * Initialize all custom overlays
 */
export const initCustomOverlays = () => {
  registerCustomFibonacci();
};

export default {
  initCustomOverlays,
  setFibonacciLevels,
  getFibonacciLevels,
  DEFAULT_FIBONACCI_LEVELS,
};
