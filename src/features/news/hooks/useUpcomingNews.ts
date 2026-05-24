import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { mapApiNewsItem } from '@/features/news/adapters';
import type { NewsIntelligenceItem } from '@/features/news/types';
import { useAuth } from '@/hooks/useAuth';
import apiService from '@/services/api';
import sseService from '@/services/sseService';

interface UseUpcomingNewsResult {
  items: NewsIntelligenceItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

export function useUpcomingNews(): UseUpcomingNewsResult {
  const { isAuthenticated, status, user, session } = useAuth();
  const authScope = `${status}:${user?.id ?? 'anon'}:${session?.access_token ? 'session' : 'no-session'}`;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['news', 'upcoming', authScope],
    queryFn: async () => {
      if (status === 'loading') {
        throw new Error('Authentication loading');
      }

      if (!isAuthenticated) return [] as NewsIntelligenceItem[];

      const response = await apiService.getUpcomingNews();
      if (response.error) {
        throw new Error(response.error);
      }

      const payloadRecord = asRecord(response.data);
      const rows = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(payloadRecord?.upcoming) 
          ? payloadRecord.upcoming 
          : [];
      
      return rows.map(mapApiNewsItem);
    },
    staleTime: 5 * 60 * 1000,
    enabled: status !== 'loading',
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = sseService.subscribeToNews((payload: any) => {
      if (payload?.type === 'upcoming_news_update' || payload?.type === 'upcoming_update') {
        console.log('[SSE] Upcoming news update received, refetching...');
        void refetch();
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, refetch]);

  return {
    items: data || [],
    loading: isLoading,
    error: error ? String(error) : null,
    refetch: () => {
      void refetch();
    },
  };
}
