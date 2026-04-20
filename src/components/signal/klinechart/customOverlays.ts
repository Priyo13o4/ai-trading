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
 * Register a custom Strategy Price Line
 * This is used for Entry, TP, and SL lines.
 * 
 * FIX: We use yAxis.convertToPixel to ensure the line stays at the correct 
 * price level even if the anchor points shift or are off-screen.
 */
export const registerStrategyPriceLine = () => {
  try {
    registerOverlay({
      name: 'strategyPriceLine',
      totalStep: 1,
      needDefaultPointFigure: false,
      needDefaultXAxisFigure: false,
      needDefaultYAxisFigure: true,
      createPointFigures: ({ bounding, overlay, yAxis }) => {
        const points = overlay.points;
        if (!points || points.length === 0) return [];
        
        const priceValue = points[0].value;
        if (priceValue === undefined || priceValue === null) return [];
        
        // Convert price to pixel Y coordinate
        const lineY = yAxis.convertToPixel(priceValue);
        
        // If it's completely off screen (far above or below), we can optionally hide it
        // but typically KLineChart handles clipping at the bounding box.
        
        const color = overlay.styles?.line?.color || '#3B82F6';
        const label = overlay.extendData || '';
        
        return [
          {
            type: 'line',
            attrs: {
              coordinates: [
                { x: 0, y: lineY },
                { x: bounding.width, y: lineY }
              ]
            },
            styles: {
              style: overlay.styles?.line?.style || 'dashed',
              color,
              size: overlay.styles?.line?.size || 1,
              dashedValue: [4, 4]
            }
          },
          {
            type: 'text',
            attrs: {
              x: 10,
              y: lineY - 6,
              text: label
            },
            styles: {
              color: '#FFFFFF',
              size: 10,
              weight: 'bold',
              backgroundColor: color,
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 2
            }
          }
        ];
      }
    });
    console.log('[CustomOverlays] Strategy price line registered');
  } catch (e) {
    console.warn('[CustomOverlays] Failed to register Strategy price line:', e);
  }
};

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
      totalStep: 1,
      needDefaultPointFigure: false,
      needDefaultXAxisFigure: false,
      needDefaultYAxisFigure: false,
      
      createPointFigures: ({ coordinates, overlay, bounding }) => {
        if (coordinates.length === 0) return [];

        const extendData = (overlay.extendData || {}) as Record<string, any>;
        const events = Array.isArray(extendData.events) ? extendData.events : [];
        const count = Math.max(1, Number(extendData.count) || 1);
        const maxImportance = Math.max(1, Number(extendData.maxImportance) || 3);
        const color = String(extendData.color || '#F97316');
        const barSpace = Math.max(2, Number(extendData.barSpace) || 8);
        const markerY = Math.max(22, Math.min(52, Number(extendData.markerY) || 30));
        const isGrouped = count > 1;

        const x = coordinates[0].x;
        const y = markerY;

        // Size contracts during dense zoom-out states to reduce overlap.
        const compactScale = Math.max(0.72, Math.min(1.25, barSpace / 9));
        const baseSize = maxImportance >= 5 ? 11 : maxImportance >= 4 ? 10 : 9;
        const iconSize = Math.max(6, Math.round(baseSize * compactScale + (isGrouped ? 1 : 0)));

        const figures: any[] = [];

        if (isGrouped) {
          // Heatmap logic for grouped markers
          const pulseOpacity = Math.min(1.0, 0.4 + (count * 0.1));
          const glowRadius = Math.min(18, 8 + (count * 1.5));

          // Base background to hide grid under it
          figures.push({
            type: 'circle',
            attrs: { x, y, r: iconSize + 4 },
            styles: { style: 'fill', color: 'rgba(15, 20, 25, 0.9)' },
          });

          // Outer glowing Heatmap Pulse
          // Convert hex color to rgba (assuming hex is #RRGGBB)
          let r = 249, g = 115, b = 22; // fallback to orange
          if (color.startsWith('#') && color.length === 7) {
            r = parseInt(color.slice(1, 3), 16);
            g = parseInt(color.slice(3, 5), 16);
            b = parseInt(color.slice(5, 7), 16);
          }
          figures.push({
            type: 'circle',
            attrs: { x, y, r: glowRadius },
            styles: { style: 'fill', color: `rgba(${r}, ${g}, ${b}, ${pulseOpacity * 0.4})` },
          });

          // Inner solid core
          figures.push({
            type: 'circle',
            attrs: { x, y, r: iconSize },
            styles: { style: 'fill', color: color },
          });

          const displayText = count > 99 ? '+99' : `+${count}`;
          figures.push({
            type: 'text',
            attrs: { x, y: y + 1, text: displayText, align: 'center', baseline: 'middle' },
            styles: {
              color: '#FFFFFF',
              size: count > 99 ? 7 : 9,
              weight: 'bold',
              family: 'system-ui, sans-serif',
              backgroundColor: 'transparent',
              borderSize: 0,
              paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
            },
          });
        } else {
          // Atomic Marker: Small Sharp Diamond
          const r = 6;
          figures.push({
            type: 'polygon',
            attrs: {
              coordinates: [
                { x, y: y - r },
                { x: x + r, y },
                { x, y: y + r },
                { x: x - r, y }
              ]
            },
            styles: {
              style: 'stroke_fill',
              color: 'rgba(15, 20, 25, 0.9)',
              borderColor: color,
              borderSize: 2,
            },
          });
        }

        if (barSpace >= 6) {
          const lineBottomY = Math.min(bounding.height - 24, y + Math.max(18, iconSize * 2));
          if (lineBottomY > y) {
            figures.push({
              type: 'line',
              attrs: {
                coordinates: [
                  { x, y: y + iconSize + 4 },
                  { x, y: lineBottomY },
                ],
              },
              styles: {
                style: 'dashed',
                color: `${color}40`,
                size: 1,
                dashedValue: [3, 3],
              },
            });
          }
        }

        // Breaking news indicator (pulsing effect via extra ring)
        const hasBreaking = events.some((e: any) => e.breaking);
        if (hasBreaking && barSpace >= 5) {
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
  registerStrategyPriceLine();
};

export default {
  initCustomOverlays,
  setFibonacciLevels,
  getFibonacciLevels,
  DEFAULT_FIBONACCI_LEVELS,
  registerNewsMarkerOverlay,
  registerStrategyPriceLine,
};
