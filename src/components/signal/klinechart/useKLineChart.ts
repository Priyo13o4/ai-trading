/**
 * useKLineChart Hook
 * 
 * Custom hook for managing KLineChart instance lifecycle and operations.
 * Handles chart initialization, data loading, indicators, and real-time updates.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { init, dispose, Chart } from 'klinecharts';
import apiService from '@/services/api';
import sseService from '@/services/sseService';
import type { 
  KLineData, 
  IndicatorConfig, 
  StrategyData, 
  ChartState,
  ApiCandle 
} from './types';
import { 
  DARK_CHART_STYLES, 
  getDataLimit,
  STORAGE_KEYS 
} from './constants';
import { 
  convertCandlesToKLine, 
  mergeKLineData,
  timeframeToPeriod,
  getOldestTimestamp,
  sortKLineDataDesc,
  getPrecisionForSymbol
} from './utils';
import { initCustomOverlays } from './customOverlays';

interface UseKLineChartOptions {
  containerId: string;
  symbol: string;
  timeframe: string;
  onError?: (error: string) => void;
}

interface UseKLineChartReturn {
  chartRef: React.MutableRefObject<Chart | null>;
  state: ChartState;
  dataRef: React.MutableRefObject<KLineData[]>;
  
  // Actions
  initChart: () => void;
  destroyChart: () => void;
  loadData: () => Promise<void>;
  loadMoreData: () => Promise<void>;
  updateRealtimeBar: (bar: KLineData) => void;
  
  // Indicator management
  createIndicator: (config: IndicatorConfig) => string | null;
  removeIndicator: (indicatorId: string, paneId?: string) => void;
  
  // Overlay management
  createStrategyOverlay: (key: string, value: number, color: string, label: string) => string | null;
  removeOverlay: (overlayId: string) => void;
  
  // Utilities
  scrollToRealTime: () => void;
  resize: () => void;
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toTimestampMs = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }

  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }

    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeSymbol = (value: unknown): string => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';
  const compact = raw.replace(/[^A-Z0-9]/g, '');
  if (compact === 'GOLD') return 'XAUUSD';
  if (compact === 'XAUUSD') return 'XAUUSD';
  return compact;
};

const normalizeTimeframe = (value: unknown): string => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';

  const aliases: Record<string, string> = {
    '1M': 'M1',
    '5M': 'M5',
    '15M': 'M15',
    '30M': 'M30',
    '60M': 'H1',
    '240M': 'H4',
    '1H': 'H1',
    '4H': 'H4',
    '1D': 'D1',
    '1W': 'W1',
  };

  return aliases[raw] || raw;
};

const parseRealtimeCandleBar = (
  payload: unknown,
  expectedSymbol: string,
  expectedTimeframe: string
): KLineData | null => {
  const record = asRecord(payload);
  if (!record) return null;
  if (record.type !== 'candle_update') return null;
  if (normalizeSymbol(record.symbol) !== normalizeSymbol(expectedSymbol)) return null;
  if (normalizeTimeframe(record.timeframe) !== normalizeTimeframe(expectedTimeframe)) return null;

  const candle = asRecord(record.candle);
  if (!candle) return null;

  const timestamp = toTimestampMs(candle.time);
  const open = toFiniteNumber(candle.open);
  const high = toFiniteNumber(candle.high);
  const low = toFiniteNumber(candle.low);
  const close = toFiniteNumber(candle.close);
  const volume = toFiniteNumber(candle.volume) ?? 0;

  if (
    timestamp === null ||
    open === null ||
    high === null ||
    low === null ||
    close === null
  ) {
    return null;
  }

  return {
    timestamp,
    open,
    high,
    low,
    close,
    volume,
  };
};

export const useKLineChart = ({
  containerId,
  symbol,
  timeframe,
  onError,
}: UseKLineChartOptions): UseKLineChartReturn => {
  // Log hook initialization
  console.log('[KLineChart Hook] Initializing with symbol=' + symbol + ', timeframe=' + timeframe + ', container=' + containerId);
  
  const chartRef = useRef<Chart | null>(null);
  const dataRef = useRef<KLineData[]>([]);
  const indicatorPaneIdsRef = useRef<Map<string, string>>(new Map());
  const overlayIdsRef = useRef<Map<string, string>>(new Map());
  const oldestTimestampRef = useRef<number | null>(null);
  const hasScrolledToLatestRef = useRef(false);
  const lastInitTimestampRef = useRef<number | null>(null);
  const isLoadingMoreRef = useRef(false);
  const sseUnsubscribeRef = useRef<(() => void) | null>(null);
  
  const [state, setState] = useState<ChartState>({
    loading: false,
    error: null,
    isLoadingMore: false,
    marketStatus: null,
  });

  /**
   * Initialize the KLineChart instance
   */
  const initChart = useCallback(() => {
    const container = document.getElementById(containerId);
    if (!container || chartRef.current) return;

    // Register custom overlays before chart init
    initCustomOverlays();

    try {
      const chart = init(containerId, {
        styles: DARK_CHART_STYLES,
        locale: 'en-US',
        timezone: 'UTC',
      });

      if (chart) {
        chartRef.current = chart;

        // Get precision for this symbol
        const pricePrecision = getPrecisionForSymbol(symbol);
        
        // Set up data loader for lazy loading
        chart.setDataLoader({
          /**
           * getBars is called when:
           * 1. Symbol/period changes (type: 'init')
           * 2. User scrolls to chart boundary (type: 'backward' or 'forward')
           */
          getBars: async ({ type, timestamp, callback }) => {
            console.log('[KLineChart getBars] Called with type=' + type + ', timestamp=' + (timestamp ? new Date(timestamp).toISOString() : 'null') + ', dataRefLength=' + dataRef.current.length);
            
            // Initial load
            if (type === 'init' || dataRef.current.length === 0) {
              console.log('[KLineChart getBars] Triggering INITIAL load');
              await loadInitialData(callback);
            } else if (type === 'forward') {
              // Load more historical data (scrolling left / older data)
              const oldestInMemory = dataRef.current.length > 0 ? dataRef.current[0].timestamp : timestamp || Date.now();
              const boundary = timestamp ? Math.min(timestamp, oldestInMemory) : oldestInMemory;
              console.log('[KLineChart getBars] Triggering FORWARD load (lazy loading historical)');
              console.log('[KLineChart getBars] KLineChart boundary timestamp=' + new Date(boundary).toISOString());
              console.log('[KLineChart getBars] dataRef: oldest=' + new Date(dataRef.current[0].timestamp).toISOString() + ', newest=' + new Date(dataRef.current[dataRef.current.length - 1].timestamp).toISOString());
              await loadMoreDataInternal(boundary, callback);
            } else if (type === 'backward') {
              // No future data to load
              console.log('[KLineChart getBars] BACKWARD (future) load requested - returning empty');
              callback([], { backward: false, forward: false });
            } else {
              // Unknown type or missing timestamp
              console.log('[KLineChart getBars] Unknown type or missing data, returning empty');
              callback([], { backward: false, forward: false });
            }
          },
          
          /**
           * subscribeBar is called after getBars completes
           * Set up real-time data subscription here
           */
          subscribeBar: ({ callback }) => {
            subscribeToRealtime(callback);
            
            // Scroll to latest data after initial load completes
            setTimeout(() => {
              if (chart && dataRef.current.length > 0) {
                console.log('[KLineChart] Auto-scrolling to latest bar after initial load');
                chart.scrollToRealTime();
              }
            }, 200);
          },
          
          /**
           * unsubscribeBar is called when symbol/period changes
           */
          unsubscribeBar: () => {
            unsubscribeFromRealtime();
          },
        });

        // Set symbol with precision to trigger data loading
        // KLineChart v10 uses pricePrecision and volumePrecision in SymbolInfo
        chart.setSymbol({ 
          ticker: symbol, 
          pricePrecision: pricePrecision, 
          volumePrecision: 0 
        });
        const period = timeframeToPeriod(timeframe);
        chart.setPeriod(period as import('klinecharts').Period);
      }
    } catch (err) {
      console.error('Failed to initialize chart:', err);
      onError?.('Failed to initialize chart');
    }
  }, [containerId, symbol, timeframe, onError]);

  /**
   * Load initial historical data
   */
  const loadInitialData = async (
    callback: (data: KLineData[], more?: import('klinecharts').DataLoadMore) => void
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const limit = getDataLimit(timeframe);
      console.log(`[KLineChart] Loading initial data: symbol=${symbol}, timeframe=${timeframe}, limit=${limit}`);
      const response = await apiService.getHistoricalData(symbol, timeframe, limit);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.candles && response.data.candles.length > 0) {
        // Log raw API response to verify backend ordering
        console.log('[KLineChart] RAW API response (first 3):', response.data.candles.slice(0, 3).map(c => c.time));
        console.log('[KLineChart] RAW API response (last 3):', response.data.candles.slice(-3).map(c => c.time));
        
        // API now returns data in DESC order (newest first)
        const klineData = convertCandlesToKLine(response.data.candles);
        
        // Verify data is sorted descending
        const isDesc = klineData.every((bar, i) => 
          i === 0 || bar.timestamp <= klineData[i - 1].timestamp
        );
        console.log(`[KLineChart] Initial data loaded: ${klineData.length} bars, sorted desc=${isDesc}`);
        console.log(`[KLineChart] First bar:`, new Date(klineData[0].timestamp).toISOString());
        console.log(`[KLineChart] Last bar:`, new Date(klineData[klineData.length - 1].timestamp).toISOString());
        
        if (!isDesc) {
          console.error('[KLineChart] WARNING: Initial data is NOT sorted descending!', klineData.slice(0, 10));
        }
        
        // klineData is DESC from API (newest first)
        // KLineChart displays index 0 on LEFT side of timeline
        // Therefore we need ASC (oldest first) so timeline flows left→right correctly
        const ascData = [...klineData].reverse();
        dataRef.current = ascData; // Store ASC
        oldestTimestampRef.current = ascData[0]?.timestamp || null; // ASC: [0]=oldest
        lastInitTimestampRef.current = ascData[ascData.length - 1]?.timestamp || null; // ASC: [last]=newest
        
        console.log('[KLineChart] Converted to ASC for chart (oldest first)');
        console.log('[KLineChart] Array[0] (oldest, LEFT side):', new Date(ascData[0].timestamp).toISOString());
        console.log('[KLineChart] Array[last] (newest, RIGHT side):', new Date(ascData[ascData.length - 1].timestamp).toISOString());
        
        // Return ASC to KLineChart (oldest→newest) for left→right display
        console.log('[KLineChart] Initial callback to chart with ASC data. Flags: forward=true, backward=false');
        callback(ascData, { forward: true, backward: false });

      } else {
        setState(prev => ({ ...prev, error: 'No historical data available' }));
        callback([], false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch chart data';
      console.error('[KLineChart] Error loading initial data:', errorMsg);
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
      callback([], false);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Load more historical data (lazy loading)
   * Called when user scrolls to the left boundary
   */
  const loadMoreDataInternal = async (
    beforeTimestamp: number,
    callback: (data: KLineData[], more?: import('klinecharts').DataLoadMore) => void
  ) => {
    if (isLoadingMoreRef.current) {
      console.log('[KLineChart] Skipping loadMoreDataInternal because a load is already in progress');
      callback([], { forward: true, backward: false });
      return;
    }

    isLoadingMoreRef.current = true;
    setState(prev => ({ ...prev, isLoadingMore: true }));

    console.log(`[KLineChart] Loading more data before timestamp:`, new Date(beforeTimestamp).toISOString());
    console.log(`[KLineChart] Current data range in memory:`, {
      oldest: new Date(dataRef.current[0].timestamp).toISOString(),
      newest: new Date(dataRef.current[dataRef.current.length - 1].timestamp).toISOString(),
      count: dataRef.current.length
    });

    try {
      const limit = getDataLimit(timeframe);
      // Convert milliseconds to seconds for API
      const beforeSeconds = Math.floor(beforeTimestamp / 1000);
      
      console.log(`[KLineChart] Requesting from API: symbol=${symbol}, timeframe=${timeframe}, limit=${limit}, beforeSeconds=${beforeSeconds} (${new Date(beforeSeconds * 1000).toISOString()})`);
      
      const response = await apiService.getHistoricalData(
        symbol, 
        timeframe, 
        limit, 
        beforeSeconds
      );
      
      if (response.error) {
        console.error('[KLineChart] Error loading more data:', response.error);
        callback([], false);
        return;
      }

      if (response.data?.candles && response.data.candles.length > 0) {
        // API returns data in DESC order (newest first)
        const newKlineData = convertCandlesToKLine(response.data.candles);

        // Drop any data that is newer/equal to our last init newest to avoid duplicate overlapping segments
        const filteredNew = lastInitTimestampRef.current
          ? newKlineData.filter(bar => bar.timestamp < lastInitTimestampRef.current!)
          : newKlineData;
        
        if (filteredNew.length === 0) {
          console.log('[KLineChart] No older data after filtering overlap');
          callback([], { backward: false, forward: false });
          return;
        }
        
        console.log(`[KLineChart] Loaded ${filteredNew.length} more bars`);
        console.log(`[KLineChart] New data DESC:`, {
          first: new Date(filteredNew[0].timestamp).toISOString(),
          last: new Date(filteredNew[filteredNew.length - 1].timestamp).toISOString()
        });
        
        // Convert DESC to ASC for display
        const ascFiltered = [...filteredNew].reverse();
        console.log(`[KLineChart] Converted to ASC:`, {
          first: new Date(ascFiltered[0].timestamp).toISOString(),
          last: new Date(ascFiltered[ascFiltered.length - 1].timestamp).toISOString()
        });
        
        // Merge: dataRef is ASC [old...new], ascFiltered is ASC [even-older...older]
        // Prepend older data: [even-older...older] + [old...new] = [even-older...new]
        const beforeMergeLength = dataRef.current.length;
        dataRef.current = [...ascFiltered, ...dataRef.current];
        oldestTimestampRef.current = dataRef.current[0]?.timestamp || null; // ASC: [0]=oldest
        
        console.log(`[KLineChart] After merge: ${beforeMergeLength} → ${dataRef.current.length} bars`);
        console.log(`[KLineChart] Returning ASC to chart:`, {
          first: new Date(ascFiltered[0].timestamp).toISOString(),
          last: new Date(ascFiltered[ascFiltered.length - 1].timestamp).toISOString()
        });
        
        const hasMore = filteredNew.length >= limit * 0.9;
        console.log(`[KLineChart] Callback to chart (ASC) with more flags: forward=${hasMore}, backward=false`);
        callback(ascFiltered, { forward: hasMore, backward: false });
      } else {
        console.log('[KLineChart] No more historical data available');
        // No more historical data
        callback([], { forward: false, backward: false });
      }
    } catch (error) {
      console.error('[KLineChart] Error loading more data:', error);
      callback([], { forward: false, backward: false });
    } finally {
      isLoadingMoreRef.current = false;
      setState(prev => ({ ...prev, isLoadingMore: false }));
    }
  };

  /**
   * Subscribe to real-time updates via SSE
   */
  const subscribeToRealtime = useCallback((klineCallback?: (data: KLineData) => void) => {
    if (sseUnsubscribeRef.current) {
      sseUnsubscribeRef.current();
    }

    console.log(`[KLineChart] Subscribing to real-time updates: symbol=${symbol}, timeframe=${timeframe}, hasCallback=${!!klineCallback}`);

    const unsubscribe = sseService.subscribeToSignalMuxCandleUpdates(
      symbol,
      timeframe,
      (data) => {
        const newBar = parseRealtimeCandleBar(data, symbol, timeframe);
        if (newBar) {
          
          // Validate timestamp is not in the past
          const lastBar = dataRef.current[dataRef.current.length - 1];
          
          console.log(`[KLineChart] Real-time bar received:`, {
            timestamp: new Date(newBar.timestamp).toISOString(),
            close: newBar.close,
            lastBarTime: lastBar ? new Date(lastBar.timestamp).toISOString() : 'none',
            isNewer: !lastBar || newBar.timestamp >= lastBar.timestamp,
            dataRefLength: dataRef.current.length,
            hasCallback: !!klineCallback
          });
          
          if (lastBar && newBar.timestamp < lastBar.timestamp) {
            console.warn('[KLineChart] WARNING: REJECTING out-of-order real-time bar:', {
              newBar: new Date(newBar.timestamp).toISOString(),
              lastBar: new Date(lastBar.timestamp).toISOString(),
              diff: (lastBar.timestamp - newBar.timestamp) / 1000 + ' seconds'
            });
            return;
          }
          
          // Update local data reference
          if (lastBar && lastBar.timestamp === newBar.timestamp) {
            // Update existing bar
            console.log('[KLineChart] Updating existing bar');
            dataRef.current[dataRef.current.length - 1] = newBar;
          } else if (!lastBar || newBar.timestamp > lastBar.timestamp) {
            // Add new bar
            console.log('[KLineChart] Adding new bar to dataRef');
            dataRef.current.push(newBar);
          }
          
          // ALWAYS call the callback if it exists - this updates the chart
          if (klineCallback) {
            console.log('[KLineChart] ✅ Calling KLineChart callback with new bar');
            try {
              klineCallback(newBar);
            } catch (error) {
              console.error('[KLineChart] ERROR calling callback:', error);
            }
          } else {
            console.error('[KLineChart] ❌ CRITICAL: No KLineChart callback provided! Chart will NOT update!');
          }
        }
      },
      (error) => console.error('[KLineChart] SSE error:', error)
    );

    sseUnsubscribeRef.current = unsubscribe;
  }, [symbol, timeframe]);

  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribeFromRealtime = useCallback(() => {
    if (sseUnsubscribeRef.current) {
      sseUnsubscribeRef.current();
      sseUnsubscribeRef.current = null;
    }
  }, []);

  /**
   * Update chart with real-time bar data
   * KLineChart handles this internally when using setDataLoader
   */
  const updateRealtimeBar = useCallback((bar: KLineData) => {
    if (!chartRef.current) return;
    
    // Update local data reference
    const lastBar = dataRef.current[dataRef.current.length - 1];
    if (lastBar && lastBar.timestamp === bar.timestamp) {
      // Update existing bar
      dataRef.current[dataRef.current.length - 1] = bar;
    } else if (!lastBar || bar.timestamp > lastBar.timestamp) {
      // Add new bar only if it's newer than the last bar
      dataRef.current.push(bar);
    } else {
      // If bar is older than last bar, it's out of order - ignore it
      console.warn('Received out-of-order bar, ignoring:', bar);
      return;
    }
    
    // Note: KLineChart's subscribeBar callback handles the update automatically
    // We don't need to call resetData() or applyNewData() manually
  }, []);

  /**
   * Load data - public method for manual data loading
   */
  const loadData = useCallback(async () => {
    if (!chartRef.current) {
      console.warn('[KLineChart loadData] Called but chart not initialized');
      return;
    }
    
    console.log('[KLineChart loadData] RESETTING chart data for symbol=' + symbol + ', timeframe=' + timeframe);
    
    // Reset data and trigger reload via setSymbol/setPeriod
    dataRef.current = [];
    oldestTimestampRef.current = null;
    
    chartRef.current.setSymbol({ ticker: symbol });
    const period = timeframeToPeriod(timeframe);
    chartRef.current.setPeriod(period as import('klinecharts').Period);
    hasScrolledToLatestRef.current = false;
    
    console.log('[KLineChart loadData] Chart will reload via getBars callback');
  }, [symbol, timeframe]);

  /**
   * Load more data - public method for manual lazy loading
   */
  const loadMoreData = useCallback(async () => {
    if (!chartRef.current || !oldestTimestampRef.current || isLoadingMoreRef.current) return;
    
    // Scroll to trigger lazy loading
    chartRef.current.scrollToTimestamp(oldestTimestampRef.current);
  }, []);

  /**
   * Create an indicator on the chart
   */
  const createIndicator = useCallback((config: IndicatorConfig): string | null => {
    if (!chartRef.current) return null;

    try {
      const indicatorConfig: { name: string; calcParams: unknown[] } = {
        name: config.klineIndicator,
        calcParams: config.params.calcParams as unknown[],
      };

      if (config.category === 'overlay') {
        // Add to main candle pane
        const id = chartRef.current.createIndicator(indicatorConfig, true, { 
          id: 'candle_pane' 
        });
        if (id) {
          indicatorPaneIdsRef.current.set(config.id, 'candle_pane');
        }
        return id;
      } else {
        // Create in new pane (oscillator)
        const id = chartRef.current.createIndicator(indicatorConfig, false, {
          height: config.id === 'atr' ? 80 : 100,
        });
        if (id) {
          indicatorPaneIdsRef.current.set(config.id, id);
        }
        return id;
      }
    } catch (err) {
      console.error(`Failed to create indicator ${config.name}:`, err);
      return null;
    }
  }, []);

  /**
   * Remove an indicator from the chart
   */
  const removeIndicator = useCallback((indicatorId: string, paneId?: string) => {
    if (!chartRef.current) return;

    const storedPaneId = indicatorPaneIdsRef.current.get(indicatorId) || paneId;
    
    try {
      // For oscillators (separate panes), remove the entire pane
      if (storedPaneId && storedPaneId !== 'candle_pane') {
        chartRef.current.removeIndicator({ paneId: storedPaneId });
      } else {
        // For overlays on candle_pane, we need to find and remove by the indicator's chart ID
        // KLineChart stores indicators with auto-generated IDs, remove by pane
        const indicators = chartRef.current.getIndicators({ paneId: 'candle_pane' });
        // Find the indicator that matches our ID pattern (we look for unique calcParams)
        // Since we can't easily match, we'll remove all indicators on the pane and recreate the ones we want to keep
        // This is handled by the indicator manager's sync function
        chartRef.current.removeIndicator({ paneId: 'candle_pane' });
      }
      indicatorPaneIdsRef.current.delete(indicatorId);
    } catch (err) {
      console.error(`Failed to remove indicator ${indicatorId}:`, err);
    }
  }, []);

  /**
   * Create a strategy overlay (price line)
   */
  const createStrategyOverlay = useCallback((
    key: string, 
    value: number, 
    color: string, 
    label: string
  ): string | null => {
    if (!chartRef.current) return null;

    try {
      const overlayId = chartRef.current.createOverlay({
        name: 'priceLine',
        id: `strategy-${key}`,
        points: [{ value }],
        styles: {
          line: {
            style: 'dashed',
            dashedValue: [4, 4],
            color,
            size: 2,
          },
          text: {
            color: '#FFFFFF',
            backgroundColor: color,
            borderRadius: 2,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 2,
            paddingBottom: 2,
          },
        },
        extendData: label,
      });
      
      if (overlayId) {
        overlayIdsRef.current.set(key, typeof overlayId === 'string' ? overlayId : overlayId[0] || '');
      }
      
      return typeof overlayId === 'string' ? overlayId : null;
    } catch (err) {
      console.error(`Failed to create strategy overlay ${key}:`, err);
      return null;
    }
  }, []);

  /**
   * Remove an overlay from the chart
   */
  const removeOverlay = useCallback((overlayId: string) => {
    if (!chartRef.current) return;

    try {
      // KLineChart removeOverlay takes a filter object
      chartRef.current.removeOverlay({ id: overlayId });
      
      // Remove from our tracking
      for (const [key, id] of overlayIdsRef.current.entries()) {
        if (id === overlayId) {
          overlayIdsRef.current.delete(key);
          break;
        }
      }
    } catch (err) {
      console.error(`Failed to remove overlay ${overlayId}:`, err);
    }
  }, []);

  /**
   * Scroll to real-time (latest data)
   */
  const scrollToRealTime = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.scrollToRealTime();
    }
  }, []);

  /**
   * Resize chart to container
   */
  const resize = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resize();
    }
  }, []);

  // Handle container resizing with ResizeObserver
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    });
    
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerId]);

  /**
   * Destroy the chart instance
   */
  const destroyChart = useCallback(() => {
    unsubscribeFromRealtime();
    
    if (chartRef.current) {
      dispose(containerId);
      chartRef.current = null;
    }
    
    dataRef.current = [];
    indicatorPaneIdsRef.current.clear();
    overlayIdsRef.current.clear();
    oldestTimestampRef.current = null;
    hasScrolledToLatestRef.current = false;
  }, [containerId, unsubscribeFromRealtime]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      destroyChart();
    };
  }, [destroyChart]);

  // Keep price precision in sync when symbol changes
  // KLineChart v10 uses setSymbol with pricePrecision and volumePrecision
  useEffect(() => {
    if (!chartRef.current) return;
    const pricePrecision = getPrecisionForSymbol(symbol);
    const chart = chartRef.current;
    // Update symbol with new precision (this will also re-trigger data load)
    chart.setSymbol({ 
      ticker: symbol, 
      pricePrecision: pricePrecision, 
      volumePrecision: 0 
    });
  }, [symbol]);

  return {
    chartRef,
    state,
    dataRef,
    initChart,
    destroyChart,
    loadData,
    loadMoreData,
    updateRealtimeBar,
    createIndicator,
    removeIndicator,
    createStrategyOverlay,
    removeOverlay,
    scrollToRealTime,
    resize,
  };
};

export default useKLineChart;
