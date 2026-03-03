import { Card } from '@/components/ui/card';
import { ChevronRight, Loader2, Radio, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface Strategy {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'closed';
  direction: 'long' | 'short';
  entryPrice?: number;
  currentPrice?: number;
  pnl?: number;
  timestamp: string;
  symbol?: string;
  tradeMode?: string;
  riskLevel?: string;
  tradeRecommended?: string;
  summary?: string;
  newsContext?: string;
  expiryMinutes?: number;
}

const toTitleCase = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ');

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

interface StrategyListProps {
  strategies: Strategy[] | undefined;
  loading?: boolean;
  isLive?: boolean;
  isCachedFallback?: boolean;
  lastUpdatedAt?: string | null;
  onRefresh?: () => void;
  error?: string | null;
}

export function StrategyList({
  strategies = [],
  loading = false,
  isLive = false,
  isCachedFallback = false,
  lastUpdatedAt = null,
  onRefresh,
  error = null,
}: StrategyListProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <Card className="mesh-gradient-card border-slate-700/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wide">
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
              <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            </div>
          ) : strategies.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No active strategies</p>
          ) : (
            strategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy)}
                className="w-full flex items-center justify-between p-3 rounded-lg mesh-gradient-secondary hover:border-[#D4AF37]/30 transition-colors border border-slate-700/50"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{strategy.name}</span>
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
                  {strategy.pnl !== undefined && (
                    <p
                      className={`text-xs ${
                        strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {strategy.pnl >= 0 ? '+' : ''}
                      {strategy.pnl.toFixed(2)}%
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {strategy.tradeMode && (
                      <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-200">
                        {toTitleCase(strategy.tradeMode)}
                      </span>
                    )}
                    {strategy.riskLevel && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                        {toTitleCase(strategy.riskLevel)} Risk
                      </span>
                    )}
                    {strategy.tradeRecommended && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                        {toTitleCase(strategy.tradeRecommended)}
                      </span>
                    )}
                  </div>
                  {getExpiryText(strategy.timestamp, strategy.expiryMinutes, nowMs) && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {getExpiryText(strategy.timestamp, strategy.expiryMinutes, nowMs)}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Strategy Details Dialog */}
      <Dialog open={!!selectedStrategy} onOpenChange={() => setSelectedStrategy(null)}>
        <DialogContent className="mesh-gradient-card border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedStrategy?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Strategy details and performance
            </DialogDescription>
          </DialogHeader>
          {selectedStrategy && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Direction</p>
                  <p
                    className={`text-lg font-semibold ${
                      selectedStrategy.direction === 'long' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {selectedStrategy.direction.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
                  <p className="text-lg font-semibold text-[#D4AF37]">
                    {selectedStrategy.status.toUpperCase()}
                  </p>
                </div>
                {selectedStrategy.entryPrice && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Entry Price</p>
                    <p className="text-lg font-semibold">{selectedStrategy.entryPrice.toFixed(2)}</p>
                  </div>
                )}
                {selectedStrategy.currentPrice && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Current Price</p>
                    <p className="text-lg font-semibold">
                      {selectedStrategy.currentPrice.toFixed(2)}
                    </p>
                  </div>
                )}
                {selectedStrategy.pnl !== undefined && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">P&L</p>
                    <p
                      className={`text-lg font-semibold ${
                        selectedStrategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {selectedStrategy.pnl >= 0 ? '+' : ''}
                      {selectedStrategy.pnl.toFixed(2)}%
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Timestamp</p>
                  <p className="text-sm">{new Date(selectedStrategy.timestamp).toLocaleString()}</p>
                </div>
                {selectedStrategy.tradeMode && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Trade Mode</p>
                    <p className="text-sm text-slate-100">{toTitleCase(selectedStrategy.tradeMode)}</p>
                  </div>
                )}
                {selectedStrategy.riskLevel && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Risk Level</p>
                    <p className="text-sm text-slate-100">{toTitleCase(selectedStrategy.riskLevel)}</p>
                  </div>
                )}
                {selectedStrategy.tradeRecommended && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Trade Recommended</p>
                    <p className="text-sm text-slate-100">{toTitleCase(selectedStrategy.tradeRecommended)}</p>
                  </div>
                )}
                {getExpiryText(selectedStrategy.timestamp, selectedStrategy.expiryMinutes, nowMs) && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Expiry</p>
                    <p className="text-sm text-slate-100">
                      {getExpiryText(selectedStrategy.timestamp, selectedStrategy.expiryMinutes, nowMs)}
                    </p>
                  </div>
                )}
              </div>
              {selectedStrategy.summary && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Summary</p>
                  <p className="text-sm leading-relaxed text-slate-200">{selectedStrategy.summary}</p>
                </div>
              )}
              {selectedStrategy.newsContext && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">News Context</p>
                  <p className="text-sm leading-relaxed text-slate-200">{selectedStrategy.newsContext}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
