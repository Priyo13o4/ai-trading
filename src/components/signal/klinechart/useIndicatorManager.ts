/**
 * Indicator Manager Hook
 * 
 * Manages indicator state, persistence, and chart integration.
 * Supports MT5-like customization of parameters and colors.
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
  updateIndicator: (indicatorId: string, updates: Partial<IndicatorConfig>) => void;
  resetToDefaults: () => void;
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
        // Merge with defaults to handle any new indicators, preserving saved params and colors
        return DEFAULT_INDICATORS.map(defaultInd => {
          const savedInd = parsed.find((s: IndicatorConfig) => s.id === defaultInd.id);
          if (savedInd) {
            return { 
              ...defaultInd, 
              enabled: savedInd.enabled,
              params: savedInd.params || defaultInd.params,
              colors: savedInd.colors || defaultInd.colors,
            };
          }
          return defaultInd;
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
   * Save indicators to localStorage
   */
  const saveIndicators = useCallback((updated: IndicatorConfig[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.chartIndicators, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save indicators:', err);
    }
  }, []);

  /**
   * Toggle an indicator on/off
   */
  const toggleIndicator = useCallback((indicatorId: string) => {
    setIndicators(prev => {
      const indicator = prev.find(ind => ind.id === indicatorId);
      if (!indicator) return prev;
      
      const newEnabled = !indicator.enabled;
      const updated = prev.map(ind => 
        ind.id === indicatorId ? { ...ind, enabled: newEnabled } : ind
      );
      
      // For overlay indicators, when toggling off we need to remove all and recreate remaining
      if (indicator.category === 'overlay') {
        // Remove all overlay indicators from chart
        const paneId = indicatorPaneIds.get(indicatorId);
        removeIndicator(indicatorId, paneId);
        
        // Clear pane IDs for all overlays since removeIndicator clears the candle_pane
        const newPaneIds = new Map(indicatorPaneIds);
        updated.filter(i => i.category === 'overlay').forEach(i => newPaneIds.delete(i.id));
        
        // Recreate all enabled overlay indicators
        setTimeout(() => {
          updated.filter(i => i.category === 'overlay' && i.enabled).forEach(ind => {
            const paneId = createIndicator(ind);
            if (paneId) {
              setIndicatorPaneIds(pids => new Map(pids).set(ind.id, paneId));
            }
          });
        }, 50);
        
        setIndicatorPaneIds(newPaneIds);
      } else {
        // For oscillator indicators, simple toggle
        if (newEnabled) {
          const paneId = createIndicator(indicator);
          if (paneId) {
            setIndicatorPaneIds(pids => new Map(pids).set(indicatorId, paneId));
          }
        } else {
          const paneId = indicatorPaneIds.get(indicatorId);
          removeIndicator(indicatorId, paneId);
          setIndicatorPaneIds(pids => {
            const newMap = new Map(pids);
            newMap.delete(indicatorId);
            return newMap;
          });
        }
      }
      
      saveIndicators(updated);
      return updated;
    });
  }, [createIndicator, removeIndicator, indicatorPaneIds, saveIndicators]);

  /**
   * Update indicator parameters and/or colors
   */
  const updateIndicator = useCallback((indicatorId: string, updates: Partial<IndicatorConfig>) => {
    setIndicators(prev => {
      const updated = prev.map(ind => {
        if (ind.id !== indicatorId) return ind;
        
        const newInd = { ...ind, ...updates };
        
        // If indicator is enabled, recreate it with new settings
        if (ind.enabled) {
          const paneId = indicatorPaneIds.get(indicatorId);
          removeIndicator(indicatorId, paneId);
          
          // Small delay to ensure removal completes
          setTimeout(() => {
            const newPaneId = createIndicator(newInd);
            if (newPaneId) {
              setIndicatorPaneIds(pids => new Map(pids).set(indicatorId, newPaneId));
            }
          }, 50);
        }
        
        return newInd;
      });
      
      saveIndicators(updated);
      return updated;
    });
  }, [createIndicator, removeIndicator, indicatorPaneIds, saveIndicators]);

  /**
   * Reset all indicators to default settings
   */
  const resetToDefaults = useCallback(() => {
    // Remove all active indicators from chart
    indicators.forEach(ind => {
      if (ind.enabled) {
        const paneId = indicatorPaneIds.get(ind.id);
        removeIndicator(ind.id, paneId);
      }
    });
    
    // Reset state
    setIndicatorPaneIds(new Map());
    setIndicators(DEFAULT_INDICATORS);
    
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEYS.chartIndicators);
    } catch (err) {
      console.error('Failed to clear indicators:', err);
    }
  }, [indicators, indicatorPaneIds, removeIndicator]);

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
    updateIndicator,
    resetToDefaults,
    getActiveOverlayCount,
    getActiveOscillatorCount,
    syncIndicatorsWithChart,
  };
};

export default useIndicatorManager;
