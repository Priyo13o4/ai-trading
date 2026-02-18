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

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const normalizeDirection = (value: unknown): 'long' | 'short' => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'short' || raw === 'sell' || raw === 'bearish') return 'short';
  return 'long';
};

const extractEntryPrice = (entrySignal: unknown): number | undefined => {
  if (!entrySignal) return undefined;

  const payload = typeof entrySignal === 'string' ? (() => {
    try {
      return JSON.parse(entrySignal);
    } catch {
      return null;
    }
  })() : entrySignal;

  if (!payload || typeof payload !== 'object') return undefined;

  const asRecord = payload as Record<string, unknown>;
  return (
    parseNumeric(asRecord.entry_price) ||
    parseNumeric(asRecord.entryPrice) ||
    parseNumeric(asRecord.price) ||
    parseNumeric(asRecord.entry)
  );
};

const parseStrategyPayload = (payload: any): StrategyData | null => {
  if (!payload || typeof payload !== 'object') return null;

  const entryPrice =
    parseNumeric(payload.entry_price) ||
    extractEntryPrice(payload.entry_signal);
  const takeProfit = parseNumeric(payload.take_profit);
  const stopLoss = parseNumeric(payload.stop_loss);

  return {
    name: payload.strategy_name || payload.name || 'Strategy',
    direction: normalizeDirection(payload.direction),
    entry_price: entryPrice,
    take_profit: takeProfit,
    stop_loss: stopLoss,
    confidence: parseNumeric(payload.confidence_score) || parseNumeric(payload.confidence),
  };
};

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
      if (response.error || !response.data) {
        setStrategy(null);
        return;
      }

      setStrategy(parseStrategyPayload(response.data));
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
