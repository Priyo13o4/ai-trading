import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,        // 2 minutes - data considered fresh
      gcTime: 5 * 60 * 1000,           // 5 minutes - cache lifetime
      refetchOnWindowFocus: true,      // Refetch when tab regains focus
      retry: 1,                        // Retry failed requests once
    },
  },
});
