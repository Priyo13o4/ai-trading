/**
 * useNewsOverlay Hook
 * 
 * Manages news markers overlay on the trading chart.
 * Features:
 * - Subscribes to multiplexed SSE news stream
 * - Aggregates news events by candle timestamp based on timeframe
 * - Filters news by minimum importance before rendering
 * - Renders news icons on chart
 * - Handles click to show news popup
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import type { Chart } from 'klinecharts';
import sseService from '@/services/sseService';
import apiService from '@/services/api';
import { mapApiNewsItem } from '@/features/news/adapters';
import type { NewsMarker, AggregatedNewsMarker } from './types';
import { TIMEFRAMES } from './constants';
import { getSymbolAliases } from './symbolAliases';

interface UseNewsOverlayOptions {
  chartRef: React.MutableRefObject<Chart | null>;
  symbol: string;
  timeframe: string;
  enabled: boolean;
  minImportance: number;
  onNewsClick?: (events: NewsMarker[], position: { x: number; y: number }) => void;
}

interface UseNewsOverlayReturn {
  newsMarkers: AggregatedNewsMarker[];
  isLoading: boolean;
  error: string | null;
  clearNews: () => void;
  renderNewsOverlay: () => void;
  removeNewsOverlay: () => void;
}

// News overlay ID prefix
const NEWS_OVERLAY_PREFIX = 'news_marker_';
const BUCKET_LADDER_MS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  30 * 60_000,
  60 * 60_000,
  4 * 60 * 60_000,
  24 * 60 * 60_000,
  7 * 24 * 60 * 60_000,
  30 * 24 * 60 * 60_000,
];
const WEEK_MS = 7 * 24 * 60 * 60_000;
const MONTH_APPROX_MS = 30 * 24 * 60 * 60_000;
const MONDAY_ANCHOR_MS = Date.UTC(1970, 0, 5);
const MARKER_PAGE_CACHE_PREFIX = 'news-marker-page-cache:v1:';
const MARKER_DATASET_CACHE_PREFIX = 'news-marker-dataset-cache:v1:';
const MARKER_PAGE_CACHE_TTL_MS = 2 * 60_000;
const MARKER_DATASET_CACHE_TTL_MS = 5 * 60_000;
const MARKER_DATASET_REFRESH_MS = 75_000;
const MAX_BACKFILL_PAGES_PER_TICK = 8;
const MAX_MARKER_PAGE_MEMORY_ENTRIES = 180;
const MAX_MARKER_DATASET_MEMORY_ENTRIES = 32;
const MAX_RAW_NEWS_MARKERS = 6000;

const markerPageMemoryCache = new Map<string, CachedMarkerPagePayload>();
const markerPageInFlightRequests = new Map<string, Promise<MarkerPayload>>();
const markerDatasetMemoryCache = new Map<string, MarkerDatasetCacheEntry>();

interface CachedMarkerPagePayload {
  expiresAt: number;
  payload: MarkerPayload;
}

interface MarkerDatasetCacheEntry {
  updatedAt: number;
  expiresAt: number;
  markers: NewsMarker[];
  oldestLoadedTs: number | null;
  hasMore: boolean;
  nextBeforeCursor: string | null;
}

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
  if (tf) return tf.seconds * 1000;

  // Guard against aliases that may not exist in TIMEFRAMES constant but are selectable in UI.
  if (timeframe === 'MN1') return 30 * 24 * 60 * 60_000;
  if (timeframe === 'W1') return 7 * 24 * 60 * 60_000;
  if (timeframe === 'D1') return 24 * 60 * 60_000;
  return 60_000; // Default to 1 minute
};

/**
 * Align timestamp to candle boundary
 */
