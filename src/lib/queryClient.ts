import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,        // 2 minutes - data considered fresh
      gcTime: 5 * 60 * 1000,           // 5 minutes - cache lifetime
      refetchOnWindowFocus: false,     // SSE hooks manage their own catch-up on focus restore
      retry: 1,                        // Retry failed requests once
    },
  },
});
