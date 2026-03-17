import { Radio } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  toDisplayTimeframe,
  toEntrySignalDisplay,
  toHumanReadableText,
} from '@/lib/strategyFormatters';
import type { StrategyRecord } from '@/types/strategy';

interface LiveStrategyCardsProps {
  items: StrategyRecord[];
  isLive: boolean;
  onSelect: (strategy: StrategyRecord) => void;
}

const getDirectionTone = (direction: string) =>
  direction.toLowerCase() === 'long'
    ? 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    : direction.toLowerCase() === 'short'
      ? 'text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20'
      : 'text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20';

const getDirectionAccent = (direction: string) =>
  direction.toLowerCase() === 'long'
    ? {
        line: 'rgba(16, 185, 129, 0.9)',
        edge: 'rgba(16, 185, 129, 0.26)',
        glow: 'rgba(16, 185, 129, 0.16)',
      }
    : direction.toLowerCase() === 'short'
      ? {
          line: 'rgba(244, 63, 94, 0.9)',
          edge: 'rgba(244, 63, 94, 0.26)',
          glow: 'rgba(244, 63, 94, 0.16)',
        }
      : {
          line: 'rgba(148, 163, 184, 0.7)',
          edge: 'rgba(148, 163, 184, 0.2)',
          glow: 'rgba(148, 163, 184, 0.12)',
        };

export function LiveStrategyCards({ items, isLive, onSelect }: LiveStrategyCardsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold sa-heading tracking-tight">Live Signals</h2>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Radio
            className={cn(
              'h-3.5 w-3.5',
              isLive ? 'animate-pulse text-emerald-400' : 'text-slate-600'
            )}
          />
          {isLive ? 'Streaming' : 'Snapshot'}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="sa-card rounded-xl p-0 text-center">
          <CardContent className="p-8 text-slate-300">No live strategies available.</CardContent>
        </Card>
      ) : (
        <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((strategy) => {
            const entrySignal = strategy.entry_signal;
            const accent = getDirectionAccent(strategy.direction);
            const entryCondition = toHumanReadableText(
              entrySignal?.entry_condition ?? entrySignal?.condition_type ?? entrySignal?.condition
            );
            const confirmationType = toHumanReadableText(
              entrySignal?.confirmation_type ?? entrySignal?.confirmation
            );
            const timeframe = toDisplayTimeframe(entrySignal?.timeframe);
            const entrySignalValue = toEntrySignalDisplay(entrySignal);

            return (
              <button
                key={strategy.strategy_id}
                type="button"
                onClick={() => onSelect(strategy)}
                className="group h-full text-left outline-none transition-all"
              >
                <Card className={cn(
                  "relative h-full overflow-hidden lumina-card p-0 transition-all duration-300 shadow-2xl border-t-4",
                  strategy.direction.toLowerCase() === 'long' 
                    ? "border-emerald-500 hover:border-emerald-800" 
                    : "border-rose-500 hover:border-rose-800"
                )}>
                  <div className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                  <CardContent className="flex h-full flex-col space-y-4 p-5 z-10 relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-h-[3.75rem] flex-col text-left">
                      <p className="font-sora text-lg font-extrabold tracking-wide text-[#EADBCB]">
                        {strategy.symbol}
                      </p>
                      <p className="font-sora text-sm font-semibold leading-snug text-slate-100">
                        {strategy.strategy_name}
                      </p>
                    </div>
                    <span className={getDirectionTone(strategy.direction)}>
                      {strategy.direction.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">TP</p>
                      <p className="font-mono font-medium text-emerald-400/90">
                        {strategy.take_profit}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">SL</p>
                      <p className="font-mono font-medium text-rose-400/90">
                        {strategy.stop_loss}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Confidence
                      </p>
                      <p className="font-medium text-slate-200">{strategy.confidence}</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">R:R</p>
                      <p className="font-mono font-medium text-slate-200">
                        {strategy.risk_reward_ratio ? `1:${strategy.risk_reward_ratio}` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Timeframe</p>
                      <p className="truncate font-medium text-slate-200">{timeframe ?? '—'}</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Entry Signal</p>
                      <p className="truncate font-mono font-medium text-slate-200">{entrySignalValue ?? '—'}</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Entry Condition</p>
                      <p className="truncate font-medium text-slate-200">{entryCondition ?? '—'}</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Confirmation</p>
                      <p className="truncate font-medium text-slate-200">{confirmationType ?? '—'}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-700/40 pt-3 text-[10px] font-medium tracking-wide text-slate-500">
                    <span className="uppercase">{strategy.status}</span>
                    <span>
                      {new Date(strategy.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default LiveStrategyCards;
