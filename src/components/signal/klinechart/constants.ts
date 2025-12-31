/**
 * KLineChart Constants and Configurations
 * 
 * Centralizes all chart configuration including timeframes, indicators, and styles.
 */

import type { TimeframeConfig, IndicatorConfig } from './types';

// ============================================================================
// Timeframe Configurations
// ============================================================================

export const TIMEFRAMES: TimeframeConfig[] = [
  { value: 'M1', label: '1 min', seconds: 60, periodSpan: 1, periodType: 'minute' },
  { value: 'M5', label: '5 min', seconds: 300, periodSpan: 5, periodType: 'minute' },
  { value: 'M15', label: '15 min', seconds: 900, periodSpan: 15, periodType: 'minute' },
  { value: 'M30', label: '30 min', seconds: 1800, periodSpan: 30, periodType: 'minute' },
  { value: 'H1', label: '1 hour', seconds: 3600, periodSpan: 1, periodType: 'hour' },
  { value: 'H4', label: '4 hour', seconds: 14400, periodSpan: 4, periodType: 'hour' },
  { value: 'D1', label: '1 day', seconds: 86400, periodSpan: 1, periodType: 'day' },
  { value: 'W1', label: '1 week', seconds: 604800, periodSpan: 1, periodType: 'week' },
];

/** Get timeframe config by value */
export const getTimeframeConfig = (value: string): TimeframeConfig | undefined => 
  TIMEFRAMES.find(tf => tf.value === value);

/** Get data limit for a timeframe (for API requests) */
export const getDataLimit = (timeframe: string): number => {
  const limits: Record<string, number> = {
    'M1': 10000,
    'M5': 5000,
    'M15': 3000,
    'M30': 3000,
    'H1': 3000,
    'H4': 2000,
    'D1': 750,
    'W1': 500,
  };
  return limits[timeframe] || 3000;
};

// ============================================================================
// Indicator Configurations
// ============================================================================

/**
 * Default indicator configurations
 * 
 * Overlay indicators are displayed on the main candle chart.
 * Oscillator indicators are displayed in separate panes below.
 */
export const DEFAULT_INDICATORS: IndicatorConfig[] = [
  // Overlay Indicators (on main chart)
  { 
    id: 'ema9', 
    name: 'EMA 9', 
    klineIndicator: 'EMA',
    category: 'overlay', 
    enabled: false, 
    params: { calcParams: [9] }, 
    colors: ['#F97316'] 
  },
  { 
    id: 'ema21', 
    name: 'EMA 21', 
    klineIndicator: 'EMA',
    category: 'overlay', 
    enabled: true, 
    params: { calcParams: [21] }, 
    colors: ['#3B82F6'] 
  },
  { 
    id: 'ema50', 
    name: 'EMA 50', 
    klineIndicator: 'EMA',
    category: 'overlay', 
    enabled: false, 
    params: { calcParams: [50] }, 
    colors: ['#10B981'] 
  },
  { 
    id: 'sma200', 
    name: 'SMA 200', 
    klineIndicator: 'MA',
    category: 'overlay', 
    enabled: false, 
    params: { calcParams: [200] }, 
    colors: ['#8B5CF6'] 
  },
  { 
    id: 'bb', 
    name: 'Bollinger Bands', 
    klineIndicator: 'BOLL',
    category: 'overlay', 
    enabled: false, 
    params: { calcParams: [20, 2] }, 
    colors: ['#06B6D4', '#06B6D4', '#06B6D4'] 
  },
  // Note: Pivot Points are not built-in to KLineChart, would need custom implementation
  // Keeping config for potential future custom indicator
  { 
    id: 'sar', 
    name: 'SAR', 
    klineIndicator: 'SAR',
    category: 'overlay', 
    enabled: false, 
    params: { calcParams: [2, 2, 20] }, 
    colors: ['#FBBF24'] 
  },
  
  // Oscillator Indicators (separate panes)
  { 
    id: 'rsi', 
    name: 'RSI', 
    klineIndicator: 'RSI',
    category: 'oscillator', 
    enabled: false, 
    params: { calcParams: [14] }, 
    colors: ['#A855F7'] 
  },
  { 
    id: 'macd', 
    name: 'MACD', 
    klineIndicator: 'MACD',
    category: 'oscillator', 
    enabled: false, 
    params: { calcParams: [12, 26, 9] }, 
    colors: ['#3B82F6', '#F97316', '#22C55E'] 
  },
  { 
    id: 'atr', 
    name: 'ATR', 
    klineIndicator: 'ATR',
    category: 'oscillator', 
    enabled: false, 
    params: { calcParams: [14] }, 
    colors: ['#EAB308'] 
  },
];

// ============================================================================
// Chart Theme / Styles
// ============================================================================

/**
 * Dark theme styles for KLineChart
 * Matches the existing application's color scheme
 */
