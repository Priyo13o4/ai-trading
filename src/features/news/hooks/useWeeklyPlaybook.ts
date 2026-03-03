import { useQuery } from '@tanstack/react-query';

import { mapApiPlaybookPayload } from '@/features/news/adapters';
import type { WeeklyPlaybookItem } from '@/features/news/types';
import { useAuth } from '@/hooks/useAuth';
import apiService from '@/services/api';

interface UseWeeklyPlaybookResult {
  items: WeeklyPlaybookItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWeeklyPlaybook(): UseWeeklyPlaybookResult {
  const { isAuthenticated, status, user, session } = useAuth();
  const authScope = `${status}:${user?.id ?? 'anon'}:${session?.access_token ? 'session' : 'no-session'}`;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['news', 'playbook', authScope],
    queryFn: async () => {
      if (status === 'loading') {
        throw new Error('Authentication loading');
      }

      if (!isAuthenticated) return [] as WeeklyPlaybookItem[];

      const response = await apiService.getNewsPlaybook();
      if (response.error) {
        throw new Error(response.error);
      }

      return mapApiPlaybookPayload(response.data);
    },
    staleTime: 5 * 60 * 1000,
    enabled: status !== 'loading',
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    items: data || [],
    loading: isLoading,
    error: error ? String(error) : null,
    refetch: () => {
      void refetch();
    },
  };
}
