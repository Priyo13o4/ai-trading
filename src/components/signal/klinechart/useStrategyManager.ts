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
  
  // If it's a direct number or numeric string, try parsing it
  const directValue = parseNumeric(entrySignal);
  if (directValue !== undefined) return directValue;

  // Otherwise try parsing as JSON if it's a string
  const payload = typeof entrySignal === 'string' ? (() => {
    try {
      return JSON.parse(entrySignal);
    } catch {
      return null;
    }
  })() : entrySignal;

  if (!payload) return undefined;
  
  // If JSON parsed to a number/numeric string
  const parsedValue = parseNumeric(payload);
  if (parsedValue !== undefined) return parsedValue;

  // If it's an object with known keys
  if (typeof payload === 'object') {
    const asRecord = payload as Record<string, unknown>;
    return (
      parseNumeric(asRecord.entry_price) ||
      parseNumeric(asRecord.entryPrice) ||
      parseNumeric(asRecord.price) ||
      parseNumeric(asRecord.entry) ||
      parseNumeric(asRecord.level)
    );
  }

  return undefined;
};

const parseStrategyPayload = (payload: any): StrategyData | null => {
  if (!payload || typeof payload !== 'object') return null;

  // Try multiple common names from different API versions
  const entryPrice =
    parseNumeric(payload.entry_price) ||
    parseNumeric(payload.entryPrice) ||
    parseNumeric(payload.entry) ||
    extractEntryPrice(payload.entry_signal) ||
    extractEntryPrice(payload.entrySignal);

  const takeProfit = 
    parseNumeric(payload.take_profit) || 
    parseNumeric(payload.takeProfit) || 
    parseNumeric(payload.tp);

  const stopLoss = 
    parseNumeric(payload.stop_loss) || 
    parseNumeric(payload.stopLoss) || 
    parseNumeric(payload.sl);

  // If we don't have at least an entry price, we can't show much
  if (entryPrice === undefined) return null;

  return {
    name: payload.strategy_name || payload.name || payload.strategyName || 'Strategy',
    direction: normalizeDirection(payload.direction),
    entry_price: entryPrice,
    take_profit: takeProfit,
    stop_loss: stopLoss,
    confidence: parseNumeric(payload.confidence_score) || parseNumeric(payload.confidence) || parseNumeric(payload.confidenceScore),
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
