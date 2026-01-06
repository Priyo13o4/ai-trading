/**
 * useNewsOverlay Hook
 * 
 * Manages news markers overlay on the trading chart.
 * Features:
 * - Fetches news data from API
 * - Aggregates news events by candle timestamp based on timeframe
 * - Renders news icons on chart
 * - Handles click to show news popup
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import type { Chart } from 'klinecharts';
import apiService from '@/services/api';
import type { NewsMarker, AggregatedNewsMarker } from './types';
import { TIMEFRAMES } from './constants';

interface UseNewsOverlayOptions {
  chartRef: React.MutableRefObject<Chart | null>;
  symbol: string;
  timeframe: string;
  enabled: boolean;
  onNewsClick?: (events: NewsMarker[], position: { x: number; y: number }) => void;
}

interface UseNewsOverlayReturn {
  newsMarkers: AggregatedNewsMarker[];
  isLoading: boolean;
  error: string | null;
  fetchNews: () => Promise<void>;
  clearNews: () => void;
  renderNewsOverlay: () => void;
  removeNewsOverlay: () => void;
}

// News overlay ID prefix
const NEWS_OVERLAY_PREFIX = 'news_marker_';

/**
 * Get importance color
 */
const getImportanceColor = (importance: number): string => {
  if (importance >= 5) return '#DC2626'; // Very High - Bright Red
  if (importance >= 4) return '#EF4444'; // High - Red
  if (importance >= 3) return '#F97316'; // Medium - Orange
  if (importance >= 2) return '#EAB308'; // Low-Medium - Yellow
  return '#64748B'; // Low - Gray
};

/**
 * Get candle duration in milliseconds for a timeframe
 */
const getTimeframeDurationMs = (timeframe: string): number => {
  const tf = TIMEFRAMES.find(t => t.value === timeframe);
  return tf ? tf.seconds * 1000 : 60000; // Default to 1 minute
};

/**
 * Align timestamp to candle boundary
 */
const alignToCandle = (timestamp: number, durationMs: number): number => {
  return Math.floor(timestamp / durationMs) * durationMs;
};

/**
 * Determine if timeframe is "large" (aggregation mode)
 */
const isLargeTimeframe = (timeframe: string): boolean => {
  const largeTFs = ['H1', 'H4', 'D1', 'W1', 'MN1'];
  return largeTFs.includes(timeframe);
};

