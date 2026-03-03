import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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

const toneByStatus: Record<string, string> = {
  executed: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  expired: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  cancelled: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
  invalidated: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
  closed: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
};

const serializeJson = (value: Record<string, unknown> | null) =>
  value ? JSON.stringify(value) : '—';

const textValue = (value: string | number | null | undefined) => {
  if (value == null || value === '') return '—';
  return String(value);
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
  const startRow = total === 0 ? 0 : offset + 1;
  const endRow = total === 0 ? 0 : Math.min(offset + items.length, total);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold sa-heading">Historical strategies table</h2>
        <div className="flex items-center gap-2 text-xs sa-muted">
          <span>
            Showing {startRow}-{endRow} of {total}
          </span>
          <span>•</span>
          <span>
            Page {page} / {totalPages}
          </span>
          <span>•</span>
          <span>Limit {limit}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="sa-btn-neutral h-9"
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          className="sa-btn-neutral h-9"
          onClick={onNextPage}
          disabled={!canNextPage}
        >
          Next
        </Button>
      </div>

      <Card className="sa-card overflow-hidden border-slate-700/60 p-0">
        <Table className="text-xs" data-numeric>
          <TableHeader>
            <TableRow className="border-slate-700/60 bg-slate-900/40 hover:bg-slate-900/40">
              <TableHead>Strategy ID</TableHead>
              <TableHead>Batch ID</TableHead>
              <TableHead>Strategy Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Entry Signal</TableHead>
              <TableHead>Take Profit</TableHead>
              <TableHead>Stop Loss</TableHead>
              <TableHead>Risk/Reward</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Expiry (Min)</TableHead>
              <TableHead>Signal Time</TableHead>
              <TableHead>Expiry Time</TableHead>
              <TableHead>Detailed Analysis</TableHead>
              <TableHead>Market Context</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Executed At</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>User Rating</TableHead>
              <TableHead>Rating Count</TableHead>
              <TableHead>Avg Rating</TableHead>
              <TableHead>User Feedback</TableHead>
              <TableHead>Trade Mode</TableHead>
              <TableHead>Execution Allowed</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Trade Recommended</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>News Context</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow className="border-slate-700/60">
                <TableCell colSpan={28} className="py-8 text-center sa-muted">
                  No historical strategies match current filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((strategy) => (
                <TableRow
                  key={strategy.strategy_id}
                  className="cursor-pointer border-slate-700/60 hover:bg-slate-800/40"
                  onClick={() => onSelect(strategy)}
                >
                  <TableCell>{strategy.strategy_id}</TableCell>
                  <TableCell>{textValue(strategy.batch_id)}</TableCell>
                  <TableCell className="max-w-48 truncate">{strategy.strategy_name}</TableCell>
                  <TableCell>{strategy.symbol}</TableCell>
                  <TableCell>{strategy.direction}</TableCell>
                  <TableCell className="max-w-56 truncate">{serializeJson(strategy.entry_signal)}</TableCell>
                  <TableCell>{strategy.take_profit}</TableCell>
                  <TableCell>{strategy.stop_loss}</TableCell>
                  <TableCell>{textValue(strategy.risk_reward_ratio)}</TableCell>
                  <TableCell>{strategy.confidence}</TableCell>
                  <TableCell>{textValue(strategy.expiry_minutes)}</TableCell>
                  <TableCell>{new Date(strategy.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{new Date(strategy.expiry_time).toLocaleString()}</TableCell>
                  <TableCell className="max-w-60 truncate">{textValue(strategy.detailed_analysis)}</TableCell>
                  <TableCell className="max-w-56 truncate">{serializeJson(strategy.market_context)}</TableCell>
                  <TableCell>
                    <Badge className={cn('border', toneByStatus[strategy.status] ?? 'sa-pill')}>{strategy.status}</Badge>
                  </TableCell>
                  <TableCell>{textValue(strategy.executed_at)}</TableCell>
                  <TableCell>{new Date(strategy.created_at).toLocaleString()}</TableCell>
                  <TableCell>{textValue(strategy.user_rating)}</TableCell>
                  <TableCell>{strategy.rating_count}</TableCell>
                  <TableCell>{textValue(strategy.avg_rating)}</TableCell>
                  <TableCell className="max-w-56 truncate">{textValue(strategy.user_feedback)}</TableCell>
                  <TableCell>{textValue(strategy.trade_mode)}</TableCell>
                  <TableCell>{strategy.execution_allowed ? 'true' : 'false'}</TableCell>
                  <TableCell>{textValue(strategy.risk_level)}</TableCell>
                  <TableCell>{strategy.trade_recommended ? 'true' : 'false'}</TableCell>
                  <TableCell className="max-w-60 truncate">{textValue(strategy.summary)}</TableCell>
                  <TableCell className="max-w-60 truncate">{textValue(strategy.news_context)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

export default HistoricalStrategiesTable;
