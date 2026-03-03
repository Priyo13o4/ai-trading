import { Radio } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StrategyRecord } from '@/types/strategy';

interface LiveStrategyCardsProps {
  items: StrategyRecord[];
  isLive: boolean;
  onSelect: (strategy: StrategyRecord) => void;
}

const getDirectionTone = (direction: StrategyRecord['direction']) =>
  direction === 'long'
    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
    : direction === 'short'
      ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
      : 'bg-slate-500/20 text-slate-200 border-slate-400/40';

export function LiveStrategyCards({ items, isLive, onSelect }: LiveStrategyCardsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold sa-heading">Live strategy cards</h2>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Radio className={cn('h-3.5 w-3.5', isLive ? 'animate-pulse text-emerald-300' : 'text-slate-500')} />
          {isLive ? 'Streaming' : 'Snapshot'}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="sa-card">
          <CardContent className="p-6 text-sm sa-muted">No live strategies for current filters.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((strategy) => (
            <button
              key={strategy.strategy_id}
              type="button"
              onClick={() => onSelect(strategy)}
              className="text-left"
            >
              <Card className="trading-card border-slate-700/60 transition hover:border-amber-300/30">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{strategy.strategy_name}</p>
                      <p className="text-xs sa-muted">{strategy.symbol}</p>
                    </div>
                    <Badge className={cn('border', getDirectionTone(strategy.direction))}>
                      {strategy.direction.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-slate-700/60 p-2">
                      <p className="sa-muted">TP</p>
                      <p className="font-mono text-slate-100">{strategy.take_profit}</p>
                    </div>
                    <div className="rounded-md border border-slate-700/60 p-2">
                      <p className="sa-muted">SL</p>
                      <p className="font-mono text-slate-100">{strategy.stop_loss}</p>
                    </div>
                    <div className="rounded-md border border-slate-700/60 p-2">
                      <p className="sa-muted">Confidence</p>
                      <p className="text-slate-100">{strategy.confidence}</p>
                    </div>
                    <div className="rounded-md border border-slate-700/60 p-2">
                      <p className="sa-muted">R:R</p>
                      <p className="font-mono text-slate-100">{strategy.risk_reward_ratio ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] sa-muted">
                    <span>{strategy.status}</span>
                    <span>{new Date(strategy.timestamp).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default LiveStrategyCards;
