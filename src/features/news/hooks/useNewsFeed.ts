import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { useAuth } from '@/hooks/useAuth';

import { mapApiNewsItem } from '@/features/news/adapters';
import type { NewsIntelligenceItem } from '@/features/news/types';

export interface UseNewsFeedResult {
  items: NewsIntelligenceItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  isLive: boolean;
  hasMore: boolean;
  total: number;
  isCachedFallback: boolean;
  lastUpdatedAt: string | null;
  refresh: () => void;
  loadMore: () => void;
}

const PAGE_SIZE = 20;
const MAX_NEWS_CACHE_ITEMS = 100;

const dedupeNews = (items: NewsIntelligenceItem[]): NewsIntelligenceItem[] => {
  const seen = new Set<string>();
  const deduped: NewsIntelligenceItem[] = [];

  items.forEach((item) => {
    const key = `${item.id}:${item.headline}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped;
};

const mapNewsArray = (rows: any[]): NewsIntelligenceItem[] => dedupeNews(rows.map(mapApiNewsItem));

const coerceNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const deriveSentiment = (item: any): NewsIntelligenceItem['sentiment'] => {
  if (typeof item?.sentiment === 'string') return item.sentiment as NewsIntelligenceItem['sentiment'];
  const score = coerceNumber(item?.sentiment_score, 0);
  if (score > 0) return 'bullish';
  if (score < 0) return 'bearish';
  return 'neutral';
};

const normalizeCachedItem = (item: any): NewsIntelligenceItem => ({
  id: item?.id || `news-${Date.now()}-${Math.random()}`,
  headline: item?.headline || item?.title || 'No headline',
  summary: item?.summary || item?.text || item?.ai_analysis_summary || '',
  content: item?.content || item?.text || '',
  timestamp: item?.timestamp || item?.created_at || new Date().toISOString(),
  source: item?.source || item?.forexfactory_category || 'Market News',
  importance: coerceNumber(item?.importance, coerceNumber(item?.importance_score, 3)),
  sentiment: deriveSentiment(item),
  instruments: item?.instruments || item?.forex_instruments || [],
  breaking:
    item?.breaking ??
    item?.breaking_news ??
    (typeof item?.forexfactory_category === 'string'
      ? item.forexfactory_category.includes('Breaking News')
      : false),
  market_impact: item?.market_impact || item?.market_impact_prediction || '',
  volatility_expectation: item?.volatility_expectation || '',
  forexfactory_url: item?.forexfactory_url || null,
  entities: item?.entities || item?.entities_mentioned || [],
  sessions: item?.sessions || item?.trading_sessions || [],
  impact_timeframe: item?.impact_timeframe || '',
  news_category: item?.news_category || '',
  analysis_confidence: coerceNumber(item?.analysis_confidence, 0),
  central_bank_related: item?.central_bank_related || false,
  trade_deal_related: item?.trade_deal_related || false,
  human_takeaway: typeof item?.human_takeaway === 'string' ? item.human_takeaway : undefined,
  attention_score: coerceNumber(item?.attention_score, 0) || undefined,
  news_state: item?.news_state,
  market_pressure: item?.market_pressure,
  attention_window: item?.attention_window,
  confidence_label: item?.confidence_label,
  expected_followups: Array.isArray(item?.expected_followups) ? item.expected_followups : [],
});

interface NewsFeedData {
  items: NewsIntelligenceItem[];
  total: number;
  offset: number;
  hasMore: boolean;
  lastUpdatedAt: string;
}

/**
 * Encapsulates NewsPage data plumbing:
 * - React Query cache management
 * - refresh + pagination
 * - SSE lifecycle with resume catch-up
 * - resilient fallback to cached rows
 */
export function useNewsFeed(): UseNewsFeedResult {
  const { isAuthenticated, status, backendAvailable } = useAuth();
  const queryClient = useQueryClient();

  const [loadingMore, setLoadingMore] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isVisible, setIsVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden
  );

  const isCatchupInFlightRef = useRef(false);
  const previousVisibleRef = useRef(isVisible);

  // Track visibility changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Fetch function for React Query
  const fetchNewsFeed = useCallback(
    async (currentOffset: number = 0): Promise<NewsFeedData> => {
      if (status === 'loading') {
        throw new Error('Authentication loading');
      }

      if (!isAuthenticated) {
        // Return empty data if not authenticated
        return {
          items: [],
          total: 0,
          offset: 0,
          hasMore: false,
          lastUpdatedAt: new Date().toISOString(),
        };
      }

      const response = await apiService.getCurrentNews(PAGE_SIZE, currentOffset);
      if (response.error) {
        throw new Error(response.error);
      }

      const payload = response.data as any;
      const rows = Array.isArray(payload?.news) ? payload.news : Array.isArray(payload) ? payload : [];
      const totalCount = typeof payload?.total === 'number' ? payload.total : rows.length;
      const mapped = mapNewsArray(rows);

      const nextOffset = currentOffset + PAGE_SIZE;
      const hasMore = nextOffset < totalCount;

      return {
        items: mapped,
        total: totalCount,
        offset: nextOffset,
        hasMore,
        lastUpdatedAt: new Date().toISOString(),
      };
    },
    [isAuthenticated, status]
  );

  // React Query for initial data
  const {
    data: queryData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['news', 'feed'],
    queryFn: () => fetchNewsFeed(0),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: status !== 'loading',
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Derive state from React Query data
  const items = useMemo(() => queryData?.items || [], [queryData?.items]);
  const total = queryData?.total || 0;
  const offset = queryData?.offset || 0;
  const hasMore = queryData?.hasMore || false;
  const lastUpdatedAt = queryData?.lastUpdatedAt || null;
  const error = queryError ? String(queryError) : null;
  const isCachedFallback = !isLoading && !queryError && queryClient.getQueryState(['news', 'feed'])?.dataUpdateCount === 0;

  // Refs for SSE callbacks
  const itemsRef = useRef<NewsIntelligenceItem[]>(items);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;

    setLoadingMore(true);

    try {
      const currentData = queryClient.getQueryData<NewsFeedData>(['news', 'feed']);
      if (!currentData) return;

      const moreData = await fetchNewsFeed(currentData.offset);
      const mergedItems = dedupeNews([...currentData.items, ...moreData.items]);

      queryClient.setQueryData<NewsFeedData>(['news', 'feed'], {
        items: mergedItems,
        total: moreData.total,
        offset: moreData.offset,
        hasMore: moreData.hasMore,
        lastUpdatedAt: moreData.lastUpdatedAt,
      });
    } catch (error) {
      console.error('[useNewsFeed] Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchNewsFeed, queryClient]);

  // Refresh function
  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // SSE subscription for live updates
  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated || !isVisible) {
      setIsLive(false);
      return;
    }

    setIsLive(true);

    const unsubscribe = sseService.subscribeToNews(
      (data) => {
        if (!data || typeof data !== 'object') return;
        if (data.type === 'connected' || data.type === 'heartbeat') return;

        const currentData = queryClient.getQueryData<NewsFeedData>(['news', 'feed']);
        if (!currentData) return;

        if (data.type === 'news_snapshot' && Array.isArray(data.news)) {
          const snapshot = mapNewsArray(data.news).slice(0, MAX_NEWS_CACHE_ITEMS);
          queryClient.setQueryData<NewsFeedData>(['news', 'feed'], {
            items: snapshot,
            total: snapshot.length,
            offset: Math.min(snapshot.length, PAGE_SIZE),
            hasMore: false,
            lastUpdatedAt: data.server_ts || new Date().toISOString(),
          });
          return;
        }

        if (data.type === 'news_update' && data.news) {
          const nextItem = mapApiNewsItem(data.news);
          const merged = dedupeNews([nextItem, ...currentData.items]).slice(0, MAX_NEWS_CACHE_ITEMS);
          const changed = merged.length !== currentData.items.length || merged[0]?.id !== currentData.items[0]?.id;

          if (changed) {
            queryClient.setQueryData<NewsFeedData>(['news', 'feed'], {
              items: merged,
              total: Math.max(currentData.total, merged.length),
              offset: currentData.offset,
              hasMore: currentData.hasMore,
              lastUpdatedAt: data.server_ts || new Date().toISOString(),
            });
          }
        }
      },
      (sseError) => {
        console.error('[useNewsFeed] SSE error:', sseError);
        setIsLive(false);
      }
    );

    return () => {
      unsubscribe();
      setIsLive(false);
    };
  }, [isAuthenticated, isVisible, queryClient, status]);

  // Catch-up fetch when returning to visibility
  useEffect(() => {
    const wasVisible = previousVisibleRef.current;
    previousVisibleRef.current = isVisible;

    if (wasVisible || !isVisible) return;
    if (!isAuthenticated || status === 'loading') return;
    if (isCatchupInFlightRef.current) return;

    isCatchupInFlightRef.current = true;
    void refetch().finally(() => {
      isCatchupInFlightRef.current = false;
    });
  }, [isAuthenticated, isVisible, refetch, status]);

  return {
    items,
    loading: isLoading,
    loadingMore,
    error,
    isLive,
    hasMore,
    total,
    isCachedFallback,
    lastUpdatedAt,
    refresh,
    loadMore,
  };
}

export default useNewsFeed;
