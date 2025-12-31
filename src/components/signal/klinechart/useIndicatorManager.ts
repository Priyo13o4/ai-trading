/**
 * Indicator Manager Hook
 * 
 * Manages indicator state, persistence, and chart integration.
 */

import { useState, useCallback, useEffect } from 'react';
import type { IndicatorConfig } from './types';
import { DEFAULT_INDICATORS, STORAGE_KEYS } from './constants';

interface UseIndicatorManagerOptions {
  createIndicator: (config: IndicatorConfig) => string | null;
  removeIndicator: (indicatorId: string, paneId?: string) => void;
}

interface UseIndicatorManagerReturn {
  indicators: IndicatorConfig[];
  toggleIndicator: (indicatorId: string) => void;
  getActiveOverlayCount: () => number;
  getActiveOscillatorCount: () => number;
  syncIndicatorsWithChart: () => void;
}

/**
 * Hook for managing chart indicators
 */
export const useIndicatorManager = ({
  createIndicator,
  removeIndicator,
}: UseIndicatorManagerOptions): UseIndicatorManagerReturn => {
  // Load saved indicators from localStorage or use defaults
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.chartIndicators);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle any new indicators
        return DEFAULT_INDICATORS.map(defaultInd => {
          const savedInd = parsed.find((s: IndicatorConfig) => s.id === defaultInd.id);
          return savedInd ? { ...defaultInd, enabled: savedInd.enabled } : defaultInd;
        });
      }
    } catch (err) {
      console.error('Failed to load saved indicators:', err);
    }
    return DEFAULT_INDICATORS;
  });

  // Track created indicator pane IDs
  const [indicatorPaneIds, setIndicatorPaneIds] = useState<Map<string, string>>(new Map());

  /**
   * Toggle an indicator on/off
   */
  const toggleIndicator = useCallback((indicatorId: string) => {
    setIndicators(prev => {
      const updated = prev.map(ind => {
        if (ind.id !== indicatorId) return ind;
        
        const newEnabled = !ind.enabled;
        
        if (newEnabled) {
          // Create indicator on chart
          const paneId = createIndicator(ind);
          if (paneId) {
            setIndicatorPaneIds(pids => new Map(pids).set(indicatorId, paneId));
          }
        } else {
          // Remove indicator from chart
          const paneId = indicatorPaneIds.get(indicatorId);
          removeIndicator(indicatorId, paneId);
          setIndicatorPaneIds(pids => {
            const newMap = new Map(pids);
            newMap.delete(indicatorId);
            return newMap;
          });
        }
        
        return { ...ind, enabled: newEnabled };
      });
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.chartIndicators, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save indicators:', err);
      }
      
      return updated;
    });
  }, [createIndicator, removeIndicator, indicatorPaneIds]);

  /**
   * Get count of active overlay indicators
   */
  const getActiveOverlayCount = useCallback(() => {
    return indicators.filter(i => i.category === 'overlay' && i.enabled).length;
  }, [indicators]);

  /**
   * Get count of active oscillator indicators
   */
  const getActiveOscillatorCount = useCallback(() => {
    return indicators.filter(i => i.category === 'oscillator' && i.enabled).length;
  }, [indicators]);

  /**
   * Sync indicators with chart (create all enabled indicators)
   * Called after chart initialization
   */
  const syncIndicatorsWithChart = useCallback(() => {
    // Clear existing pane IDs
    setIndicatorPaneIds(new Map());
    
    // Create all enabled indicators
    indicators.filter(ind => ind.enabled).forEach(ind => {
      const paneId = createIndicator(ind);
      if (paneId) {
        setIndicatorPaneIds(pids => new Map(pids).set(ind.id, paneId));
      }
    });
  }, [indicators, createIndicator]);

  return {
    indicators,
    toggleIndicator,
    getActiveOverlayCount,
    getActiveOscillatorCount,
    syncIndicatorsWithChart,
  };
};

export default useIndicatorManager;