const alignToCandle = (timestamp: number, durationMs: number, timeframe?: string): number => {
  if (timeframe === 'W1' && durationMs % WEEK_MS === 0) {
    return Math.floor((timestamp - MONDAY_ANCHOR_MS) / durationMs) * durationMs + MONDAY_ANCHOR_MS;
  }

  if (timeframe === 'MN1') {
    const date = new Date(timestamp);
    if (durationMs <= MONTH_APPROX_MS) {
      return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
    }

    const bucketMonths = Math.max(1, Math.round(durationMs / MONTH_APPROX_MS));
    const monthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth();
    const groupedStart = Math.floor(monthIndex / bucketMonths) * bucketMonths;
    const year = Math.floor(groupedStart / 12);
    const month = groupedStart % 12;
    return Date.UTC(year, month, 1);
  }

  return Math.floor(timestamp / durationMs) * durationMs;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const isBrowserRuntime = (): boolean => typeof window !== 'undefined';

const readSessionCache = <T,>(key: string): T | null => {
  if (!isBrowserRuntime()) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeSessionCache = <T,>(key: string, value: T): void => {
  if (!isBrowserRuntime()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
};

const removeSessionCache = (key: string): void => {
  if (!isBrowserRuntime()) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
};

const pruneOldestMapEntries = <K, V>(map: Map<K, V>, maxEntries: number): void => {
  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value as K | undefined;
    if (typeof oldestKey === 'undefined') break;
    map.delete(oldestKey);
  }
};

const getMarkerPageCacheKey = (
  symbol: string,
  minImportance: number,
  hours: number,
  before: string | undefined,
  limit: number,
): string => `${symbol}|${minImportance}|${hours}|${before || 'first'}|${limit}`;

const getMarkerDatasetCacheKey = (symbol: string, minImportance: number): string =>
  `${symbol}|${minImportance}`;

const getCachedMarkerPage = (key: string): MarkerPayload | null => {
  const inMemory = markerPageMemoryCache.get(key);
  if (inMemory && inMemory.expiresAt > Date.now()) {
    return inMemory.payload;
  }
  if (inMemory) {
    markerPageMemoryCache.delete(key);
  }

  const sessionKey = `${MARKER_PAGE_CACHE_PREFIX}${key}`;
  const fromSession = readSessionCache<CachedMarkerPagePayload>(sessionKey);
  if (!fromSession || fromSession.expiresAt <= Date.now()) {
    removeSessionCache(sessionKey);
    return null;
  }

  markerPageMemoryCache.set(key, fromSession);
  return fromSession.payload;
};

const setCachedMarkerPage = (key: string, payload: MarkerPayload): void => {
  const wrapped: CachedMarkerPagePayload = {
    expiresAt: Date.now() + MARKER_PAGE_CACHE_TTL_MS,
    payload,
  };
  markerPageMemoryCache.set(key, wrapped);
  pruneOldestMapEntries(markerPageMemoryCache, MAX_MARKER_PAGE_MEMORY_ENTRIES);
  writeSessionCache(`${MARKER_PAGE_CACHE_PREFIX}${key}`, wrapped);
};

const getCachedMarkerDataset = (key: string): MarkerDatasetCacheEntry | null => {
  const inMemory = markerDatasetMemoryCache.get(key);
  if (inMemory && inMemory.expiresAt > Date.now()) {
    return inMemory;
  }
  if (inMemory) {
    markerDatasetMemoryCache.delete(key);
  }

  const sessionKey = `${MARKER_DATASET_CACHE_PREFIX}${key}`;
  const fromSession = readSessionCache<MarkerDatasetCacheEntry>(sessionKey);
  if (!fromSession || fromSession.expiresAt <= Date.now()) {
    removeSessionCache(sessionKey);
    return null;
  }

  markerDatasetMemoryCache.set(key, fromSession);
  return fromSession;
};

const setCachedMarkerDataset = (key: string, payload: Omit<MarkerDatasetCacheEntry, 'updatedAt' | 'expiresAt'>): void => {
  const wrapped: MarkerDatasetCacheEntry = {
    ...payload,
    updatedAt: Date.now(),
    expiresAt: Date.now() + MARKER_DATASET_CACHE_TTL_MS,
  };
  markerDatasetMemoryCache.set(key, wrapped);
  pruneOldestMapEntries(markerDatasetMemoryCache, MAX_MARKER_DATASET_MEMORY_ENTRIES);
  writeSessionCache(`${MARKER_DATASET_CACHE_PREFIX}${key}`, wrapped);
};

const isDatasetFresh = (entry: MarkerDatasetCacheEntry): boolean =>
  Date.now() - entry.updatedAt <= MARKER_DATASET_REFRESH_MS;

const getInitialHistoryHours = (timeframe: string): number => {
  const defaults: Record<string, number> = {
    M1: 48,
    M5: 96,
    M15: 240,
    M30: 480,
    H1: 1200,
    H4: 3600,
    D1: 8760,
    W1: 17_520,
    MN1: 26_280,
  };
  return defaults[timeframe] || 720;
};

const getSafeBarSpace = (chart: Chart): number => {
  const maybeBarSpace = chart.getBarSpace();
  const bar = typeof maybeBarSpace?.bar === 'number' ? maybeBarSpace.bar : Number.NaN;
  return Number.isFinite(bar) ? Math.max(1, bar) : 8;
};

const quantizeBucketDurationMs = (requestedMs: number, floorDurationMs: number, timeframe: string): number => {
  const minDuration = Math.max(60_000, floorDurationMs);
  for (const candidate of BUCKET_LADDER_MS) {
    if (timeframe === 'W1' && candidate % WEEK_MS !== 0) {
      continue;
    }
    if (timeframe === 'MN1' && candidate % MONTH_APPROX_MS !== 0) {
      continue;
    }
    if (candidate >= requestedMs && candidate >= minDuration) {
      return candidate;
    }
  }

  if (timeframe === 'W1') {
    return Math.max(WEEK_MS, Math.ceil(minDuration / WEEK_MS) * WEEK_MS);
  }

  if (timeframe === 'MN1') {
    return Math.max(MONTH_APPROX_MS, Math.ceil(minDuration / MONTH_APPROX_MS) * MONTH_APPROX_MS);
  }

  return Math.max(BUCKET_LADDER_MS[BUCKET_LADDER_MS.length - 1], minDuration);
};

const getVisibleWindow = (chart: Chart): { startTs: number; endTs: number; visibleBars: number } | null => {
  const data = chart.getDataList();
  if (!Array.isArray(data) || data.length === 0) return null;

  const range = chart.getVisibleRange();
  if (
    !range ||
    !Number.isFinite(range.from) ||
    !Number.isFinite(range.to)
  ) {
    return null;
  }
  const from = Math.max(0, Math.floor(Math.min(range.from, range.to)));
  const to = Math.min(data.length - 1, Math.ceil(Math.max(range.from, range.to)));
  if (to < from) return null;

  const startTs = Number(data[from]?.timestamp);
  const endTs = Number(data[to]?.timestamp);
  if (!Number.isFinite(startTs) || !Number.isFinite(endTs)) return null;

  return {
    startTs,
    endTs,
    visibleBars: Math.max(1, to - from + 1),
  };
};

const computeAdaptiveBucketDurationMs = (
  markers: NewsMarker[],
  timeframe: string,
  chart: Chart | null,
  previousDurationMs: number,
): number => {
  const timeframeDurationMs = getTimeframeDurationMs(timeframe);
  if (!chart || markers.length <= 1) {
    return timeframeDurationMs;
  }

  const visibleWindow = getVisibleWindow(chart);
  if (!visibleWindow) {
    return timeframeDurationMs;
  }

  const { startTs, endTs, visibleBars } = visibleWindow;
  const barSpace = getSafeBarSpace(chart);
  const visibleEventCount = markers.reduce((count, marker) => {
    const ts = new Date(marker.time).getTime();
    if (!Number.isFinite(ts)) return count;
    return ts >= startTs && ts <= endTs ? count + 1 : count;
  }, 0);

  // Prefer atomic per-candle markers whenever pixel density allows.
  const candleCapacityFactor = clamp(barSpace / 8, 0.35, 1.1);
  let targetMarkerCount = Math.round(visibleBars * candleCapacityFactor);
  targetMarkerCount = Math.max(8, targetMarkerCount);

  if (barSpace < 3.2) {
    targetMarkerCount = Math.min(targetMarkerCount, Math.round(visibleBars * 0.55));
  }
  if (barSpace < 2.4) {
    targetMarkerCount = Math.min(targetMarkerCount, Math.round(visibleBars * 0.4));
  }

  if (visibleEventCount <= targetMarkerCount) {
    return timeframeDurationMs;
  }

  const visibleSpanMs = Math.max(timeframeDurationMs, endTs - startTs);
  const requestedDurationMs = Math.ceil(visibleSpanMs / targetMarkerCount);
  const quantizedDurationMs = quantizeBucketDurationMs(requestedDurationMs, timeframeDurationMs, timeframe);

  return quantizedDurationMs;
};

const getViewportHistoryTargetStartTs = (
  chart: Chart,
  timeframe: string,
  bucketDurationMs: number,
): number | null => {
  const visibleWindow = getVisibleWindow(chart);
  if (!visibleWindow) return null;

  const timeframeDurationMs = getTimeframeDurationMs(timeframe);
  const barSpace = getSafeBarSpace(chart);
  const visibleSpanMs = Math.max(timeframeDurationMs, visibleWindow.endTs - visibleWindow.startTs);
  const timeframeScale = clamp(Math.log2(Math.max(1, timeframeDurationMs / 60_000)) + 1.2, 1, 6);
  const zoomOutScale = clamp(8 / barSpace, 1, 4);
  const bucketScale = clamp(bucketDurationMs / timeframeDurationMs, 1, 4);

  // Wider spans, higher TFs, and tighter zoom-outs trigger deeper prefetch.
  const lookbackMultiplier = clamp(timeframeScale + zoomOutScale + bucketScale, 2.5, 14);
  return Math.floor(visibleWindow.startTs - visibleSpanMs * lookbackMultiplier);
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const coerceNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const coerceString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  return fallback;
};

const coerceBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  return fallback;
};

interface MarkerPayload {
  rows: unknown[];
  hasMore: boolean;
  cursorBefore: string | null;
}

const extractMarkerPayload = (data: unknown): MarkerPayload => {
  if (Array.isArray(data)) {
    return {
      rows: data,
      hasMore: data.length >= 500,
      cursorBefore: null,
    };
  }

  const wrapped = asRecord(data);
  const rows = Array.isArray(wrapped?.markers) ? wrapped.markers : [];
  return {
    rows,
    hasMore: coerceBoolean(wrapped?.has_more, rows.length >= 500),
    cursorBefore: coerceString(wrapped?.cursor_before) || null,
  };
};

const getOldestMarkerTimestamp = (markers: NewsMarker[]): number | null => {
  let oldest = Number.POSITIVE_INFINITY;
  markers.forEach((marker) => {
    const ts = new Date(marker.time).getTime();
    if (Number.isFinite(ts) && ts < oldest) {
      oldest = ts;
    }
  });
  return Number.isFinite(oldest) ? oldest : null;
};

const normalizeInstrument = (value: unknown): string =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const normalizeImpact = (value: unknown): 'bullish' | 'bearish' | 'neutral' => {
  const raw = coerceString(value).toLowerCase();
  if (raw.includes('bull')) return 'bullish';
  if (raw.includes('bear')) return 'bearish';
  return 'neutral';
};

const buildMarkerIdentity = (marker: NewsMarker): string => {
  const id = coerceString(marker.id);
  if (id) return `id:${id}`;
  return `fallback:${marker.time}:${marker.headline}`;
};

const parseNewsMarker = (raw: unknown): NewsMarker | null => {
  try {
    const record = asRecord(raw);
    if (!record) return null;

    const mapped = mapApiNewsItem(record);
    const time = coerceString(record.time) || coerceString(mapped.timestamp);
    if (!time) return null;

    const rawSentiment = record.sentiment_score ?? record.sentiment;
    const sentiment = coerceNumber(rawSentiment, mapped.sentiment === 'bullish' ? 1 : mapped.sentiment === 'bearish' ? -1 : 0);
    const impact = normalizeImpact(record.market_impact_prediction ?? record.market_impact ?? mapped.market_impact ?? mapped.sentiment);

    const importance = Math.max(1, Math.min(5, Math.round(coerceNumber(record.importance_score ?? record.importance, mapped.importance || 3))));

    return {
      id: coerceString(mapped.id),
      time,
      headline: coerceString(record.headline ?? record.title, mapped.headline),
      full_headline: coerceString(record.full_headline ?? record.title, mapped.headline),
      summary: coerceString(record.summary ?? record.ai_analysis_summary ?? record.aiAnalysisSummary, mapped.summary),
      ai_analysis_summary: coerceString(record.ai_analysis_summary ?? record.aiAnalysisSummary, mapped.ai_analysis_summary),
      forexfactory_url: coerceString(record.forexfactory_url, mapped.forexfactory_url || '') || null,
      importance,
      sentiment,
      impact,
      volatility: coerceString(record.volatility_expectation ?? record.volatility),
      instruments: Array.isArray(mapped.instruments) ? mapped.instruments : [],
      breaking: coerceBoolean(record.breaking_news ?? record.breaking, mapped.breaking),
      category: coerceString(record.news_category ?? record.forexfactory_category ?? record.category),
      color: coerceString(record.color),
      shape: coerceString(record.shape),
    };
  } catch (error) {
    console.warn('[NewsOverlay] Failed to parse news marker payload', error);
    return null;
  }
};

const dedupeNews = (items: NewsMarker[]): NewsMarker[] => {
  const seen = new Set<string>();
  const deduped: NewsMarker[] = [];

  items.forEach((item) => {
    const key = buildMarkerIdentity(item);
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped;
};

const normalizeNewsCollection = (items: NewsMarker[]): NewsMarker[] =>
  dedupeNews(items)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, MAX_RAW_NEWS_MARKERS);

export const useNewsOverlay = ({
  chartRef,
  symbol,
  timeframe,
  enabled,
  minImportance,
  onNewsClick,
}: UseNewsOverlayOptions): UseNewsOverlayReturn => {
  const [newsMarkers, setNewsMarkers] = useState<AggregatedNewsMarker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayIdsRef = useRef<string[]>([]);
  const rawNewsRef = useRef<NewsMarker[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const reaggregateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backfillContinuationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentBucketDurationMsRef = useRef<number>(getTimeframeDurationMs(timeframe));
  const oldestLoadedTsRef = useRef<number | null>(null);
  const hasMoreHistoryRef = useRef<boolean>(true);
  const loadingOlderRef = useRef<boolean>(false);
  const nextBeforeCursorRef = useRef<string | null>(null);
  const backfillHoursRef = useRef<number>(Math.max(8760, getInitialHistoryHours(timeframe)));
  const datasetCacheKeyRef = useRef<string>(getMarkerDatasetCacheKey(symbol, minImportance));
  const activeRef = useRef<boolean>(false);
  const generationRef = useRef<number>(0);
  const previousSymbolRef = useRef<string>(symbol);

  const fetchMarkerPageCached = useCallback(async (
    hours: number,
    before: string | undefined,
    limit: number,
  ): Promise<MarkerPayload> => {
    const key = getMarkerPageCacheKey(symbol, minImportance, hours, before, limit);
    const cached = getCachedMarkerPage(key);
    if (cached) {
      return cached;
    }

    const inFlight = markerPageInFlightRequests.get(key);
    if (inFlight) {
      return inFlight;
    }

    const requestPromise = apiService
      .getNewsMarkers(symbol, hours, minImportance, before, limit)
      .then((res) => {
        if (res.error) {
          throw new Error(res.error);
        }
        const payload = extractMarkerPayload(res.data as unknown);
        setCachedMarkerPage(key, payload);
        return payload;
      })
      .finally(() => {
        markerPageInFlightRequests.delete(key);
      });

    markerPageInFlightRequests.set(key, requestPromise);
    return requestPromise;
  }, [symbol, minImportance]);

  const persistDatasetCache = useCallback((markers: NewsMarker[]) => {
    setCachedMarkerDataset(datasetCacheKeyRef.current, {
      markers,
      oldestLoadedTs: oldestLoadedTsRef.current,
      hasMore: hasMoreHistoryRef.current,
      nextBeforeCursor: nextBeforeCursorRef.current,
    });
  }, []);

  /**
   * Aggregate news events by selected bucket duration.
   */
  const aggregateNewsByBucket = useCallback((markers: NewsMarker[], durationMs: number): AggregatedNewsMarker[] => {
    const grouped = new Map<number, NewsMarker[]>();

    markers.forEach(marker => {
      const eventTime = new Date(marker.time).getTime();
      if (!Number.isFinite(eventTime)) return;
      const candleTime = alignToCandle(eventTime, durationMs, timeframe);

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
        bucketDurationMs: durationMs,
      });
    });

    // Sort by timestamp (newest first)
    return aggregated.sort((a, b) => b.timestamp - a.timestamp);
  }, [timeframe]);

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
   * Apply symbol + importance filters and aggregate for chart overlays.
   */
  const applyFiltersAndAggregate = useCallback((markers: NewsMarker[], forcedBucketDurationMs?: number) => {
    const normalizedSymbol = normalizeInstrument(symbol);

    const filtered = markers.filter((marker) => {
      if ((marker.importance || 0) < minImportance) return false;
      if (!normalizedSymbol) return true;

      return true;
    });

    const timeframeDurationMs = getTimeframeDurationMs(timeframe);
    const nextBucketDurationMs = typeof forcedBucketDurationMs === 'number'
      ? Math.max(timeframeDurationMs, forcedBucketDurationMs)
      : computeAdaptiveBucketDurationMs(
          filtered,
          timeframe,
          chartRef.current,
          currentBucketDurationMsRef.current,
        );

    currentBucketDurationMsRef.current = nextBucketDurationMs;

    const aggregated = aggregateNewsByBucket(filtered, nextBucketDurationMs);
    setNewsMarkers(aggregated);

    if (aggregated.length === 0) {
      removeNewsOverlay();
    }
  }, [aggregateNewsByBucket, chartRef, minImportance, symbol, timeframe, removeNewsOverlay]);

  const fetchOlderHistory = useCallback(async (): Promise<boolean> => {
    if (!enabled || !activeRef.current || loadingOlderRef.current || !hasMoreHistoryRef.current) return false;

    const oldestLoadedTs = oldestLoadedTsRef.current;
    if (!oldestLoadedTs) return false;

    loadingOlderRef.current = true;
    try {
      const beforeCursor = new Date(oldestLoadedTs - 1).toISOString();
      const payload = await fetchMarkerPageCached(backfillHoursRef.current, beforeCursor, 500);
      if (!activeRef.current) return false;
      setError(null);
      const fetchedNews = payload.rows
        .map((entry) => parseNewsMarker(entry))
        .filter((entry): entry is NewsMarker => Boolean(entry));

      if (fetchedNews.length === 0) {
        // Progress the cursor artificially backward to prevent infinite DB calls on the same timestamp
        const nextOrigin = oldestLoadedTs - (backfillHoursRef.current * 3600000);
        oldestLoadedTsRef.current = nextOrigin;
        
        // Cap expansion at chunks to protect backend POSTGRES JSON scan timeouts
        const expandedHours = Math.min(2880, Math.round(backfillHoursRef.current * 1.5));
        backfillHoursRef.current = expandedHours;
        return true;
      }

      const previousOldest = oldestLoadedTsRef.current;
      const previousCount = rawNewsRef.current.length;
      rawNewsRef.current = normalizeNewsCollection([...fetchedNews, ...rawNewsRef.current]);

      const nextOldest = getOldestMarkerTimestamp(rawNewsRef.current);
      const uniqueAdded = Math.max(0, rawNewsRef.current.length - previousCount);
      oldestLoadedTsRef.current = nextOldest;
      nextBeforeCursorRef.current =
        payload.cursorBefore ||
        (nextOldest ? new Date(nextOldest - 1).toISOString() : null);

      const cursorAdvanced = Boolean(payload.cursorBefore && payload.cursorBefore !== beforeCursor);
      const progressedBackward =
        uniqueAdded > 0 ||
        (nextOldest !== null && previousOldest !== null ? nextOldest < previousOldest : false) ||
        cursorAdvanced;
      hasMoreHistoryRef.current = payload.hasMore && progressedBackward;
      backfillHoursRef.current = Math.max(backfillHoursRef.current, 8760);

      applyFiltersAndAggregate(rawNewsRef.current);
      persistDatasetCache(rawNewsRef.current);
      return true;
    } catch (e) {
      console.warn('[NewsOverlay] Failed to fetch older history page:', e);
      if (activeRef.current) {
        setError('Failed to load older news markers');
      }
      return false;
    } finally {
      loadingOlderRef.current = false;
    }
  }, [enabled, fetchMarkerPageCached, applyFiltersAndAggregate, persistDatasetCache]);

  const maybeFetchOlderHistoryForViewport = useCallback(async () => {
    if (!enabled || !activeRef.current || !hasMoreHistoryRef.current || loadingOlderRef.current) return;
    const generation = generationRef.current;
    const chart = chartRef.current;
    if (!chart) return;

    const oldestLoadedTs = oldestLoadedTsRef.current;
    if (!oldestLoadedTs) return;

    const visibleWindow = getVisibleWindow(chart);
    if (!visibleWindow) return;

    const viewportTargetStartTs = getViewportHistoryTargetStartTs(
      chart,
      timeframe,
      currentBucketDurationMsRef.current,
    );
    if (viewportTargetStartTs === null) return;

    if (oldestLoadedTs > viewportTargetStartTs) {
      let pagesFetched = 0;
      while (
        activeRef.current &&
        generationRef.current === generation &&
        hasMoreHistoryRef.current &&
        !loadingOlderRef.current &&
        oldestLoadedTsRef.current !== null &&
        oldestLoadedTsRef.current > viewportTargetStartTs &&
        pagesFetched < MAX_BACKFILL_PAGES_PER_TICK
      ) {
        const progressed = await fetchOlderHistory();
        if (!progressed) break;
        pagesFetched += 1;
      }

      if (
        activeRef.current &&
        generationRef.current === generation &&
        hasMoreHistoryRef.current &&
        oldestLoadedTsRef.current !== null &&
        oldestLoadedTsRef.current > viewportTargetStartTs &&
        pagesFetched >= MAX_BACKFILL_PAGES_PER_TICK
      ) {
        if (backfillContinuationTimerRef.current) {
          clearTimeout(backfillContinuationTimerRef.current);
        }
        backfillContinuationTimerRef.current = setTimeout(() => {
          if (!activeRef.current || generationRef.current !== generation) return;
          backfillContinuationTimerRef.current = null;
          void maybeFetchOlderHistoryForViewport();
        }, 180);
      }
    }
  }, [enabled, chartRef, timeframe, fetchOlderHistory]);

  const scheduleReaggregate = useCallback(() => {
    if (!enabled) return;

    if (reaggregateTimerRef.current) {
      return;
    }

    reaggregateTimerRef.current = setTimeout(() => {
      reaggregateTimerRef.current = null;
      applyFiltersAndAggregate(rawNewsRef.current);
      void maybeFetchOlderHistoryForViewport();
    }, 40);
  }, [enabled, applyFiltersAndAggregate, maybeFetchOlderHistoryForViewport]);

  /**
   * Clear news markers
   */
  const clearNews = useCallback(() => {
    setNewsMarkers([]);
    rawNewsRef.current = [];
    currentBucketDurationMsRef.current = getTimeframeDurationMs(timeframe);
    oldestLoadedTsRef.current = null;
    hasMoreHistoryRef.current = true;
    loadingOlderRef.current = false;
    nextBeforeCursorRef.current = null;
    backfillHoursRef.current = Math.max(8760, getInitialHistoryHours(timeframe));
    removeNewsOverlay();
  }, [timeframe, removeNewsOverlay]);

  /**
   * Render news markers as chart overlays
   */
  const renderNewsOverlay = useCallback(() => {
    const chart = chartRef.current;
    if (!chart || newsMarkers.length === 0) return;

    // First remove existing overlays
    removeNewsOverlay();

    const barSpace = getSafeBarSpace(chart);
    const visibleRange = chart.getVisibleRange();
    if (!visibleRange || !Number.isFinite(visibleRange.from) || !Number.isFinite(visibleRange.to)) {
      return;
    }
    const visibleBars = Math.max(1, Math.round(Math.abs(visibleRange.to - visibleRange.from)));
    // When zoomed out (barSpace is small), we want markerY to be smaller (higher on screen)
    const markerY = Math.max(14, Math.min(30, 30 - Math.round((8 - barSpace) * 1.5)));

    const dataList = chart.getDataList();
    if (!Array.isArray(dataList)) return;
    
    // Calculate timestamp bounds with roughly 50% overflow padding
    const fromIdx = Math.max(0, Math.floor(visibleRange.from - visibleBars * 0.5));
    const toIdx = Math.min(dataList.length - 1, Math.ceil(visibleRange.to + visibleBars * 0.5));
    
    const startTs = Number(dataList[fromIdx]?.timestamp) || 0;
    const endTs = Number(dataList[toIdx]?.timestamp) || Number.POSITIVE_INFINITY;
    
    const visibleNewsMarkers = newsMarkers.filter(
      (m) => m.timestamp >= startTs && m.timestamp <= endTs
    );

    visibleNewsMarkers.forEach((marker) => {
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
            bucketDurationMs: marker.bucketDurationMs,
            barSpace,
            markerY,
            visibleBars,
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
  }, [chartRef, newsMarkers, removeNewsOverlay, onNewsClick]);

  useEffect(() => {
    currentBucketDurationMsRef.current = getTimeframeDurationMs(timeframe);
  }, [timeframe]);

  useEffect(() => {
    datasetCacheKeyRef.current = getMarkerDatasetCacheKey(symbol, minImportance);
  }, [symbol, minImportance]);

  useEffect(() => {
    if (!enabled) return;
    let chart: Chart | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const handleViewportChange = () => {
      scheduleReaggregate();
    };

    const bindWhenReady = () => {
      if (isDisposed) return;
      chart = chartRef.current;
      if (!chart) {
        retryTimer = setTimeout(bindWhenReady, 120);
        return;
      }

      try {
        chart.subscribeAction('onZoom', handleViewportChange);
        chart.subscribeAction('onScroll', handleViewportChange);
        chart.subscribeAction('onVisibleRangeChange', handleViewportChange);
      } catch (error) {
        console.warn('[NewsOverlay] Failed to subscribe viewport actions:', error);
      }
    };

    bindWhenReady();

    return () => {
      isDisposed = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (chart) {
        try {
          chart.unsubscribeAction('onZoom', handleViewportChange);
          chart.unsubscribeAction('onScroll', handleViewportChange);
          chart.unsubscribeAction('onVisibleRangeChange', handleViewportChange);
        } catch (error) {
          console.warn('[NewsOverlay] Failed to unsubscribe viewport actions:', error);
        }
      }
    };
  }, [enabled, chartRef, scheduleReaggregate]);

  useEffect(() => {
    return () => {
      if (reaggregateTimerRef.current) {
        clearTimeout(reaggregateTimerRef.current);
        reaggregateTimerRef.current = null;
      }
      if (backfillContinuationTimerRef.current) {
        clearTimeout(backfillContinuationTimerRef.current);
        backfillContinuationTimerRef.current = null;
      }
      activeRef.current = false;
    };
  }, []);

  // Subscribe to per-chart mux SSE stream and keep markers synchronized.
  useEffect(() => {
    if (!enabled) {
      activeRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      clearNews();
      setIsLoading(false);
      setError(null);
      if (reaggregateTimerRef.current) {
        clearTimeout(reaggregateTimerRef.current);
        reaggregateTimerRef.current = null;
      }
      if (backfillContinuationTimerRef.current) {
        clearTimeout(backfillContinuationTimerRef.current);
        backfillContinuationTimerRef.current = null;
      }
      return;
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const isNewSymbol = previousSymbolRef.current !== symbol;
    previousSymbolRef.current = symbol;

    if (isNewSymbol) {
      rawNewsRef.current = [];
      setNewsMarkers([]);
      removeNewsOverlay();
      oldestLoadedTsRef.current = null;
      hasMoreHistoryRef.current = true;
      nextBeforeCursorRef.current = null;
    }

    generationRef.current += 1;
    activeRef.current = true;
    datasetCacheKeyRef.current = getMarkerDatasetCacheKey(symbol, minImportance);
    currentBucketDurationMsRef.current = getTimeframeDurationMs(timeframe);
    backfillHoursRef.current = Math.max(8760, getInitialHistoryHours(timeframe));
    setError(null);
    setIsLoading(false);

    let active = true;
    const datasetKey = datasetCacheKeyRef.current;
    const cachedDataset = getCachedMarkerDataset(datasetKey);
    let shouldFetchInitialPage = true;

    if (cachedDataset && cachedDataset.markers.length > 0) {
      rawNewsRef.current = dedupeNews(cachedDataset.markers).sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      oldestLoadedTsRef.current = cachedDataset.oldestLoadedTs ?? getOldestMarkerTimestamp(rawNewsRef.current);
      hasMoreHistoryRef.current = cachedDataset.hasMore;
      nextBeforeCursorRef.current =
        cachedDataset.nextBeforeCursor ||
        (oldestLoadedTsRef.current ? new Date(oldestLoadedTsRef.current - 1).toISOString() : null);
      applyFiltersAndAggregate(rawNewsRef.current);
      shouldFetchInitialPage = !isDatasetFresh(cachedDataset);
    }

    if (shouldFetchInitialPage) {
      setIsLoading(rawNewsRef.current.length === 0);
      const initialHours = getInitialHistoryHours(timeframe);
      fetchMarkerPageCached(initialHours, undefined, 500)
        .then((payload) => {
          if (!active) return;

          const fetchedNews = payload.rows
            .map((entry) => parseNewsMarker(entry))
            .filter((entry): entry is NewsMarker => Boolean(entry));

          if (fetchedNews.length > 0) {
            rawNewsRef.current = normalizeNewsCollection([...fetchedNews, ...rawNewsRef.current]);
            oldestLoadedTsRef.current = getOldestMarkerTimestamp(rawNewsRef.current);
            hasMoreHistoryRef.current = payload.hasMore || hasMoreHistoryRef.current;
            nextBeforeCursorRef.current =
              payload.cursorBefore ||
              nextBeforeCursorRef.current ||
              (oldestLoadedTsRef.current ? new Date(oldestLoadedTsRef.current - 1).toISOString() : null);
            applyFiltersAndAggregate(rawNewsRef.current);
            persistDatasetCache(rawNewsRef.current);
            void maybeFetchOlderHistoryForViewport();
          } else if (rawNewsRef.current.length === 0) {
            // Initial window yielded zero items. Keep stream alive and set boundary.
            const syntheticOrigin = Date.now() - (initialHours * 3600000);
            oldestLoadedTsRef.current = syntheticOrigin;
            hasMoreHistoryRef.current = true;
          }
        })
        .catch((err) => {
          if (!active) return;
          console.error('[NewsOverlay] Error fetching historical news:', err);
          setError('Failed to load news markers');
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });
    } else {
      void maybeFetchOlderHistoryForViewport();
    }

    // 2. Subscribe to multiplexed SSE stream for live updates.
    const unsubscribe = sseService.subscribeToSignalMuxNews(
      symbol,
      (payload) => {
        if (!active) return;
        const data = asRecord(payload);
        if (!data) return;

        const eventType = coerceString(data.type).toLowerCase();
        if (eventType === 'connected' || eventType === 'heartbeat') return;

        if (eventType === 'news_snapshot' && Array.isArray(data.news)) {
          const snapshot = data.news
            .map((entry) => parseNewsMarker(entry))
            .filter((entry): entry is NewsMarker => Boolean(entry));

          rawNewsRef.current = normalizeNewsCollection([...snapshot, ...rawNewsRef.current]);
          oldestLoadedTsRef.current = getOldestMarkerTimestamp(rawNewsRef.current);
          applyFiltersAndAggregate(rawNewsRef.current);
          persistDatasetCache(rawNewsRef.current);
          return;
        }

        if (eventType === 'news_update' && data.news) {
          const next = parseNewsMarker(data.news);
          if (!next) return;

          rawNewsRef.current = normalizeNewsCollection([next, ...rawNewsRef.current]);
          oldestLoadedTsRef.current = getOldestMarkerTimestamp(rawNewsRef.current);
          applyFiltersAndAggregate(rawNewsRef.current);
          persistDatasetCache(rawNewsRef.current);
        }
      },
      (sseError) => {
        if (!active) return;
        console.error('[NewsOverlay] SSE error:', sseError);
        setError('Live news stream disconnected');
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      active = false;
      activeRef.current = false;
      unsubscribe();
      if (reaggregateTimerRef.current) {
        clearTimeout(reaggregateTimerRef.current);
        reaggregateTimerRef.current = null;
      }
      if (backfillContinuationTimerRef.current) {
        clearTimeout(backfillContinuationTimerRef.current);
        backfillContinuationTimerRef.current = null;
      }
      if (unsubscribeRef.current === unsubscribe) {
        unsubscribeRef.current = null;
      }
    };
  }, [
    enabled,
    symbol,
    timeframe,
    minImportance,
    clearNews,
    applyFiltersAndAggregate,
    removeNewsOverlay,
    fetchMarkerPageCached,
    maybeFetchOlderHistoryForViewport,
    persistDatasetCache,
  ]);

  // Re-apply client-side filters when timeframe/min-importance changes.
  useEffect(() => {
    if (!enabled) return;
    applyFiltersAndAggregate(rawNewsRef.current);
  }, [enabled, applyFiltersAndAggregate]);

  return {
    newsMarkers,
    isLoading,
    error,
    clearNews,
    renderNewsOverlay,
    removeNewsOverlay,
  };
};

export default useNewsOverlay;
