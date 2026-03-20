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

const getNewsIdentity = (item: NewsIntelligenceItem): string => {
  if (typeof item.id === 'string' && item.id.trim().length > 0) {
    return `id:${item.id}`;
  }

  return `fallback:${item.timestamp}:${item.source}:${item.headline}`;
};

const newsItemSignature = (item: NewsIntelligenceItem): string =>
  `${item.id}|${item.timestamp}|${item.headline}|${item.summary}|${item.content}`;

const hasNewsListChanged = (
  previous: NewsIntelligenceItem[],
  next: NewsIntelligenceItem[]
): boolean => {
  if (previous.length !== next.length) return true;

  for (let index = 0; index < next.length; index += 1) {
    if (newsItemSignature(previous[index]) !== newsItemSignature(next[index])) {
      return true;
    }
  }

  return false;
};

const dedupeNews = (items: NewsIntelligenceItem[]): NewsIntelligenceItem[] => {
  const seen = new Set<string>();
  const deduped: NewsIntelligenceItem[] = [];

  items.forEach((item) => {
    const key = getNewsIdentity(item);
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped;
};

const mapNewsArray = (rows: unknown[]): NewsIntelligenceItem[] => dedupeNews(rows.map(mapApiNewsItem));

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const coerceString = (value: unknown, fallback: string = ''): string => {
  if (typeof value === 'string') return value;
  return fallback;
};

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
  const { isAuthenticated, status, user, backendAvailable, isRefreshing, authResolved } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['news', 'feed', user?.id ?? 'anon'] as const, [user?.id]);

  const [loadingMore, setLoadingMore] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isVisible, setIsVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden
  );

  const isCatchupInFlightRef = useRef(false);
  const previousVisibleRef = useRef(isVisible);
  const hiddenAtRef = useRef<number>(0);

  // Track visibility changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      }
      setIsVisible(!document.hidden);
    };
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

      const payload = response.data as unknown;
      const payloadRecord = asRecord(payload);
      const rows = Array.isArray(payloadRecord?.news) ? payloadRecord.news : Array.isArray(payload) ? payload : [];
      const totalCount = typeof payloadRecord?.total === 'number' ? payloadRecord.total : rows.length;
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
    queryKey,
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
  const isCachedFallback = !isLoading && !queryError && queryClient.getQueryState(queryKey)?.dataUpdateCount === 0;

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
      const currentData = queryClient.getQueryData<NewsFeedData>(queryKey);
      if (!currentData) return;

      const moreData = await fetchNewsFeed(currentData.offset);
      const mergedItems = dedupeNews([...currentData.items, ...moreData.items]);

      queryClient.setQueryData<NewsFeedData>(queryKey, {
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
  }, [fetchNewsFeed, queryClient, queryKey]);

  // Refresh function
  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // SSE subscription for live updates
  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated || !backendAvailable) {
      setIsLive(false);
      return;
    }

    setIsLive(true);

    const unsubscribe = sseService.subscribeToNews(
      (payload) => {
        const data = asRecord(payload);
        if (!data) return;
        if (data.type === 'connected' || data.type === 'heartbeat') return;

        const currentData = queryClient.getQueryData<NewsFeedData>(queryKey);
        if (!currentData) return;

        if (data.type === 'news_snapshot' && Array.isArray(data.news)) {
          const snapshot = mapNewsArray(data.news).slice(0, MAX_NEWS_CACHE_ITEMS);
          queryClient.setQueryData<NewsFeedData>(queryKey, {
            items: snapshot,
            total: snapshot.length,
            offset: Math.min(snapshot.length, PAGE_SIZE),
            hasMore: false,
            lastUpdatedAt: coerceString(data.server_ts) || new Date().toISOString(),
          });
          return;
        }

        if (data.type === 'news_update' && data.news) {
          const nextItem = mapApiNewsItem(data.news);
          const merged = dedupeNews([nextItem, ...currentData.items]).slice(0, MAX_NEWS_CACHE_ITEMS);
          const changed = hasNewsListChanged(currentData.items, merged);

          if (changed) {
            queryClient.setQueryData<NewsFeedData>(queryKey, {
              items: merged,
              total: Math.max(currentData.total, merged.length),
              offset: currentData.offset,
              hasMore: currentData.hasMore,
              lastUpdatedAt: coerceString(data.server_ts) || new Date().toISOString(),
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
  }, [backendAvailable, isAuthenticated, queryClient, queryKey, status]);

  // Catch-up fetch when returning to visibility
  useEffect(() => {
    const wasVisible = previousVisibleRef.current;
    previousVisibleRef.current = isVisible;

    if (wasVisible || !isVisible) return;
    if (!isAuthenticated || status === 'loading' || !authResolved || isRefreshing) return;
    if (isCatchupInFlightRef.current) return;

    if (Date.now() - hiddenAtRef.current > 30000) {
      isCatchupInFlightRef.current = true;
      void refetch().finally(() => {
        isCatchupInFlightRef.current = false;
      });
    }
  }, [isAuthenticated, isVisible, refetch, status, authResolved, isRefreshing]);

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
