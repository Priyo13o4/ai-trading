import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { useAuth } from '@/hooks/useAuth';
import type {
  StrategyAllResponse,
  StrategyDirection,
  StrategyFilters,
  StrategyQueryParams,
  StrategyRecord,
  StrategyStatus,
} from '@/types/strategy';

const ACTIVE_LIKE: StrategyStatus[] = ['active', 'pending'];

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
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

const matchesSymbol = (value: unknown, target: string): boolean => {
  const normalizedValue = canonicalizeSymbol(value);
  const normalizedTarget = canonicalizeSymbol(target);
  if (!normalizedValue || !normalizedTarget) return false;
  return normalizedValue === normalizedTarget;
};

const normalizeStrategy = (raw: Record<string, unknown>): StrategyRecord => {
  const strategyId = Number(raw.strategy_id ?? raw.id ?? 0);
  const canonicalTimestamp = coalesceDateString(raw.timestamp, raw.created_at);
  const canonicalCreatedAt = coalesceDateString(raw.created_at, raw.timestamp);
  const { direction, rawDirection } = toDirection(raw.direction);
  const { status, rawStatus } = toStatus(raw.status);

  return {
    strategy_id: Number.isFinite(strategyId) ? strategyId : 0,
    batch_id: raw.batch_id == null ? null : Number(raw.batch_id),
    strategy_name: String(raw.strategy_name ?? raw.name ?? 'Unnamed strategy'),
    symbol: String(raw.symbol ?? raw.pair ?? raw.trading_pair ?? 'UNKNOWN'),
    direction,
    raw_direction: rawDirection,
    entry_signal: parseJsonField(raw.entry_signal),
    take_profit: parseNumber(raw.take_profit) ?? 0,
    stop_loss: parseNumber(raw.stop_loss) ?? 0,
    risk_reward_ratio: parseNumber(raw.risk_reward_ratio),
    confidence: String(raw.confidence ?? 'Unknown'),
    expiry_minutes: raw.expiry_minutes == null ? null : Number(raw.expiry_minutes),
    timestamp: canonicalTimestamp,
    expiry_time: coalesceDateString(raw.expiry_time, canonicalTimestamp, canonicalCreatedAt),
    detailed_analysis: raw.detailed_analysis == null ? null : String(raw.detailed_analysis),
    market_context: parseJsonField(raw.market_context),
    status,
    raw_status: rawStatus,
    executed_at: raw.executed_at == null ? null : String(raw.executed_at),
    created_at: canonicalCreatedAt,
    user_rating: parseNumber(raw.user_rating),
    rating_count: Number(raw.rating_count ?? 0) || 0,
    avg_rating: parseNumber(raw.avg_rating),
    user_feedback: raw.user_feedback == null ? null : String(raw.user_feedback),
    trade_mode:
      raw.trade_mode == null
        ? raw.mode == null
          ? null
          : String(raw.mode)
        : String(raw.trade_mode),
    execution_allowed: toBool(raw.execution_allowed, true),
    risk_level: raw.risk_level == null ? null : String(raw.risk_level),
    trade_recommended: toBool(raw.trade_recommended, true),
    summary: raw.summary == null ? null : String(raw.summary),
    news_context: raw.news_context == null ? null : String(raw.news_context),
  };
};

const dedupeById = (rows: StrategyRecord[]): StrategyRecord[] => {
  const seen = new Set<number>();
  const output: StrategyRecord[] = [];

  rows.forEach((row) => {
    if (seen.has(row.strategy_id)) return;
    seen.add(row.strategy_id);
    output.push(row);
  });

  return output;
};

