/**
 * KLineChart Types and Interfaces
 * 
 * Type definitions for the KLineChart trading chart component.
 * Preserves compatibility with existing data structures while adapting to KLineChart's API.
 */

import type { Chart, Indicator, Overlay } from 'klinecharts';
import type { SymbolMetadata } from '@/services/symbolsService';
import type { StrategyRecord } from '@/types/strategy';

// ============================================================================
// Component Props
// ============================================================================

export interface EnhancedTradingChartProps {
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  activeStrategies?: StrategyRecord[];
  // Dynamic symbol switching
  availableSymbols?: string[];
  symbolMetadata?: Record<string, SymbolMetadata>;
  onSymbolChange?: (symbol: string) => void;
}

// ============================================================================
// Data Types
// ============================================================================

/** Raw candle data from API (original format) */
export interface ApiCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** KLineChart data format (millisecond timestamps) */
export interface KLineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  turnover?: number;
}

/** Strategy data from API */
export interface StrategyData {
  name: string;
  direction: 'long' | 'short';
  entry_price?: number;
  take_profit?: number;
  stop_loss?: number;
  confidence?: number;
}

/** News marker data from API */
export interface NewsMarker {
  id?: string;
  time: string;
  headline: string;
  full_headline?: string;
  summary?: string;
  ai_analysis_summary?: string;
  forexfactory_url?: string | null;
  importance: number;
  sentiment?: number;
  impact?: 'bullish' | 'bearish' | 'neutral';
  volatility?: string;
  instruments?: string[];
  breaking?: boolean;
  category?: string;
  color?: string;
  shape?: string;
}

/** Aggregated news for chart overlay (grouped by candle) */
export interface AggregatedNewsMarker {
  timestamp: number;         // Candle timestamp (aligned to timeframe)
  events: NewsMarker[];      // All news events in this candle
  maxImportance: number;     // Highest importance in the group
  color: string;             // Color based on highest importance
  count: number;             // Number of events
  bucketDurationMs: number;  // Active bucket size used for this aggregation
}

/** Market status */
export interface MarketStatus {
  open: boolean;
  reason: string;
}

// ============================================================================
// Indicator Types
// ============================================================================

export type IndicatorCategory = 'overlay' | 'oscillator';

export interface IndicatorConfig {
  id: string;
  name: string;
  klineIndicator: string; // KLineChart indicator name (e.g., 'MA', 'EMA', 'RSI')
  category: IndicatorCategory;
  enabled: boolean;
  params: Record<string, number | number[]>;
  colors: string[];
  paneId?: string; // For oscillators, stores the created pane ID
}

// ============================================================================
// Timeframe Types
// ============================================================================

export interface TimeframeConfig {
  value: string;      // Internal value (e.g., 'M1', 'H1')
  label: string;      // Display label
  seconds: number;    // Duration in seconds
  periodSpan: number; // KLineChart period span
  periodType: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

// ============================================================================
// Chart State Types
// ============================================================================

export interface ChartState {
  loading: boolean;
  error: string | null;
  isLoadingMore: boolean;
  marketStatus: MarketStatus | null;
}

export interface ChartRefs {
  chart: Chart | null;
  indicatorPaneIds: Map<string, string>;
  overlayIds: Map<string, string>;
}

// ============================================================================
// Data Loader Types (KLineChart specific)
// ============================================================================

export interface DataLoaderParams {
  symbol: { ticker: string };
  period: { span: number; type: string };
  from: number;
  to: number;
  firstDataTimestamp: number | null;
  callback: (data: KLineData[], options?: { more: boolean }) => void;
}

export interface SubscribeBarParams {
  symbol: { ticker: string };
  period: { span: number; type: string };
}

// ============================================================================
// Overlay Types for Strategy Lines
// ============================================================================

export interface StrategyLineConfig {
  key: string;
  value: number;
  color: string;
  label: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface ChartClickEvent {
  x: number;
  y: number;
  dataIndex: number;
  kLineData: KLineData | null;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Converts API candle to KLineChart format */
export type CandleConverter = (candle: ApiCandle) => KLineData;

/** Indicator toggle handler */
export type IndicatorToggleHandler = (indicatorId: string) => void;

/** Timeframe change handler */
export type TimeframeChangeHandler = (timeframe: string) => void;
