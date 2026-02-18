import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { useAuth } from '@/hooks/useAuth';

const MAX_STRATEGY_ITEMS = 50;

const statusWhitelist = new Set(['active', 'pending', 'closed']);

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const normalizeDirection = (value: unknown): 'long' | 'short' => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'short' || raw === 'sell' || raw === 'bearish') return 'short';
  return 'long';
};

const parseEntryPrice = (entrySignal: unknown): number | undefined => {
  if (!entrySignal) return undefined;

  const parsed =
    typeof entrySignal === 'string'
      ? (() => {
          try {
            return JSON.parse(entrySignal) as Record<string, unknown>;
          } catch {
            return null;
          }
        })()
      : (entrySignal as Record<string, unknown>);

  if (!parsed || typeof parsed !== 'object') return undefined;
  return (
    parseNumber(parsed.entry_price) ||
    parseNumber(parsed.entryPrice) ||
    parseNumber(parsed.price) ||
    parseNumber(parsed.entry)
  );
};

export interface StrategyCacheRecord {
  id: string;
  timestamp: string;
  name: string;
  status: 'active' | 'pending' | 'closed';
  direction: 'long' | 'short';
  entryPrice?: number;
  currentPrice?: number;
  pnl?: number;
  symbol?: string;
}

const toStrategyRecord = (raw: any): StrategyCacheRecord => {
  const timestamp = raw.timestamp || raw.created_at || new Date().toISOString();
  const status = String(raw.status || 'active').toLowerCase();

  return {
    id: String(raw.strategy_id ?? raw.id ?? `${raw.strategy_name || raw.name || 'strategy'}-${timestamp}`),
    timestamp,
    name: raw.strategy_name || raw.name || 'Strategy',
    status: statusWhitelist.has(status) ? (status as 'active' | 'pending' | 'closed') : 'active',
    direction: normalizeDirection(raw.direction),
    entryPrice: parseNumber(raw.entry_price) || parseEntryPrice(raw.entry_signal),
    currentPrice: parseNumber(raw.current_price),
    pnl: parseNumber(raw.pnl),
    symbol: raw.symbol || raw.pair || raw.trading_pair,
  };
};

const dedupeStrategies = (items: StrategyCacheRecord[]): StrategyCacheRecord[] => {
  const seen = new Set<string>();
  const out: StrategyCacheRecord[] = [];

  items.forEach((item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    out.push(item);
  });

  return out;
};

export interface UseSignalStrategiesResult {
  strategies: StrategyCacheRecord[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  lastUpdatedAt: string | null;
  refresh: () => void;
}

export function useSignalStrategies(symbol: string): UseSignalStrategiesResult {
  const { isAuthenticated, status } = useAuth();

  const [strategies, setStrategies] = useState<StrategyCacheRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden
  );

  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const previousVisibleRef = useRef(isVisible);
  const strategiesRef = useRef<StrategyCacheRecord[]>([]);

  useEffect(() => {
    strategiesRef.current = strategies;
  }, [strategies]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const fetchStrategies = useCallback(
    async (options?: { silent?: boolean }) => {
      if (status === 'loading') return;
      if (!isAuthenticated) {
        setStrategies([]);
        setLoading(false);
        setError(null);
        setIsLive(false);
        setLastUpdatedAt(null);
        hasFetchedRef.current = false;
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setError(null);
      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const response = await apiService.getStrategies(symbol);
        if (response.error) {
          throw new Error(response.error);
        }

        const payload = response.data as any;
        const list = Array.isArray(payload) ? payload : payload?.strategies || [];
        const mapped = dedupeStrategies(list.map(toStrategyRecord));

        setStrategies(mapped.slice(0, MAX_STRATEGY_ITEMS));
        const nowIso = new Date().toISOString();
        setLastUpdatedAt(nowIso);
      } catch (fetchError) {
        console.error('[useSignalStrategies] Failed to fetch strategies:', fetchError);
        setError('Failed to load strategies.');
        if (strategiesRef.current.length === 0) {
          setStrategies([]);
        }
      } finally {
        hasFetchedRef.current = true;
        isFetchingRef.current = false;
        setLoading(false);
      }
    },
    [isAuthenticated, status, symbol]
  );

  const refresh = useCallback(() => {
    void fetchStrategies();
  }, [fetchStrategies]);

  // initial fetch
  useEffect(() => {
    if (status === 'loading') return;
    void fetchStrategies();
  }, [fetchStrategies, status]);

  // subscribe to SSE only when visible
  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated || !isVisible) {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const unsubscribe = sseService.subscribeToStrategies(
      (data) => {
        if (!data || typeof data !== 'object') return;
        if (data.type === 'heartbeat' || data.type === 'connected') return;

        if (data.type === 'strategies_snapshot' && Array.isArray(data.strategies)) {
          const snapshot = dedupeStrategies(data.strategies.map(toStrategyRecord)).filter(
            (strategy) => !strategy.symbol || strategy.symbol === symbol
          );
          setStrategies(snapshot.slice(0, MAX_STRATEGY_ITEMS));
          const nowIso = new Date().toISOString();
          setLastUpdatedAt(nowIso);
          return;
        }

        if (data.type === 'strategy_update' && data.strategy) {
          const next = toStrategyRecord(data.strategy);
          if (next.symbol && next.symbol !== symbol) return;

          setStrategies((prev) => {
            const merged = dedupeStrategies([next, ...prev]).slice(0, MAX_STRATEGY_ITEMS);
            return merged;
          });
          setLastUpdatedAt(new Date().toISOString());
        }
      },
      (sseError) => {
        console.error('[useSignalStrategies] SSE error:', sseError);
        setIsLive(false);
      },
      symbol
    );

    return () => {
      unsubscribe();
      setIsLive(false);
    };
  }, [isAuthenticated, isVisible, status, symbol]);

  // visibility-driven catch-up fetch
  useEffect(() => {
    const wasVisible = previousVisibleRef.current;
    previousVisibleRef.current = isVisible;

    if (wasVisible || !isVisible) return;
    if (!isAuthenticated || status === 'loading') return;

    void fetchStrategies({ silent: true });
  }, [fetchStrategies, isAuthenticated, isVisible, status]);

  return {
    strategies,
    loading,
    error,
    isLive,
    lastUpdatedAt,
    refresh,
  };
}

export default useSignalStrategies;