export interface UseStrategyPageDataResult {
  loading: boolean;
  error: string | null;
  isLive: boolean;
  lastUpdatedAt: string | null;
  filters: StrategyFilters;
  setFilters: Dispatch<SetStateAction<StrategyFilters>>;
  allStrategies: StrategyRecord[];
  filteredStrategies: StrategyRecord[];
  liveStrategies: StrategyRecord[];
  historicalStrategies: StrategyRecord[];
  liveCount: number;
  availableSymbols: string[];
  historicalTotal: number;
  historicalLimit: number;
  historicalOffset: number;
  historicalPage: number;
  historicalTotalPages: number;
  canPreviousHistoricalPage: boolean;
  canNextHistoricalPage: boolean;
  goToPreviousHistoricalPage: () => void;
  goToNextHistoricalPage: () => void;
  refresh: () => void;
  selected: StrategyRecord | null;
  setSelected: (strategy: StrategyRecord | null) => void;
}

const defaultFilters: StrategyFilters = {
  search: '',
  symbol: 'all',
  status: 'all',
  direction: 'all',
};

const DEFAULT_HISTORICAL_LIMIT = 20;
const HISTORICAL_FETCH_BATCH_SIZE = 100;

const getDayBucket = (value: string): string => {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'unknown-day';
  return new Date(time).toISOString().slice(0, 10);
};

