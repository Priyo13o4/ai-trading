import { useCallback, useEffect, useRef, useState } from 'react';

import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { useAuth } from '@/hooks/useAuth';
import type { StrategyDirection, StrategyRecord, StrategyStatus } from '@/types/strategy';

const MAX_STRATEGY_ITEMS = 50;

const activeStatuses = new Set(['active', 'pending']);

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const parseJsonField = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const toDirection = (value: unknown): { direction: StrategyDirection; rawDirection: string | null } => {
  const rawDirection =
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : value == null ? null : String(value);
  const normalized = String(value || '').toLowerCase();

  if (normalized === 'long' || normalized === 'buy') {
    return { direction: 'long', rawDirection };
  }

  if (normalized === 'short' || normalized === 'sell') {
    return { direction: 'short', rawDirection };
  }

  return { direction: 'unknown', rawDirection };
};

const toStatus = (value: unknown): { status: StrategyStatus; rawStatus: string | null } => {
  const rawStatus =
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : value == null ? null : String(value);
  const normalized = String(value || '').toLowerCase();

  if (
    normalized === 'active' ||
    normalized === 'expired' ||
    normalized === 'executed' ||
    normalized === 'cancelled' ||
    normalized === 'invalidated' ||
    normalized === 'pending' ||
    normalized === 'closed'
  ) {
    return { status: normalized, rawStatus };
  }

  return { status: 'unknown', rawStatus };
};

const toDateString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
};

const coalesceDateString = (...values: unknown[]): string => {
  for (const value of values) {
    const parsed = toDateString(value);
    if (parsed) return parsed;
  }

  return new Date().toISOString();
};

const toBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return fallback;
};

const normalizeSymbol = (value: unknown): string =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const symbolAliasGroups: readonly string[][] = [
  ['XAUUSD', 'GOLD'],
  ['XAGUSD', 'SILVER'],
  ['BTCUSD', 'BTCUSDT'],
  ['ETHUSD', 'ETHUSDT'],
];

const symbolAliasMap = (() => {
  const map = new Map<string, string>();
  symbolAliasGroups.forEach((group) => {
    const canonical = group[0];
    group.forEach((alias) => map.set(alias, canonical));
  });
  return map;
})();

const canonicalizeSymbol = (value: unknown): string => {
  const normalized = normalizeSymbol(value);
  if (!normalized) return '';
  return symbolAliasMap.get(normalized) ?? normalized;
};

const matchesSymbol = (value: unknown, activeSymbol: string): boolean => {
  const normalizedValue = canonicalizeSymbol(value);
  const normalizedActive = canonicalizeSymbol(activeSymbol);

  if (!normalizedValue || !normalizedActive) return false;

  return normalizedValue === normalizedActive;
};

const toStrategyRecord = (raw: unknown): StrategyRecord => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const strategyId = Number(source.strategy_id ?? source.id ?? 0);
  const canonicalTimestamp = coalesceDateString(source.timestamp, source.created_at);
  const canonicalCreatedAt = coalesceDateString(source.created_at, source.timestamp);
  const { direction, rawDirection } = toDirection(source.direction);
  const { status, rawStatus } = toStatus(source.status);

  return {
    strategy_id: Number.isFinite(strategyId) ? strategyId : 0,
    batch_id: source.batch_id == null ? null : Number(source.batch_id),
    strategy_name: String(source.strategy_name ?? source.name ?? 'Unnamed strategy'),
    symbol: String(source.symbol ?? source.pair ?? source.trading_pair ?? 'UNKNOWN'),
    direction,
    raw_direction: rawDirection,
    entry_signal: parseJsonField(source.entry_signal),
    take_profit: parseNumber(source.take_profit) ?? 0,
    stop_loss: parseNumber(source.stop_loss) ?? 0,
    risk_reward_ratio: parseNumber(source.risk_reward_ratio),
    confidence: String(source.confidence ?? 'Unknown'),
    expiry_minutes: source.expiry_minutes == null ? null : Number(source.expiry_minutes),
    timestamp: canonicalTimestamp,
    expiry_time: coalesceDateString(source.expiry_time, canonicalTimestamp, canonicalCreatedAt),
    detailed_analysis: source.detailed_analysis == null ? null : String(source.detailed_analysis),
    market_context: parseJsonField(source.market_context),
    status,
    raw_status: rawStatus,
    executed_at: source.executed_at == null ? null : String(source.executed_at),
    created_at: canonicalCreatedAt,
    user_rating: parseNumber(source.user_rating),
    rating_count: Number(source.rating_count ?? 0) || 0,
    avg_rating: parseNumber(source.avg_rating),
    user_feedback: source.user_feedback == null ? null : String(source.user_feedback),
    trade_mode:
      source.trade_mode == null
        ? source.mode == null
          ? null
          : String(source.mode)
        : String(source.trade_mode),
    execution_allowed: toBool(source.execution_allowed, true),
    risk_level: source.risk_level == null ? null : String(source.risk_level),
    trade_recommended: toBool(source.trade_recommended, true),
    summary: source.summary == null ? null : String(source.summary),
    news_context: source.news_context == null ? null : String(source.news_context),
  };
};

