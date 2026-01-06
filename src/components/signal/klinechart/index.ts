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
export { IndicatorSettingsModal } from './IndicatorSettingsModal';
export { ChartSettingsModal, DEFAULT_SETTINGS } from './ChartSettingsModal';
export type { ChartSettings } from './ChartSettingsModal';
export { DrawingToolsPanel, DRAWING_TOOLS } from './DrawingToolsPanel';
export { NewsEventPopup } from './NewsEventPopup';

// Hooks
export { useKLineChart } from './useKLineChart';
export { useIndicatorManager } from './useIndicatorManager';
export { useStrategyManager } from './useStrategyManager';
export { useDrawingManager } from './useDrawingManager';
export { useNewsOverlay } from './useNewsOverlay';

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
  NewsMarker,
  AggregatedNewsMarker,
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

// Custom Overlays
export {
  initCustomOverlays,
  setFibonacciLevels,
  getFibonacciLevels,
  DEFAULT_FIBONACCI_LEVELS,
  registerNewsMarkerOverlay,
} from './customOverlays';
