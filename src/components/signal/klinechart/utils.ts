/**
 * KLineChart Data Utilities
 * 
 * Utilities for data transformation, conversion, and manipulation.
 */

import type { ApiCandle, KLineData, StrategyLineConfig } from './types';
import { STRATEGY_COLORS } from './constants';

// ============================================================================
// Data Conversion
// ============================================================================

/**
 * Converts API candle format to KLineChart format
 * Lightweight Charts uses seconds, KLineChart uses milliseconds
 */
export const convertApiCandleToKLine = (candle: ApiCandle): KLineData => ({
  timestamp: new Date(candle.time).getTime(),
  open: candle.open,
  high: candle.high,
  low: candle.low,
  close: candle.close,
  volume: candle.volume || 0,
});

/**
 * Converts an array of API candles to KLineChart format
 * Preserves the order from the API (backend returns DESC)
 */
export const convertCandlesToKLine = (candles: ApiCandle[]): KLineData[] => {
  return candles.map(convertApiCandleToKLine);
};

/**
 * Returns display precision for a symbol (prices use fixed decimals)
 */
export const getPrecisionForSymbol = (symbol: string): number => {
  const normalized = symbol.replace('/', '').toUpperCase();
  if (normalized.startsWith('XAU')) return 3;
  if (normalized.includes('JPY')) return 3;
  return 5;
};

/**
 * Merges new data with existing data, removing duplicates
 * Used for lazy loading historical data
 * IMPORTANT: Maintains ascending order (oldest to newest)
 */
export const mergeKLineData = (
  existingData: KLineData[],
  newData: KLineData[]
): KLineData[] => {
  const timeMap = new Map<number, KLineData>();
  
  // Add existing data first
  existingData.forEach(candle => timeMap.set(candle.timestamp, candle));
  
  // Add new data (overwrites duplicates, which is fine for lazy loading historical data)
  newData.forEach(candle => timeMap.set(candle.timestamp, candle));
  
  // Convert back to array and sort in ASCENDING order (oldest first)
  return Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Sorts kline data in DESCENDING order (newest first)
 * Required for KLineChart backward loads
 */
export const sortKLineDataDesc = (data: KLineData[]): KLineData[] => {
  return [...data].sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Gets the oldest timestamp from data array
 */
export const getOldestTimestamp = (data: KLineData[]): number | null => {
  if (data.length === 0) return null;
  return data[0].timestamp;
};

/**
 * Gets the newest timestamp from data array
 */
export const getNewestTimestamp = (data: KLineData[]): number | null => {
  if (data.length === 0) return null;
  return data[data.length - 1].timestamp;
};

// ============================================================================
// Strategy Line Utilities
// ============================================================================

/**
 * Creates strategy line configurations from strategy data
 */
export const createStrategyLines = (strategy: {
  entry_price: number;
  take_profit: number;
  stop_loss: number;
}): StrategyLineConfig[] => {
  const lines: StrategyLineConfig[] = [];
  
  if (strategy.entry_price) {
    lines.push({
      key: 'entry',
      value: strategy.entry_price,
      color: STRATEGY_COLORS.entry,
      label: 'Entry',
    });
  }
  
  if (strategy.take_profit) {
    lines.push({
      key: 'tp',
      value: strategy.take_profit,
      color: STRATEGY_COLORS.takeProfit,
      label: 'TP',
    });
  }
  
  if (strategy.stop_loss) {
    lines.push({
      key: 'sl',
      value: strategy.stop_loss,
      color: STRATEGY_COLORS.stopLoss,
      label: 'SL',
    });
  }
  
  return lines;
};

// ============================================================================
// Timeframe Utilities
// ============================================================================

/**
 * Converts internal timeframe value to KLineChart period format
 */
export const timeframeToPeriod = (timeframe: string): { span: number; type: string } => {
  const mapping: Record<string, { span: number; type: string }> = {
    'M1': { span: 1, type: 'minute' },
    'M5': { span: 5, type: 'minute' },
    'M15': { span: 15, type: 'minute' },
    'M30': { span: 30, type: 'minute' },
    'H1': { span: 1, type: 'hour' },
    'H4': { span: 4, type: 'hour' },
    'D1': { span: 1, type: 'day' },
    'W1': { span: 1, type: 'week' },
  };
  
  return mapping[timeframe] || { span: 1, type: 'day' };
};

/**
 * Calculates the timestamp offset for a given timeframe
 * Used for determining how much historical data to request
 */
export const getTimeframeOffset = (timeframe: string, barCount: number): number => {
  const secondsPerBar: Record<string, number> = {
    'M1': 60,
    'M5': 300,
    'M15': 900,
    'M30': 1800,
    'H1': 3600,
    'H4': 14400,
    'D1': 86400,
    'W1': 604800,
  };
  
  const seconds = secondsPerBar[timeframe] || 86400;
  return seconds * barCount * 1000; // Convert to milliseconds
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates that candle data has all required fields
 */
export const isValidCandle = (candle: Partial<KLineData>): candle is KLineData => {
  return (
    typeof candle.timestamp === 'number' &&
    typeof candle.open === 'number' &&
    typeof candle.high === 'number' &&
    typeof candle.low === 'number' &&
    typeof candle.close === 'number' &&
    !isNaN(candle.timestamp) &&
    !isNaN(candle.open) &&
    !isNaN(candle.high) &&
    !isNaN(candle.low) &&
    !isNaN(candle.close)
  );
};

/**
 * Filters out invalid candles from an array
 */
export const filterValidCandles = (candles: Partial<KLineData>[]): KLineData[] => {
  return candles.filter(isValidCandle);
};

// ============================================================================
// News Marker Utilities
// ============================================================================

/**
 * Gets importance color for news marker
 */
export const getNewsImportanceColor = (importance: number): string => {
  if (importance >= 4) return '#EF4444'; // High - Red
  if (importance >= 3) return '#F97316'; // Medium - Orange
  return '#64748B'; // Low - Gray
};

/**
 * Converts news timestamp to KLineChart format (milliseconds)
 */
export const newsTimeToTimestamp = (time: string): number => {
  return new Date(time).getTime();
};
