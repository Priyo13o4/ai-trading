import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Strategy {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'closed';
  direction: 'long' | 'short';
  entryPrice?: number;
  currentPrice?: number;
  pnl?: number;
  timestamp: string;
}

interface StrategyListProps {
  strategies: Strategy[];
}

export function StrategyList({ strategies }: StrategyListProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  return (
    <>
      <Card className="mesh-gradient-card border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-[#D4AF37] mb-3 uppercase tracking-wide">
          Active Strategies
        </h3>
        <div className="space-y-2">
          {strategies.length === 0 ? (
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
