import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { mapApiEventAnalysisPayload } from '@/features/news/adapters';
import type { EventAnalysisItem } from '@/features/news/types';
import { useAuth } from '@/hooks/useAuth';
import apiService from '@/services/api';
import sseService from '@/services/sseService';

interface UseEventAnalysisResult {
  items: EventAnalysisItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEventAnalysis(): UseEventAnalysisResult {
  const { isAuthenticated, status, user, session } = useAuth();
  const authScope = `${status}:${user?.id ?? 'anon'}:${session?.access_token ? 'session' : 'no-session'}`;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['news', 'events', authScope],
    queryFn: async () => {
      if (status === 'loading') {
        throw new Error('Authentication loading');
      }

      if (!isAuthenticated) return [] as EventAnalysisItem[];

      const response = await apiService.getNewsEvents();
      if (response.error) {
        throw new Error(response.error);
      }

      return mapApiEventAnalysisPayload(response.data);
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
      if (payload?.type === 'event_analysis_update') {
        console.log('[SSE] Event analysis update received, refetching...');
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
