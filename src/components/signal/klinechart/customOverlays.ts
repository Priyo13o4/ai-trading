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
 * Register news marker overlay
 * Displays news events on the chart as clickable icons
 */
export const registerNewsMarkerOverlay = () => {
  try {
    registerOverlay({
      name: 'newsMarker',
      totalStep: 2,
      needDefaultPointFigure: false,
      needDefaultXAxisFigure: false,
      needDefaultYAxisFigure: false,
      
      createPointFigures: ({ coordinates, overlay, bounding }) => {
        if (coordinates.length === 0) return [];

        const extendData = (overlay.extendData || {}) as Record<string, any>;
        const events = extendData.events || [];
        const count = extendData.count || 1;
        const maxImportance = extendData.maxImportance || 3;
        const color = extendData.color || '#F97316';
        const isLargeTimeframe = extendData.isLargeTimeframe || false;

        const x = coordinates[0].x;
        const y = 30; // Fixed position at top of chart

        // Icon size based on importance
        const baseSize = maxImportance >= 4 ? 12 : 10;
        const iconSize = isLargeTimeframe && count > 1 ? baseSize + 2 : baseSize;

        const figures: any[] = [];

        // Background circle
        figures.push({
          type: 'circle',
          attrs: {
            x,
            y,
            r: iconSize + 4,
          },
          styles: {
            style: 'fill',
            color: 'rgba(15, 20, 25, 0.9)',
          },
        });

        // Border circle with importance color
        figures.push({
          type: 'circle',
          attrs: {
            x,
            y,
            r: iconSize + 3,
          },
          styles: {
            style: 'stroke',
            color: color,
            borderSize: 2,
          },
        });

        // Inner filled circle
        figures.push({
          type: 'circle',
          attrs: {
            x,
            y,
            r: iconSize,
          },
          styles: {
            style: 'fill',
            color: color,
          },
        });

        // News icon (N letter or count)
        const displayText = count > 1 ? String(count) : 'N';
        figures.push({
          type: 'text',
          attrs: {
            x,
            y: y + 1,
            text: displayText,
            align: 'center',
            baseline: 'middle',
          },
          styles: {
            color: '#FFFFFF',
            size: count > 1 ? 9 : 10,
            weight: 'bold',
            family: 'Arial, sans-serif',
          },
        });

        // Vertical line to candle (subtle indicator)
        figures.push({
          type: 'line',
          attrs: {
            coordinates: [
              { x, y: y + iconSize + 4 },
              { x, y: 60 },
            ],
          },
          styles: {
            style: 'dashed',
            color: `${color}40`,
            size: 1,
            dashedValue: [3, 3],
          },
        });

        // Breaking news indicator (pulsing effect via extra ring)
        const hasBreaking = events.some((e: any) => e.breaking);
        if (hasBreaking) {
          figures.push({
            type: 'circle',
            attrs: {
              x,
              y,
              r: iconSize + 7,
            },
            styles: {
              style: 'stroke',
              color: '#F59E0B',
              borderSize: 1,
            },
          });
        }

        return figures;
      },

      // Handle click events
      performEventPressedMove: () => false,
      performEventMoveForDrawing: () => false,
      
      onPressedMoveStart: () => {},
      onPressedMoveEnd: () => {},
      
      onClick: ({ overlay }) => {
        const extendData = (overlay.extendData || {}) as Record<string, any>;
        const events = extendData.events || [];
        const onNewsClick = extendData.onNewsClick;
        
        if (onNewsClick && events.length > 0) {
          // Calculate popup position (center of screen for now)
          const position = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          };
          onNewsClick(events, position);
        }
        return true;
      },
    });
    console.log('[CustomOverlays] News marker overlay registered');
  } catch (e) {
    console.warn('[CustomOverlays] Failed to register news marker overlay:', e);
  }
};

/**
 * Initialize all custom overlays
 */
export const initCustomOverlays = () => {
  registerCustomFibonacci();
  registerNewsMarkerOverlay();
};

export default {
  initCustomOverlays,
  setFibonacciLevels,
  getFibonacciLevels,
  DEFAULT_FIBONACCI_LEVELS,
  registerNewsMarkerOverlay,
};

