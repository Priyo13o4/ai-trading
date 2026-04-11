import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toDisplayTimeframe, toHumanReadableText } from '@/lib/strategyFormatters';
import type { StrategyRecord } from '@/types/strategy';

interface HistoricalStrategiesTableProps {
  items: StrategyRecord[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onSelect: (strategy: StrategyRecord) => void;
}

const getDirectionTone = (direction: string) =>
  direction.toLowerCase() === 'long'
    ? 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 uppercase'
    : direction.toLowerCase() === 'short'
      ? 'text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 uppercase'
      : 'text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 uppercase';

interface StrategyBatch {
  id: string;
  day: string;
  latestTimestamp: string;
  longCount: number;
  shortCount: number;
  strategies: StrategyRecord[];
}

const toDayBucket = (value: string): string => {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'Unknown Date';
  return new Date(time).toISOString().slice(0, 10);
};

export function HistoricalStrategiesTable({
  items,
  total,
  limit,
  offset,
  page,
  totalPages,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onSelect,
}: HistoricalStrategiesTableProps) {
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const toggleBatch = (batchId: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  const batches = useMemo(() => {
    const map = new Map<string, StrategyBatch>();

    items.forEach((strategy) => {
      const batchKey = `day-${toDayBucket(strategy.timestamp)}`;

      if (!map.has(batchKey)) {
        map.set(batchKey, {
          id: batchKey,
          day: toDayBucket(strategy.timestamp),
          latestTimestamp: strategy.timestamp,
          longCount: 0,
          shortCount: 0,
          strategies: [],
        });
      }

      const b = map.get(batchKey)!;
      b.strategies.push(strategy);
      if (new Date(strategy.timestamp).getTime() > new Date(b.latestTimestamp).getTime()) {
        b.latestTimestamp = strategy.timestamp;
      }
      if (strategy.direction === 'long') b.longCount++;
      if (strategy.direction === 'short') b.shortCount++;
    });

    return Array.from(map.values())
      .map((batch) => ({
        ...batch,
        strategies: [...batch.strategies].sort((left, right) => {
          const timeDiff = new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
          if (timeDiff !== 0) return timeDiff;
          return right.strategy_id - left.strategy_id;
        }),
      }))
      .sort((a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime());
  }, [items]);

  const startRow = total === 0 ? 0 : offset + 1;
  const endRow = total === 0 ? 0 : Math.min(offset + batches.length, total);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold font-sora text-slate-100">History By Date</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>
            {startRow}-{endRow} of {total} date groups
          </span>
          <span>•</span>
          <span>
            Page {page} / {totalPages}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mb-2 pb-4 border-b border-[#E2B485]/10">
        <Button
          type="button"
          variant="outline"
          className="hover:bg-[#E2B485]/10 hover:text-[#E2B485] h-9 border-[#E2B485]/20 text-[#E2B485]/80 transition-colors"
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          className="hover:bg-[#E2B485]/10 hover:text-[#E2B485] h-9 border-[#E2B485]/20 text-[#E2B485]/80 transition-colors"
          onClick={onNextPage}
          disabled={!canNextPage}
        >
          Next
        </Button>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-xl border border-[#E2B485]/20 bg-[#111315] p-8 text-center text-slate-400">
          No historical strategies match current filters.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map((batch, index) => {
            const isExpanded = expandedBatches.has(batch.id);
            const dateStr = new Date(batch.latestTimestamp).toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              timeZoneName: 'short',
            });
            const timeStr = new Date(batch.latestTimestamp).toLocaleString('en-US', {
               hour: '2-digit',
               minute: '2-digit',
            });

            if (isExpanded) {
              return (
                <div key={batch.id} className="mt-4 overflow-hidden rounded-xl border border-[#E2B485]/20 bg-[#111315]">
                  <div 
                    className="p-4 flex flex-wrap gap-4 items-center justify-between bg-[#E2B485]/5 cursor-pointer"
                    onClick={() => toggleBatch(batch.id)}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[#E2B485] font-bold">Date Bucket - {dateStr}</span>
                      <p className="text-slate-100 text-base font-semibold">{batch.strategies.length} Signals Generated</p>
                    </div>
                    <button className="group flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E2B485]/30 text-[#E2B485] text-sm font-medium hover:bg-[#E2B485] hover:text-[#0a0908] transition-all duration-300">
                      Hide Details
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Expanded Strategy Table */}
                  <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse">
                      <TableHeader>
                        <TableRow className="border-b border-[#E2B485]/10 bg-[#E2B485]/5 hover:bg-[#E2B485]/5">
                          <TableHead className="px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold h-auto">Asset</TableHead>
                          <TableHead className="px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold text-center h-auto">Type</TableHead>
                          <TableHead className="px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold h-auto">TP / SL</TableHead>
                          <TableHead className="px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold text-center h-auto">R/R</TableHead>
                          <TableHead className="px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold h-auto">Timeframe</TableHead>
                          <TableHead className="px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold h-auto">Condition</TableHead>
                          <TableHead className="px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold text-right h-auto">AI Conf.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-[#E2B485]/5">
                        {batch.strategies.map((strategy) => {
                          const entryTimeframe = toDisplayTimeframe(strategy.entry_signal?.timeframe) ?? '—';
                          const entryCondition =
                            toHumanReadableText(
                              strategy.entry_signal?.entry_condition ??
                                strategy.entry_signal?.condition_type ??
                                strategy.entry_signal?.condition
                            ) ?? '—';
                          
                          return (
                          <TableRow 
                            key={strategy.strategy_id} 
                            className="hover:bg-[#E2B485]/5 border-none transition-colors cursor-pointer"
                            onClick={() => onSelect(strategy)}
                          >
                            <TableCell className="px-4 py-4">
                              <span className="text-sm font-medium text-slate-200">{strategy.symbol}</span>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-center">
                              <span className={getDirectionTone(strategy.direction)}>{strategy.direction}</span>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-emerald-400/90 text-[10px] font-mono">TP: {strategy.take_profit}</span>
                                <span className="text-rose-400/90 text-[10px] font-mono">SL: {strategy.stop_loss}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-center text-sm font-mono text-slate-400">
                              {strategy.risk_reward_ratio ? `1:${strategy.risk_reward_ratio}` : '—'}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-sm text-[#E2B485] font-semibold">
                              {entryTimeframe}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-xs text-slate-400 max-w-[150px] truncate">
                              {entryCondition}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-right">
                              <span className="text-sm font-bold text-[#E2B485]">{strategy.confidence}</span>
                            </TableCell>
                          </TableRow>
                        )})}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            }

            // Collapsed view (Earlier Records)
            return (
              <div 
                key={batch.id} 
                className={cn("flex flex-col gap-4", index === 0 ? "mt-2" : "mt-0")}
              >
                {index === 0 && (
                  <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#E2B485]/80">Earlier Records</h3>
                )}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl border border-[#E2B485]/10 bg-[#111315]/95 cursor-pointer hover:border-[#E2B485]/30 hover:bg-[#E2B485]/5 transition-all"
                  onClick={() => toggleBatch(batch.id)}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-slate-100 text-sm font-bold font-sora">{dateStr}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{batch.strategies.length} Signals Generated</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_#f43f5e]"></div>
                      </div>
                      <span className="text-[10px] text-slate-500 ml-1">
                          {batch.longCount} L / {batch.shortCount} S • Latest {timeStr}
                      </span>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-transparent text-[#E2B485] text-sm font-medium hover:bg-[#E2B485]/10 transition-all">
                    View Details
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default HistoricalStrategiesTable;
