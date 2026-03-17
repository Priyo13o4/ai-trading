import { Card } from '@/components/ui/card';
import { ChevronRight, Loader2, Radio, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { StrategyRecord } from '@/types/strategy';

const getExpiryText = (timestamp?: string, expiryMinutes?: number, nowMs: number = Date.now()): string | null => {
  if (!timestamp || !expiryMinutes || !Number.isFinite(expiryMinutes)) return null;

  const signalTime = new Date(timestamp).getTime();
  if (!Number.isFinite(signalTime)) return null;

  const expiryTime = signalTime + expiryMinutes * 60_000;
  const remainingMs = expiryTime - nowMs;
  const remainingSeconds = Math.floor(Math.abs(remainingMs) / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const countdown = `${minutes}m ${seconds}s`;

  if (remainingMs <= 0) {
    return `Expired ${countdown} ago`;
  }

  return `Expires in ${countdown}`;
};

const getNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getEntryDetails = (strategy: StrategyRecord): {
  entry: number | null;
  tp: number | null;
  sl: number | null;
} => {
  const signal = strategy.entry_signal;

  const entry =
    getNumericValue(signal?.level) ??
    getNumericValue(signal?.entry_price) ??
    getNumericValue(signal?.entryPrice) ??
    getNumericValue(signal?.entry) ??
    getNumericValue(signal?.price);

  const tp =
    getNumericValue(strategy.take_profit) ??
    getNumericValue(signal?.take_profit) ??
    getNumericValue(signal?.takeProfit) ??
    getNumericValue(signal?.tp);

  const sl =
    getNumericValue(strategy.stop_loss) ??
    getNumericValue(signal?.stop_loss) ??
    getNumericValue(signal?.stopLoss) ??
    getNumericValue(signal?.sl);

  return { entry, tp, sl };
};

const formatPrice = (value: number | null): string | null =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : null;

const formatDirection = (direction: StrategyRecord['direction']): string => {
  if (direction === 'long') return 'Long';
  if (direction === 'short') return 'Short';
  return 'Unknown';
};

interface StrategyListProps {
  strategies: StrategyRecord[] | undefined;
  loading?: boolean;
  isLive?: boolean;
  isCachedFallback?: boolean;
  lastUpdatedAt?: string | null;
  onRefresh?: () => void;
  error?: string | null;
  onSelect?: (strategy: StrategyRecord) => void;
}

export function StrategyList({
  strategies = [],
  loading = false,
  isLive = false,
  isCachedFallback = false,
  lastUpdatedAt = null,
  onRefresh,
  error = null,
  onSelect,
}: StrategyListProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <Card className="sa-news-card sa-liquid-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#E2B485] uppercase tracking-wide">
            Active Strategies
          </h3>
          <div className="flex items-center gap-2">
            {isCachedFallback && (
              <span className="text-[10px] uppercase tracking-wide text-amber-300">cached</span>
            )}
            {isLive && (
              <div className="flex items-center gap-1.5 text-xs">
                <Radio className="h-3 w-3 text-green-400 animate-pulse" />
                <span className="text-green-400">LIVE</span>
              </div>
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-300 hover:text-white"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {lastUpdatedAt && (
          <p className="mb-2 text-[11px] text-slate-400">
            Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
          </p>
        )}
        {error && (
          <p className="mb-2 text-xs text-amber-300">{error}</p>
        )}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#E2B485]" />
            </div>
          ) : strategies.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No active strategies</p>
          ) : (
            strategies.map((strategy) => {
              const details = getEntryDetails(strategy);
              const entryText = formatPrice(details.entry);
              const tpText = formatPrice(details.tp);
              const slText = formatPrice(details.sl);

              return (
                <button
                  key={`${strategy.strategy_id}-${strategy.timestamp}`}
                  onClick={() => onSelect?.(strategy)}
                  className="sa-news-card-muted w-full rounded-xl border border-[#C8935A]/20 p-3 text-left transition-colors hover:border-[#C8935A]/40"
                >
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{strategy.strategy_name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          strategy.direction === 'long'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {strategy.direction.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md border border-slate-700/60 p-2">
                        <p className="sa-muted">Direction</p>
                        <p className="text-slate-100">{formatDirection(strategy.direction)}</p>
                      </div>
                      <div className="rounded-md border border-slate-700/60 p-2">
                        <p className="sa-muted">Entry Signal</p>
                        <p className="font-mono text-slate-100">{entryText ?? '—'}</p>
                      </div>
                      <div className="rounded-md border border-slate-700/60 p-2">
                        <p className="sa-muted">TP</p>
                        <p className="font-mono text-slate-100">{tpText ?? '—'}</p>
                      </div>
                      <div className="rounded-md border border-slate-700/60 p-2">
                        <p className="sa-muted">SL</p>
                        <p className="font-mono text-slate-100">{slText ?? '—'}</p>
                      </div>
                    </div>

                    {getExpiryText(strategy.timestamp, strategy.expiry_minutes ?? undefined, nowMs) && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {getExpiryText(strategy.timestamp, strategy.expiry_minutes ?? undefined, nowMs)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })
          )}
        </div>
      </Card>
    </>
  );
}
