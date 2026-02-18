import { Card } from '@/components/ui/card';
import { ChevronRight, Loader2, Radio, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
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
}

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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
