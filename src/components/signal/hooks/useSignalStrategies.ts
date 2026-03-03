import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { useAuth } from '@/hooks/useAuth';

const MAX_STRATEGY_ITEMS = 50;

const statusWhitelist = new Set(['active', 'pending', 'closed']);
const activeStatuses = new Set(['active', 'pending']);

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
  tradeMode?: string;
  riskLevel?: string;
  tradeRecommended?: string;
  summary?: string;
  newsContext?: string;
  expiryMinutes?: number;
}

const toStrategyRecord = (raw: unknown): StrategyCacheRecord => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const timestamp = String(source.timestamp || source.created_at || new Date().toISOString());
  const status = String(source.status || 'active').toLowerCase();

  return {
    id: String(
      source.strategy_id ?? source.id ?? `${String(source.strategy_name || source.name || 'strategy')}-${timestamp}`
    ),
    timestamp,
    name: String(source.strategy_name || source.name || 'Strategy'),
    status: statusWhitelist.has(status) ? (status as 'active' | 'pending' | 'closed') : 'active',
    direction: normalizeDirection(source.direction),
    entryPrice: parseNumber(source.entry_price) || parseEntryPrice(source.entry_signal),
    currentPrice: parseNumber(source.current_price),
    pnl: parseNumber(source.pnl),
    symbol: String(source.symbol || source.pair || source.trading_pair || ''),
    tradeMode: typeof source.trade_mode === 'string' ? source.trade_mode : typeof source.mode === 'string' ? source.mode : undefined,
    riskLevel: typeof source.risk_level === 'string' ? source.risk_level : undefined,
    tradeRecommended:
      typeof source.trade_recommended === 'string'
        ? source.trade_recommended
        : typeof source.trade_recommended === 'boolean'
          ? source.trade_recommended
            ? 'yes'
            : 'no'
          : undefined,
    summary: typeof source.summary === 'string' ? source.summary : undefined,
    newsContext: typeof source.news_context === 'string' ? source.news_context : undefined,
    expiryMinutes: parseNumber(source.expiry_minutes),
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

const isActiveStrategy = (strategy: StrategyCacheRecord): boolean =>
  activeStatuses.has(strategy.status);

export interface UseSignalStrategiesResult {
  strategies: StrategyCacheRecord[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  isCachedFallback: boolean;
  lastUpdatedAt: string | null;
  refresh: () => void;
}

export function useSignalStrategies(symbol: string): UseSignalStrategiesResult {
  const { isAuthenticated, status } = useAuth();

  const [strategies, setStrategies] = useState<StrategyCacheRecord[]>([]);
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
    if (!isAuthenticated || !isVisible) {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const unsubscribe = sseService.subscribeToStrategies(
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
              return prev.filter((existing) => existing.id !== next.id);
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
    isCachedFallback,
    lastUpdatedAt,
    refresh,
  };
}

export default useSignalStrategies;