export const useNewsOverlay = ({
  chartRef,
  symbol,
  timeframe,
  enabled,
  onNewsClick,
}: UseNewsOverlayOptions): UseNewsOverlayReturn => {
  const [newsMarkers, setNewsMarkers] = useState<AggregatedNewsMarker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayIdsRef = useRef<string[]>([]);
  const rawNewsRef = useRef<NewsMarker[]>([]);

  /**
   * Fetch news markers from API
   */
  const fetchNews = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Calculate hours based on timeframe (more for larger timeframes)
      const hoursMap: Record<string, number> = {
        'M1': 24,      // 1 day
        'M5': 72,      // 3 days
        'M15': 168,    // 1 week
        'M30': 336,    // 2 weeks
        'H1': 720,     // 1 month
        'H4': 2160,    // 3 months
        'D1': 8760,    // 1 year
        'W1': 8760,    // 1 year
        'MN1': 8760,   // 1 year
      };
      const hours = hoursMap[timeframe] || 168;

      const response = await apiService.getNewsMarkers(symbol, hours, 2); // min importance 2

      if (response.error) {
        throw new Error(response.error);
      }

      // API returns { markers: [...] } inside data
      const responseData = response.data as { markers?: NewsMarker[] } | undefined;
      const markers: NewsMarker[] = responseData?.markers || [];
      rawNewsRef.current = markers;

      // Aggregate by candle timestamp
      const aggregated = aggregateNewsByCandle(markers, timeframe);
      setNewsMarkers(aggregated);

      console.log(`[NewsOverlay] Fetched ${markers.length} news events, aggregated to ${aggregated.length} markers`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch news';
      setError(message);
      console.error('[NewsOverlay] Error fetching news:', err);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, enabled]);

  /**
   * Aggregate news events by candle timestamp
   */
  const aggregateNewsByCandle = useCallback((markers: NewsMarker[], tf: string): AggregatedNewsMarker[] => {
    const durationMs = getTimeframeDurationMs(tf);
    const grouped = new Map<number, NewsMarker[]>();

    markers.forEach(marker => {
      const eventTime = new Date(marker.time).getTime();
      const candleTime = alignToCandle(eventTime, durationMs);

      if (!grouped.has(candleTime)) {
        grouped.set(candleTime, []);
      }
      grouped.get(candleTime)!.push(marker);
    });

    // Convert to array and sort by importance within each group
    const aggregated: AggregatedNewsMarker[] = [];

    grouped.forEach((events, timestamp) => {
      // Sort events by importance (highest first)
      events.sort((a, b) => (b.importance || 0) - (a.importance || 0));

      const maxImportance = Math.max(...events.map(e => e.importance || 0));

      aggregated.push({
        timestamp,
        events,
        maxImportance,
        color: getImportanceColor(maxImportance),
        count: events.length,
      });
    });

    // Sort by timestamp (newest first)
    return aggregated.sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  /**
   * Clear news markers
   */
  const clearNews = useCallback(() => {
    setNewsMarkers([]);
    rawNewsRef.current = [];
    removeNewsOverlay();
  }, []);

  /**
   * Remove news overlays from chart
   */
  const removeNewsOverlay = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    overlayIdsRef.current.forEach(id => {
      try {
        chart.removeOverlay({ id });
      } catch (e) {
        // Ignore removal errors
      }
    });
    overlayIdsRef.current = [];
  }, [chartRef]);

  /**
   * Render news markers as chart overlays
   */
  const renderNewsOverlay = useCallback(() => {
    const chart = chartRef.current;
    if (!chart || newsMarkers.length === 0) return;

    // First remove existing overlays
    removeNewsOverlay();

    const largeTimeframe = isLargeTimeframe(timeframe);

    newsMarkers.forEach((marker, index) => {
      const overlayId = `${NEWS_OVERLAY_PREFIX}${marker.timestamp}`;

      try {
        // Create a custom overlay for each news marker
        chart.createOverlay({
          name: 'newsMarker',
          id: overlayId,
          points: [{ timestamp: marker.timestamp }],
          extendData: {
            events: marker.events,
            count: marker.count,
            maxImportance: marker.maxImportance,
            color: marker.color,
            isLargeTimeframe: largeTimeframe,
            onNewsClick,
          },
          styles: {
            point: {
              color: marker.color,
            },
          },
        });

        overlayIdsRef.current.push(overlayId);
      } catch (e) {
        console.warn(`[NewsOverlay] Failed to create overlay for timestamp ${marker.timestamp}:`, e);
      }
    });

    console.log(`[NewsOverlay] Rendered ${overlayIdsRef.current.length} news markers`);
  }, [chartRef, newsMarkers, timeframe, removeNewsOverlay, onNewsClick]);

  // Refetch when symbol/timeframe/enabled changes
  useEffect(() => {
    if (enabled) {
      fetchNews();
    } else {
      clearNews();
    }
  }, [symbol, timeframe, enabled]);

  // Render overlays when markers change
  useEffect(() => {
    if (enabled && newsMarkers.length > 0) {
      // Small delay to ensure chart is ready
      const timer = setTimeout(() => {
        renderNewsOverlay();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [newsMarkers, enabled, renderNewsOverlay]);

  return {
    newsMarkers,
    isLoading,
    error,
    fetchNews,
    clearNews,
    renderNewsOverlay,
    removeNewsOverlay,
  };
};

export default useNewsOverlay;
