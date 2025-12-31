/**
 * Strategy Manager Hook
 * 
 * Manages strategy overlay lines (entry, TP, SL) on the chart.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { StrategyData } from './types';
import { STORAGE_KEYS, STRATEGY_COLORS } from './constants';
import apiService from '@/services/api';

interface UseStrategyManagerOptions {
  symbol: string;
  createStrategyOverlay: (key: string, value: number, color: string, label: string) => string | null;
  removeOverlay: (overlayId: string) => void;
}

interface UseStrategyManagerReturn {
  strategy: StrategyData | null;
  showStrategy: boolean;
  toggleStrategy: () => void;
  fetchStrategy: () => Promise<void>;
  syncStrategyWithChart: () => void;
  clearStrategyOverlays: () => void;
}

/**
 * Hook for managing strategy visualization on chart
 */
export const useStrategyManager = ({
  symbol,
  createStrategyOverlay,
  removeOverlay,
}: UseStrategyManagerOptions): UseStrategyManagerReturn => {
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [showStrategy, setShowStrategy] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.showStrategy);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  
  const overlayIdsRef = useRef<Map<string, string>>(new Map());

  /**
   * Fetch strategy data from API
   */
  const fetchStrategy = useCallback(async () => {
    try {
      const response = await apiService.getStrategy(symbol);
      if (response.data && !response.error) {
        setStrategy(response.data);
      } else {
        setStrategy(null);
      }
    } catch (err) {
      console.error('Failed to fetch strategy:', err);
      setStrategy(null);
    }
  }, [symbol]);

  /**
   * Clear all strategy overlays from chart
   */
  const clearStrategyOverlays = useCallback(() => {
    overlayIdsRef.current.forEach((overlayId) => {
      removeOverlay(overlayId);
    });
    overlayIdsRef.current.clear();
  }, [removeOverlay]);

  /**
   * Sync strategy overlays with chart
   */
  const syncStrategyWithChart = useCallback(() => {
    // First clear existing overlays
    clearStrategyOverlays();
    
    // If strategy is hidden or no strategy data, don't create overlays
    if (!showStrategy || !strategy) return;

    // Create strategy lines
    const lines = [
      { key: 'entry', value: strategy.entry_price, color: STRATEGY_COLORS.entry, label: 'Entry' },
      { key: 'tp', value: strategy.take_profit, color: STRATEGY_COLORS.takeProfit, label: 'TP' },
      { key: 'sl', value: strategy.stop_loss, color: STRATEGY_COLORS.stopLoss, label: 'SL' },
    ];

    lines.forEach(({ key, value, color, label }) => {
      if (value) {
        const overlayId = createStrategyOverlay(key, value, color, label);
        if (overlayId) {
          overlayIdsRef.current.set(key, overlayId);
        }
      }
    });
  }, [showStrategy, strategy, createStrategyOverlay, clearStrategyOverlays]);

  /**
   * Toggle strategy visibility
   */
  const toggleStrategy = useCallback(() => {
    setShowStrategy(prev => {
      const newValue = !prev;
      
      try {
        localStorage.setItem(STORAGE_KEYS.showStrategy, JSON.stringify(newValue));
      } catch (err) {
        console.error('Failed to save strategy visibility:', err);
      }
      
      return newValue;
    });
  }, []);

  // Update overlays when strategy or visibility changes
  useEffect(() => {
    syncStrategyWithChart();
  }, [strategy, showStrategy, syncStrategyWithChart]);

  return {
    strategy,
    showStrategy,
    toggleStrategy,
    fetchStrategy,
    syncStrategyWithChart,
    clearStrategyOverlays,
  };
};

export default useStrategyManager;