export const DARK_CHART_STYLES = {
  grid: {
    show: true,
    horizontal: {
      show: true,
      size: 1,
      color: '#1F2937',
      style: 'dashed' as const,
      dashedValue: [2, 2],
    },
    vertical: {
      show: true,
      size: 1,
      color: '#1F2937',
      style: 'dashed' as const,
      dashedValue: [2, 2],
    },
  },
  candle: {
    type: 'candle_solid' as const,
    bar: {
      upColor: '#22C55E',
      downColor: '#EF4444',
      noChangeColor: '#888888',
      upBorderColor: '#22C55E',
      downBorderColor: '#EF4444',
      noChangeBorderColor: '#888888',
      upWickColor: '#22C55E',
      downWickColor: '#EF4444',
      noChangeWickColor: '#888888',
    },
    priceMark: {
      show: true,
      high: {
        show: true,
        color: '#D9D9D9',
        textMargin: 5,
        textSize: 10,
      },
      low: {
        show: true,
        color: '#D9D9D9',
        textMargin: 5,
        textSize: 10,
      },
      last: {
        show: true,
        upColor: '#22C55E',
        downColor: '#EF4444',
        noChangeColor: '#888888',
        line: {
          show: true,
          style: 'dashed' as const,
          dashedValue: [4, 4],
          size: 1,
        },
        text: {
          show: true,
          style: 'fill' as const,
          size: 12,
          paddingLeft: 4,
          paddingTop: 4,
          paddingRight: 4,
          paddingBottom: 4,
          color: '#FFFFFF',
          borderRadius: 2,
        },
      },
    },
    tooltip: {
      showRule: 'always' as const,
      showType: 'standard' as const,
      offsetLeft: 4,
      offsetTop: 6,
      offsetRight: 4,
      offsetBottom: 6,
      legend: {
        size: 12,
        color: '#9CA3AF',
        marginLeft: 8,
        marginTop: 4,
        marginRight: 8,
        marginBottom: 4,
      },
    },
  },
  indicator: {
    ohlc: {
      upColor: 'rgba(34, 197, 94, 0.7)',
      downColor: 'rgba(239, 68, 68, 0.7)',
      noChangeColor: '#888888',
    },
    lastValueMark: {
      show: true,
      text: {
        show: true,
        style: 'fill' as const,
        color: '#FFFFFF',
        size: 12,
        paddingLeft: 4,
        paddingTop: 4,
        paddingRight: 4,
        paddingBottom: 4,
        borderRadius: 2,
      },
    },
    tooltip: {
      showRule: 'always' as const,
      showType: 'standard' as const,
    },
  },
  xAxis: {
    show: true,
    axisLine: {
      show: true,
      color: '#374151',
      size: 1,
    },
    tickText: {
      show: true,
      color: '#9CA3AF',
      size: 12,
      marginStart: 4,
      marginEnd: 4,
    },
    tickLine: {
      show: true,
      size: 1,
      length: 3,
      color: '#374151',
    },
  },
  yAxis: {
    show: true,
    axisLine: {
      show: true,
      color: '#374151',
      size: 1,
    },
    tickText: {
      show: true,
      color: '#9CA3AF',
      size: 12,
      marginStart: 4,
      marginEnd: 4,
    },
    tickLine: {
      show: true,
      size: 1,
      length: 3,
      color: '#374151',
    },
  },
  separator: {
    size: 1,
    color: '#374151',
    fill: true,
    activeBackgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  crosshair: {
    show: true,
    horizontal: {
      show: true,
      line: {
        show: true,
        style: 'dashed' as const,
        dashedValue: [4, 2],
        size: 1,
        color: '#F97316',
      },
      text: {
        show: true,
        style: 'fill' as const,
        color: '#FFFFFF',
        size: 12,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 2,
        backgroundColor: '#F97316',
      },
    },
    vertical: {
      show: true,
      line: {
        show: true,
        style: 'dashed' as const,
        dashedValue: [4, 2],
        size: 1,
        color: '#F97316',
      },
      text: {
        show: true,
        style: 'fill' as const,
        color: '#FFFFFF',
        size: 12,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 2,
        backgroundColor: '#F97316',
      },
    },
  },
  overlay: {
    point: {
      color: '#F97316',
      borderColor: 'rgba(249, 115, 22, 0.35)',
      borderSize: 1,
      radius: 5,
      activeColor: '#F97316',
      activeBorderColor: 'rgba(249, 115, 22, 0.35)',
      activeBorderSize: 3,
      activeRadius: 5,
    },
    line: {
      style: 'solid' as const,
      color: '#F97316',
      size: 1,
    },
    text: {
      style: 'fill' as const,
      color: '#FFFFFF',
      size: 12,
      backgroundColor: '#F97316',
      borderRadius: 2,
      paddingLeft: 4,
      paddingRight: 4,
      paddingTop: 2,
      paddingBottom: 2,
    },
  },
};

// ============================================================================
// Strategy Line Colors
// ============================================================================

export const STRATEGY_COLORS = {
  entry: '#3B82F6',  // Blue
  takeProfit: '#22C55E',  // Green
  stopLoss: '#EF4444',  // Red
};

// ============================================================================
// Local Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  chartIndicators: 'chartIndicators',
  showNewsMarkers: 'showNewsMarkers',
  showStrategy: 'showStrategy',
};