const toErrorMessage = (value: unknown, fallback: string): string => {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === 'string' && value.trim()) return value;

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const detail = record.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof record.message === 'string' && record.message.trim()) return record.message;
    if (typeof record.error === 'string' && record.error.trim()) return record.error;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export function useStrategyPageData(
  queryParams: StrategyQueryParams = { include_historical: true }
): UseStrategyPageDataResult {
  const { isAuthenticated, status, backendAvailable } = useAuth();
  const queryPair = queryParams.pair;

  const [allStrategies, setAllStrategies] = useState<StrategyRecord[]>([]);
  const [historicalRows, setHistoricalRows] = useState<StrategyRecord[]>([]);
  const [filters, setFilters] = useState<StrategyFilters>(defaultFilters);
  const [liveLoading, setLiveLoading] = useState(true);
  const [historicalLoading, setHistoricalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [historicalLimit] = useState(DEFAULT_HISTORICAL_LIMIT);
  const [historicalOffset, setHistoricalOffset] = useState(0);
  const [selected, setSelected] = useState<StrategyRecord | null>(null);

  const fetchLiveStrategies = useCallback(async () => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      setLiveLoading(false);
      setError(null);
      setAllStrategies([]);
      setLastUpdatedAt(null);
      setIsLive(false);
      return;
    }

    setLiveLoading(true);
    setError(null);

    try {
      const effectivePair = filters.symbol !== 'all' ? filters.symbol : queryPair;
      const liveParams: StrategyQueryParams = {
        include_historical: false,
        ...(effectivePair ? { pair: effectivePair } : {}),
      };

      const response = await apiService.getStrategies(liveParams);
      if (response.error) throw new Error(response.error);

      const payload = response.data as Record<string, unknown> | StrategyRecord[] | undefined;
      const list = Array.isArray(payload) ? payload : payload?.strategies ?? [];
      const normalized = dedupeById((list as Record<string, unknown>[]).map(normalizeStrategy)).sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      );

      setAllStrategies(normalized);
      setLastUpdatedAt(new Date().toISOString());
    } catch (fetchError) {
      const message = toErrorMessage(fetchError, 'Failed to load strategies');
      setError(message);
    } finally {
      setLiveLoading(false);
    }
  }, [filters.symbol, isAuthenticated, queryPair, status]);

  const fetchHistoricalStrategies = useCallback(async () => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      setHistoricalLoading(false);
      setHistoricalRows([]);
      return;
    }

    setHistoricalLoading(true);
    setError(null);

    try {
      const direction =
        filters.direction === 'all' ? undefined : filters.direction === 'long' ? 'buy' : 'sell';
      const symbol = filters.symbol === 'all' ? undefined : filters.symbol;
      const statusFilter = filters.status === 'all' ? undefined : filters.status;

      const query = {
        symbol,
        direction,
        status: statusFilter,
        search: filters.search.trim() || undefined,
      };

      const collected: Record<string, unknown>[] = [];
      let cursor = 0;
      let total = Number.POSITIVE_INFINITY;

      while (cursor < total) {
        const response = await apiService.getStrategiesAll({
          ...query,
          limit: HISTORICAL_FETCH_BATCH_SIZE,
          offset: cursor,
        });

        if (response.error) {
          throw new Error(toErrorMessage(response.error, 'Failed to load historical strategies'));
        }

        const payload = (response.data ?? {}) as Partial<StrategyAllResponse>;
        const list = Array.isArray(payload.strategies) ? payload.strategies : [];
        const chunk = list as Record<string, unknown>[];
        collected.push(...chunk);

        if (typeof payload.total === 'number' && Number.isFinite(payload.total)) {
          total = payload.total;
        }

        if (chunk.length < HISTORICAL_FETCH_BATCH_SIZE) {
          break;
        }

        cursor += HISTORICAL_FETCH_BATCH_SIZE;
      }

      const normalized = dedupeById(collected.map(normalizeStrategy)).sort(
        (left, right) => {
          const timeDiff = new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
          if (timeDiff !== 0) return timeDiff;
          return right.strategy_id - left.strategy_id;
        }
      );

      setHistoricalRows(normalized);
    } catch (fetchError) {
      const message = toErrorMessage(fetchError, 'Failed to load historical strategies');
      setError(message);
    } finally {
      setHistoricalLoading(false);
    }
  }, [
    filters.direction,
    filters.search,
    filters.status,
    filters.symbol,
    isAuthenticated,
    status,
  ]);

  useEffect(() => {
    setHistoricalOffset(0);
  }, [filters.direction, filters.status, filters.symbol, filters.search]);

  useEffect(() => {
    void fetchLiveStrategies();
  }, [fetchLiveStrategies]);

  useEffect(() => {
    void fetchHistoricalStrategies();
  }, [fetchHistoricalStrategies]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated || !backendAvailable) {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const streamPair = filters.symbol !== 'all' ? filters.symbol : queryPair;
    const unsubscribe = sseService.subscribeToStrategies(
      (payload) => {
        if (!payload || typeof payload !== 'object') return;
        const event = payload as {
          type?: string;
          strategies?: Record<string, unknown>[];
          strategy?: Record<string, unknown>;
        };

        if (event.type === 'heartbeat' || event.type === 'connected') return;

        if (event.type === 'strategies_snapshot' && Array.isArray(event.strategies)) {
          const snapshot = dedupeById(event.strategies.map(normalizeStrategy)).sort(
            (left, right) =>
              new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
          );
          setAllStrategies(snapshot);
          setLastUpdatedAt(new Date().toISOString());
          return;
        }

        if (event.type === 'strategy_update' && event.strategy) {
          const incoming = normalizeStrategy(event.strategy);
          
          if (streamPair && !matchesSymbol(incoming.symbol, streamPair)) {
            return;
          }

          setAllStrategies((previous) => {
            const merged = dedupeById([incoming, ...previous]);
            return merged.sort(
              (left, right) =>
                new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
            );
          });
          setLastUpdatedAt(new Date().toISOString());
        }
      },
      () => {
        setIsLive(false);
      },
      streamPair
    );

    return () => {
      unsubscribe();
      setIsLive(false);
    };
  }, [backendAvailable, filters.symbol, isAuthenticated, queryPair, status]);

  const filteredStrategies = useMemo(() => {
    return allStrategies.filter((strategy) => {
      if (filters.symbol !== 'all' && !matchesSymbol(strategy.symbol, filters.symbol)) return false;
      if (filters.status !== 'all' && strategy.status !== filters.status) return false;
      if (filters.direction !== 'all' && strategy.direction !== filters.direction) return false;

      if (!filters.search.trim()) return true;

      const query = filters.search.trim().toLowerCase();
      const haystack = [
        strategy.strategy_name,
        strategy.symbol,
        strategy.status,
        strategy.raw_status ?? '',
        strategy.direction,
        strategy.raw_direction ?? '',
        strategy.confidence,
        strategy.trade_mode ?? '',
        strategy.summary ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [allStrategies, filters.direction, filters.search, filters.status, filters.symbol]);

  const liveStrategies = useMemo(
    () => filteredStrategies.filter((strategy) => ACTIVE_LIKE.includes(strategy.status)).slice(0, 12),
    [filteredStrategies]
  );

  const historicalGroupedKeys = useMemo(() => {
    const keys = new Set<string>();
    historicalRows.forEach((row) => {
      keys.add(getDayBucket(row.timestamp));
    });
    return Array.from(keys).sort((left, right) => right.localeCompare(left));
  }, [historicalRows]);

  useEffect(() => {
    const maxOffset = Math.max(0, historicalGroupedKeys.length - (historicalLimit || DEFAULT_HISTORICAL_LIMIT));
    if (historicalOffset > maxOffset) {
      setHistoricalOffset(maxOffset);
    }
  }, [historicalGroupedKeys.length, historicalLimit, historicalOffset]);

  const historicalPageGroupKeys = useMemo(
    () => historicalGroupedKeys.slice(historicalOffset, historicalOffset + historicalLimit),
    [historicalGroupedKeys, historicalLimit, historicalOffset]
  );

  const historicalStrategies = useMemo(() => {
    const visibleBuckets = new Set(historicalPageGroupKeys);
    return historicalRows.filter((row) => visibleBuckets.has(getDayBucket(row.timestamp)));
  }, [historicalPageGroupKeys, historicalRows]);

  const liveCount = useMemo(
    () => allStrategies.filter((strategy) => ACTIVE_LIKE.includes(strategy.status)).length,
    [allStrategies]
  );

  const availableSymbols = useMemo(() => {
    const symbols = new Set([
      ...allStrategies.map((strategy) => strategy.symbol),
      ...historicalRows.map((strategy) => strategy.symbol),
    ]);
    return Array.from(symbols).sort();
  }, [allStrategies, historicalRows]);

  const historicalGroupTotal = historicalGroupedKeys.length;

  const historicalPage = useMemo(
    () => (historicalLimit > 0 ? Math.floor(historicalOffset / historicalLimit) + 1 : 1),
    [historicalOffset, historicalLimit]
  );

  const historicalTotalPages = useMemo(
    () => (historicalLimit > 0 ? Math.max(1, Math.ceil(historicalGroupTotal / historicalLimit)) : 1),
    [historicalGroupTotal, historicalLimit]
  );

  const canPreviousHistoricalPage = historicalOffset > 0;
  const canNextHistoricalPage =
    historicalOffset + historicalLimit < historicalGroupTotal;

  const historicalDisplayTotal = historicalGroupTotal;

  const loading = liveLoading || historicalLoading;

  const refresh = useCallback(() => {
    void fetchLiveStrategies();
    void fetchHistoricalStrategies();
  }, [fetchHistoricalStrategies, fetchLiveStrategies]);

  return {
    loading,
    error,
    isLive,
    lastUpdatedAt,
    filters,
    setFilters,
    allStrategies,
    filteredStrategies,
    liveStrategies,
    historicalStrategies,
    liveCount,
    availableSymbols,
    historicalTotal: historicalDisplayTotal,
    historicalLimit,
    historicalOffset,
    historicalPage,
    historicalTotalPages,
    canPreviousHistoricalPage,
    canNextHistoricalPage,
    goToPreviousHistoricalPage: () => {
      setHistoricalOffset((current) => Math.max(0, current - historicalLimit));
    },
    goToNextHistoricalPage: () => {
      if (!canNextHistoricalPage) return;
      setHistoricalOffset((current) => current + historicalLimit);
    },
    refresh,
    selected,
    setSelected,
  };
}

export default useStrategyPageData;
