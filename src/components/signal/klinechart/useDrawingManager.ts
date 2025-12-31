/**
 * Drawing Manager Hook
 * 
 * Manages drawing tools state and integration with KLineChart overlays.
 */

import { useState, useCallback, useRef } from 'react';
import type { Chart } from 'klinecharts';
import { DRAWING_TOOLS } from './DrawingToolsPanel';

export interface DrawingInfo {
  id: string;
  toolId: string;
  name: string;
  timestamp: number;
}

interface UseDrawingManagerOptions {
  chartRef: React.MutableRefObject<Chart | null>;
}

interface UseDrawingManagerReturn {
  activeTool: string | null;
  drawingCount: number;
  drawings: DrawingInfo[];
  setActiveTool: (toolId: string | null) => void;
  clearAllDrawings: () => void;
  removeDrawing: (drawingId: string) => void;
}

// Map our tool IDs to KLineChart overlay names
const OVERLAY_MAP: Record<string, string> = {};
const TOOL_NAMES: Record<string, string> = {};
Object.values(DRAWING_TOOLS).forEach(category => {
  category.tools.forEach(tool => {
    OVERLAY_MAP[tool.id] = tool.overlay;
    TOOL_NAMES[tool.id] = tool.name;
  });
});

/**
 * Hook for managing chart drawing tools
 */
export const useDrawingManager = ({
  chartRef,
}: UseDrawingManagerOptions): UseDrawingManagerReturn => {
  const [activeTool, setActiveToolState] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<DrawingInfo[]>([]);
  const currentToolRef = useRef<string | null>(null);

  /**
   * Set active drawing tool
   * When a tool is selected, it will be activated on the chart
   */
  const setActiveTool = useCallback((toolId: string | null) => {
    const chart = chartRef.current;
    currentToolRef.current = toolId;
    
    if (!chart) {
      setActiveToolState(toolId);
      return;
    }

    if (toolId === null) {
      // Deselect - cancel any active drawing mode
      // KLineChart doesn't have a specific "cancel drawing" method,
      // but setting to null will stop creating new overlays
      setActiveToolState(null);
      return;
    }

    const overlayName = OVERLAY_MAP[toolId];
    if (!overlayName) {
      console.warn(`Unknown drawing tool: ${toolId}`);
      return;
    }

    // Special styling for Fibonacci
    const isFibonacci = overlayName === 'fibonacciLine' || overlayName === 'customFibonacci';
    
    // Create the overlay in "drawing mode"
    // KLineChart will let user click to place points
    const overlayId = chart.createOverlay({
      name: overlayName,
      styles: {
        line: {
          style: isFibonacci ? 'solid' : 'solid',
          color: '#D4AF37', // Golden
          size: isFibonacci ? 1 : 1,
        },
        point: {
          color: '#D4AF37',
          borderColor: '#D4AF37',
          borderSize: 1,
          radius: 4,
          activeColor: '#E5C158',
          activeBorderColor: '#E5C158',
          activeRadius: 6,
        },
        text: {
          style: 'fill',
          color: isFibonacci ? '#FFFFFF' : '#D4AF37',
          size: 12,
          family: 'inherit',
          weight: 'normal',
          backgroundColor: isFibonacci ? 'rgba(212, 175, 55, 0.8)' : 'transparent',
          borderRadius: 2,
          paddingLeft: isFibonacci ? 4 : 0,
          paddingRight: isFibonacci ? 4 : 0,
          paddingTop: isFibonacci ? 2 : 0,
          paddingBottom: isFibonacci ? 2 : 0,
        },
      },
      onDrawEnd: (event: { overlay: { id?: string } }) => {
        // Track the drawing with its name
        if (event.overlay?.id && currentToolRef.current) {
          const newDrawing: DrawingInfo = {
            id: event.overlay.id,
            toolId: currentToolRef.current,
            name: TOOL_NAMES[currentToolRef.current] || 'Drawing',
            timestamp: Date.now(),
          };
          setDrawings(prev => [...prev, newDrawing]);
        }
        // Stay in drawing mode (user can draw multiple of same type)
        return true;
      },
    });

    if (overlayId) {
      setActiveToolState(toolId);
    }
  }, [chartRef]);

  /**
   * Remove a specific drawing
   */
  const removeDrawing = useCallback((drawingId: string) => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.removeOverlay({ id: drawingId });
    setDrawings(prev => prev.filter(d => d.id !== drawingId));
  }, [chartRef]);

  /**
   * Clear all drawings from the chart
   */
  const clearAllDrawings = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Remove all overlays
    chart.removeOverlay();
    
    // Reset tracking
    setDrawings([]);
    setActiveToolState(null);
  }, [chartRef]);

  return {
    activeTool,
    drawingCount: drawings.length,
    drawings,
    setActiveTool,
    clearAllDrawings,
    removeDrawing,
  };
};

export default useDrawingManager;
