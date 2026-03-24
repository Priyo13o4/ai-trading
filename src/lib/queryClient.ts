import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,        // 2 minutes - data considered fresh
      gcTime: 5 * 60 * 1000,           // 5 minutes - cache lifetime
      refetchOnWindowFocus: false,     // SSE hooks manage their own catch-up on focus restore
      retry: (failureCount, error: { status?: number } | null) => {
        if (error?.status === 503) {
          return failureCount < 1;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
