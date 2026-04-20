/**
 * Strategy Manager Hook
 * 
 * Manages strategy overlay lines (entry, TP, SL) on the chart.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { StrategyData } from './types';
import { STORAGE_KEYS, STRATEGY_COLORS } from './constants';
import type { StrategyRecord } from '@/types/strategy';

interface UseStrategyManagerOptions {
  symbol: string;
  activeStrategies: StrategyRecord[];
  createStrategyOverlay: (key: string, value: number, color: string, label: string) => string | null;
  removeOverlay: (overlayId: string) => void;
}

export interface StrategyOverlayOption {
  key: string;
  name: string;
  direction: 'long' | 'short';
  entry_price?: number;
  take_profit?: number;
  stop_loss?: number;
  confidence?: number;
  added_at: string;
  strategy_id: number;
}

interface UseStrategyManagerReturn {
  strategy: StrategyData | null;
  showStrategy: boolean;
  toggleStrategy: () => void;
  strategyOptions: StrategyOverlayOption[];
  selectedStrategyKey: string | null;
  selectStrategy: (strategyKey: string) => void;
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

const toEpochMs = (value: string | null | undefined): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const symbolAliasMap: Record<string, string> = {
  XAUUSD: 'GOLD',
  GOLD: 'XAUUSD',
  XAGUSD: 'SILVER',
  SILVER: 'XAGUSD',
  BTCUSDT: 'BTCUSD',
  BTCUSD: 'BTCUSDT',
  ETHUSDT: 'ETHUSD',
  ETHUSD: 'ETHUSDT',
  USOIL: 'CRUDE',
  CRUDE: 'USOIL',
};

const symbolsMatch = (left: string | null | undefined, right: string | null | undefined): boolean => {
  const a = String(left || '').toUpperCase();
  const b = String(right || '').toUpperCase();
  if (!a || !b) return false;
  if (a === b) return true;
  return symbolAliasMap[a] === b || symbolAliasMap[b] === a;
};

const buildStrategySelectionKey = (record: StrategyRecord): string => {
  if (Number.isFinite(record.strategy_id) && record.strategy_id > 0) {
    return `id:${record.strategy_id}`;
  }

  return `strategy:${record.strategy_name}:${record.symbol}:${record.created_at || record.timestamp}`;
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

/**
 * Hook for managing strategy visualization on chart
 */
export const useStrategyManager = ({
  symbol,
  activeStrategies,
  createStrategyOverlay,
  removeOverlay,
}: UseStrategyManagerOptions): UseStrategyManagerReturn => {
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [selectedStrategyKey, setSelectedStrategyKey] = useState<string | null>(null);
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
   * Normalize active strategies into overlay-ready options.
   */
  const strategyOptions = useMemo<StrategyOverlayOption[]>(() => {
    return (activeStrategies || [])
      .filter((record) => symbolsMatch(record.symbol, symbol))
      .map((record) => {
        const entryPrice = extractEntryPrice(record.entry_signal);
        const takeProfit = parseNumeric(record.take_profit);
        const stopLoss = parseNumeric(record.stop_loss);
        const direction = normalizeDirection(record.direction);

        return {
          key: buildStrategySelectionKey(record),
          name: record.strategy_name || 'Strategy',
          direction,
          entry_price: entryPrice,
          take_profit: takeProfit,
          stop_loss: stopLoss,
          confidence: parseNumeric(record.confidence),
          added_at: record.created_at || record.timestamp,
          strategy_id: Number.isFinite(record.strategy_id) ? record.strategy_id : 0,
        };
      })
      .sort((a, b) => {
        const aCreated = toEpochMs(a.added_at);
        const bCreated = toEpochMs(b.added_at);
        if (aCreated !== bCreated) return bCreated - aCreated;
        return b.strategy_id - a.strategy_id;
      });
  }, [activeStrategies, symbol]);

  useEffect(() => {
    if (strategyOptions.length === 0) {
      setSelectedStrategyKey(null);
      setStrategy(null);
      return;
    }

    setSelectedStrategyKey((current) => {
      if (current && strategyOptions.some((option) => option.key === current)) {
        return current;
      }
      return strategyOptions[0].key;
    });
  }, [strategyOptions]);

  useEffect(() => {
    if (!selectedStrategyKey) {
      setStrategy(null);
      return;
    }

    const selected = strategyOptions.find((option) => option.key === selectedStrategyKey);
    if (!selected) {
      setStrategy(null);
      return;
    }

    if (selected.entry_price === undefined) {
      setStrategy(null);
      return;
    }

    setStrategy({
      name: selected.name,
      direction: selected.direction,
      entry_price: selected.entry_price,
      take_profit: selected.take_profit,
      stop_loss: selected.stop_loss,
      confidence: selected.confidence,
    });
  }, [selectedStrategyKey, strategyOptions]);

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

  const selectStrategy = useCallback((strategyKey: string) => {
    setSelectedStrategyKey(strategyKey);
    setShowStrategy((prev) => {
      if (prev) return prev;

      try {
        localStorage.setItem(STORAGE_KEYS.showStrategy, JSON.stringify(true));
      } catch (err) {
        console.error('Failed to save strategy visibility:', err);
      }

      return true;
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
    strategyOptions,
    selectedStrategyKey,
    selectStrategy,
    syncStrategyWithChart,
    clearStrategyOverlays,
  };
};

export default useStrategyManager;
