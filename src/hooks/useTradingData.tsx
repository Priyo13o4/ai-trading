/**
 * Custom hook for managing trading data from the FastAPI backend
 * Handles authentication, caching, polling, and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { 
  parseSignalFromAPI, 
  parseRegimeFromAPI, 
  parseCurrentNewsFromAPI, 
  parseUpcomingNewsFromAPI 
} from '@/lib/apiParsers';
import type { UIStrategy } from '@/types/signal';

interface UseTradingDataOptions {
  selectedPair: string;
  token?: string;
  pollInterval?: number;
  enabled?: boolean;
}

interface TradingDataState {
  strategies: UIStrategy[];
  regimeText: string | null;
  currentNews: { id: string; text: string }[];
  upcoming: ReturnType<typeof parseUpcomingNewsFromAPI>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useTradingData(options: UseTradingDataOptions) {
  const { 
    selectedPair, 
    token, 
    pollInterval = 30000, // 30 seconds
    enabled = true 
  } = options;

  const [state, setState] = useState<TradingDataState>({
    strategies: [],
    regimeText: null,
    currentNews: [],
    upcoming: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const fetchData = useCallback(async (showToasts = false) => {
    if (!enabled) return;

    // Check auth requirements for restricted pairs
    if (selectedPair !== "XAUUSD" && !token) {
      if (showToasts) {
        toast.error("Please log in to view signals for this pair.");
      }
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Authentication required for this pair",
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all data in parallel
      const [signalResult, regimeResult, currentNewsResult, upcomingResult] = await Promise.allSettled([
        apiService.getSignal(selectedPair, token),
        apiService.getRegime(token),
        apiService.getCurrentNews(token),
        apiService.getUpcomingNews(token),
      ]);

      let hasAuthError = false;
      let hasRateLimitError = false;

      // Process signal data
      let strategies: UIStrategy[] = [];
      if (signalResult.status === 'fulfilled' && signalResult.value.data) {
        const parsedSignal = parseSignalFromAPI(signalResult.value.data);
        strategies = parsedSignal ? [parsedSignal] : [];
      } else if (signalResult.status === 'fulfilled') {
        if (signalResult.value.status === 401) hasAuthError = true;
        if (signalResult.value.status === 402) hasRateLimitError = true;
      }

      // Process regime data
      let regimeText: string | null = null;
      if (regimeResult.status === 'fulfilled' && regimeResult.value.data) {
        regimeText = parseRegimeFromAPI(regimeResult.value.data);
      } else if (regimeResult.status === 'fulfilled') {
        if (regimeResult.value.status === 401) hasAuthError = true;
        if (regimeResult.value.status === 402) hasRateLimitError = true;
      }

      // Process current news data
      let currentNews: { id: string; text: string }[] = [];
      if (currentNewsResult.status === 'fulfilled' && currentNewsResult.value.data) {
        currentNews = parseCurrentNewsFromAPI(currentNewsResult.value.data);
      } else if (currentNewsResult.status === 'fulfilled') {
        if (currentNewsResult.value.status === 401) hasAuthError = true;
        if (currentNewsResult.value.status === 402) hasRateLimitError = true;
      }

      // Process upcoming news data
      let upcoming: ReturnType<typeof parseUpcomingNewsFromAPI> = null;
      if (upcomingResult.status === 'fulfilled' && upcomingResult.value.data) {
        upcoming = parseUpcomingNewsFromAPI(upcomingResult.value.data);
      } else if (upcomingResult.status === 'fulfilled') {
        if (upcomingResult.value.status === 401) hasAuthError = true;
        if (upcomingResult.value.status === 402) hasRateLimitError = true;
      }

      // Show relevant error toasts
      if (showToasts) {
        if (hasAuthError) {
          toast.error("Authentication required. Please log in.");
        } else if (hasRateLimitError) {
          toast.error("Free limit reached. Please log in for unlimited access.");
        }
      }

      setState({
        strategies,
        regimeText,
        currentNews,
        upcoming,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load data";
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      if (showToasts) {
        toast.error("Failed to load data. Please try again.");
      }
    }
  }, [selectedPair, token, enabled]);

  // Initial load and polling setup
  useEffect(() => {
    if (!enabled) return;

    // Initial load (with toasts)
    fetchData(true);

    // Set up polling (without toasts to avoid spam)
    const interval = setInterval(() => fetchData(false), pollInterval);

    return () => clearInterval(interval);
  }, [fetchData, pollInterval, enabled]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Health check function
  const checkHealth = useCallback(async () => {
    try {
      const result = await apiService.healthCheck();
      return result.status === 200;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    refresh,
    checkHealth,
  };
}