const getStrategyKey = (strategy: StrategyRecord): string => {
  if (Number.isFinite(strategy.strategy_id) && strategy.strategy_id > 0) {
    return `id:${strategy.strategy_id}`;
  }

  return `${strategy.strategy_name}-${strategy.symbol}-${strategy.timestamp}`;
};

const dedupeStrategies = (items: StrategyRecord[]): StrategyRecord[] => {
  const seen = new Set<string>();
  const out: StrategyRecord[] = [];

  items.forEach((item) => {
    const key = getStrategyKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });

  return out;
};

const isActiveStrategy = (strategy: StrategyRecord): boolean =>
  activeStatuses.has(strategy.status);

export interface UseSignalStrategiesResult {
  strategies: StrategyRecord[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  isCachedFallback: boolean;
  lastUpdatedAt: string | null;
  refresh: () => void;
}

export function useSignalStrategies(symbol: string): UseSignalStrategiesResult {
  const { isAuthenticated, status, backendAvailable, isRefreshing, authResolved } = useAuth();

  const [strategies, setStrategies] = useState<StrategyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isCachedFallback, setIsCachedFallback] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden
  );

  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const previousVisibleRef = useRef(isVisible);
  const strategiesRef = useRef<StrategyRecord[]>([]);
  const hiddenAtRef = useRef<number>(0);

  useEffect(() => {
    strategiesRef.current = strategies;
  }, [strategies]);

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

  const fetchStrategies = useCallback(
    async (options?: { silent?: boolean }) => {
      if (status === 'loading') return;
      if (!isAuthenticated) {
        setStrategies([]);
        setLoading(false);
        setError(null);
        setIsLive(false);
        setIsCachedFallback(false);
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

        const payload = response.data as unknown;
        const payloadRecord =
          payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payloadRecord?.strategies)
            ? payloadRecord.strategies
            : [];
        const mapped = dedupeStrategies(list.map(toStrategyRecord)).filter((strategy) =>
          matchesSymbol(strategy.symbol, symbol) && isActiveStrategy(strategy)
        );

        setStrategies(mapped.slice(0, MAX_STRATEGY_ITEMS));
        setIsCachedFallback(false);
        const nowIso = new Date().toISOString();
        setLastUpdatedAt(nowIso);
      } catch (fetchError) {
        console.error('[useSignalStrategies] Failed to fetch strategies:', fetchError);
        setError('Failed to load strategies.');
        setIsCachedFallback(strategiesRef.current.length > 0);
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
    if (!isAuthenticated || !backendAvailable) {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const unsubscribe = sseService.subscribeToSignalMuxStrategies(
      symbol,
      (data) => {
        if (!data || typeof data !== 'object') return;
        const event = data as {
          type?: string;
          strategies?: unknown[];
          strategy?: unknown;
        };
        if (event.type === 'heartbeat' || event.type === 'connected') return;

        if (event.type === 'strategies_snapshot' && Array.isArray(event.strategies)) {
          const snapshot = dedupeStrategies(event.strategies.map(toStrategyRecord)).filter(
            (strategy) => matchesSymbol(strategy.symbol, symbol) && isActiveStrategy(strategy)
          );
          setStrategies(snapshot.slice(0, MAX_STRATEGY_ITEMS));
          setIsCachedFallback(false);
          const nowIso = new Date().toISOString();
          setLastUpdatedAt(nowIso);
          return;
        }

        if (event.type === 'strategy_update' && event.strategy) {
          const next = toStrategyRecord(event.strategy);
          if (!matchesSymbol(next.symbol, symbol)) return;

          setStrategies((prev) => {
            if (!isActiveStrategy(next)) {
              const nextKey = getStrategyKey(next);
              return prev.filter((existing) => getStrategyKey(existing) !== nextKey);
            }

            const merged = dedupeStrategies([next, ...prev]).slice(0, MAX_STRATEGY_ITEMS);
            return merged;
          });
          setIsCachedFallback(false);
          setLastUpdatedAt(new Date().toISOString());
        }
      },
      (sseError) => {
        console.error('[useSignalStrategies] SSE error:', sseError);
        setIsLive(false);
      }
    );

    return () => {
      unsubscribe();
      setIsLive(false);
    };
  }, [backendAvailable, isAuthenticated, status, symbol]);

  // visibility-driven catch-up fetch
  useEffect(() => {
    const wasVisible = previousVisibleRef.current;
    previousVisibleRef.current = isVisible;

    if (wasVisible || !isVisible) return;
    if (!isAuthenticated || status === 'loading' || !authResolved || isRefreshing) return;
    
    if (Date.now() - hiddenAtRef.current > 30000) {
      void fetchStrategies({ silent: true });
    }
  }, [fetchStrategies, isAuthenticated, isVisible, status, authResolved, isRefreshing]);

  return {
    strategies,
    loading,
    error,
    isLive,
    isCachedFallback,
    lastUpdatedAt,
    refresh,
  };
}

export default useSignalStrategies;
