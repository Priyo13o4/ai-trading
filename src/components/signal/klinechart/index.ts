/**
 * KLineChart Components - Barrel Export
 * 
 * This module exports all chart-related components, hooks, types, and utilities.
 */

// Main Component
export { EnhancedTradingChart } from './EnhancedTradingChart';
export { default } from './EnhancedTradingChart';

// Sub-components
export { ChartControls } from './ChartControls';

// Hooks
export { useKLineChart } from './useKLineChart';
export { useIndicatorManager } from './useIndicatorManager';
export { useStrategyManager } from './useStrategyManager';

// Types
export type {
  EnhancedTradingChartProps,
  ApiCandle,
  KLineData,
  StrategyData,
  IndicatorConfig,
  TimeframeConfig,
  ChartState,
  DataLoaderParams,
  StrategyLineConfig,
  ChartClickEvent,
} from './types';

// Constants
export {
  TIMEFRAMES,
  DEFAULT_INDICATORS,
  DARK_CHART_STYLES,
  STRATEGY_COLORS,
  STORAGE_KEYS,
} from './constants';

// Utilities
export {
  convertApiCandleToKLine,
  convertCandlesToKLine,
  mergeKLineData,
  timeframeToPeriod,
  createStrategyLines,
  getOldestTimestamp,
  getNewestTimestamp,
} from './utils';
