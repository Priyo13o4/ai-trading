import { useCallback, useEffect, useRef, useState } from 'react';

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
  refresh: () => void;
  loadMore: () => void;
}

const PAGE_SIZE = 20;

/**
 * Encapsulates all NewsPage data plumbing:
 * - initial fetch
 * - refresh
 * - pagination/loadMore
 * - SSE lifecycle
 * - dedupe rules
 * - raw -> NewsIntelligenceItem mapping
 */
export function useNewsFeed(): UseNewsFeedResult {
  const { isAuthenticated, status } = useAuth();
  const [items, setItems] = useState<NewsIntelligenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch guards (StrictMode-safe)
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Keep state mirrored in refs for stable callbacks
  const offsetRef = useRef(offset);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const loadingMoreRef = useRef(loadingMore);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  const fetchNews = useCallback(async (options: { isLoadMore: boolean; isInitial: boolean }) => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      setItems([]);
      setTotal(0);
      setHasMore(false);
      hasMoreRef.current = false;
      setLoading(false);
      loadingRef.current = false;
      setLoadingMore(false);
      loadingMoreRef.current = false;
      setIsLive(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // StrictMode-safe initial fetch guard
    if (options.isInitial) {
      if (hasFetchedRef.current) {
        isFetchingRef.current = false;
        return;
      }
      // Must be set BEFORE awaiting any promise
      hasFetchedRef.current = true;
    }

    if (options.isLoadMore) {
      setLoadingMore(true);
      loadingMoreRef.current = true;
    } else {
      setLoading(true);
      loadingRef.current = true;

      setOffset(0);
      offsetRef.current = 0;
    }

    setError(null);

    try {
      const currentOffset = options.isLoadMore ? offsetRef.current : 0;
      const response = await apiService.getCurrentNews(PAGE_SIZE, currentOffset);
      const data = response.data as any;

      const newsArray = data?.news || data || [];
      const totalCount = data?.total || newsArray.length;

      if (Array.isArray(newsArray)) {
        const mappedNews = newsArray.map(mapApiNewsItem);

        if (options.isLoadMore) {
          setItems((prev) => {
            // Deduplicate by headline (preserve existing NewsPage behavior)
            const existing = new Set(prev.map((n) => n.headline));
            const newItems = mappedNews.filter((n) => !existing.has(n.headline));
            return [...prev, ...newItems];
          });

          const nextOffset = currentOffset + PAGE_SIZE;
          setOffset(nextOffset);
          offsetRef.current = nextOffset;
        } else {
          setItems(mappedNews);

          setOffset(PAGE_SIZE);
          offsetRef.current = PAGE_SIZE;
        }

        setTotal(totalCount);
        const nextHasMore = currentOffset + PAGE_SIZE < totalCount;
        setHasMore(nextHasMore);
        hasMoreRef.current = nextHasMore;
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setLoadingMore(false);
      loadingMoreRef.current = false;
      isFetchingRef.current = false;
    }
  }, [isAuthenticated, status]);

  const refresh = useCallback(() => {
    void fetchNews({ isLoadMore: false, isInitial: false });
  }, [fetchNews]);

  const loadMore = useCallback(() => {
    // Pagination guard
    if (loadingRef.current) return;
    if (loadingMoreRef.current) return;
    if (!hasMoreRef.current) return;

    void fetchNews({ isLoadMore: true, isInitial: false });
  }, [fetchNews]);

  // Initial fetch (exactly once per mount, even in React 18 StrictMode)
  useEffect(() => {
    void fetchNews({ isLoadMore: false, isInitial: true });
  }, [fetchNews]);

  // Live updates (SSE)
  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      setIsLive(false);
      return;
    }

    setIsLive(true);

    const unsubscribe = sseService.subscribeToNews(
      (data) => {
        if (data.type === 'news_update' && data.news) {
          setItems((prev) => {
            const newItem = mapApiNewsItem(data.news);

            // Deduplicate by headline (preserve existing NewsPage behavior)
            const exists = prev.some((item) => item.headline === newItem.headline);
            if (exists) return prev;

            return [newItem, ...prev];
          });
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
  }, [isAuthenticated, status]);

  return {
    items,
    loading,
    loadingMore,
    error,
    isLive,
    hasMore,
    total,
    refresh,
    loadMore,
  };
}
