import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { StrategyRecord } from '@/types/strategy';

interface StrategyDetailSheetProps {
  open: boolean;
  strategy: StrategyRecord | null;
  onOpenChange: (open: boolean) => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-slate-700/60 p-3">
    <p className="mb-1 text-[11px] uppercase tracking-wide sa-muted">{label}</p>
    <p className="text-sm text-slate-100 break-words">{value || '—'}</p>
  </div>
);

const serializeJson = (value: Record<string, unknown> | null) =>
  value ? JSON.stringify(value, null, 2) : '—';

const textValue = (value: unknown) => {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export function StrategyDetailSheet({ open, strategy, onOpenChange }: StrategyDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-slate-700/60 bg-slate-950 text-slate-100 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-slate-100">Strategy details</SheetTitle>
          <SheetDescription>
            Complete `strategies` table record for selected strategy.
          </SheetDescription>
        </SheetHeader>

        {!strategy ? null : (
          <div className="mt-4 space-y-4 overflow-y-auto pb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{strategy.strategy_name}</h3>
              <Badge className="sa-pill">{strategy.symbol}</Badge>
              <Badge className="sa-pill">{strategy.status}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="strategy_id" value={textValue(strategy.strategy_id)} />
              <Field label="batch_id" value={textValue(strategy.batch_id)} />
              <Field label="direction" value={strategy.direction} />
              <Field label="take_profit" value={textValue(strategy.take_profit)} />
              <Field label="stop_loss" value={textValue(strategy.stop_loss)} />
              <Field label="risk_reward_ratio" value={textValue(strategy.risk_reward_ratio)} />
              <Field label="confidence" value={strategy.confidence} />
              <Field label="expiry_minutes" value={textValue(strategy.expiry_minutes)} />
              <Field label="timestamp" value={new Date(strategy.timestamp).toLocaleString()} />
              <Field label="expiry_time" value={new Date(strategy.expiry_time).toLocaleString()} />
              <Field label="executed_at" value={textValue(strategy.executed_at)} />
              <Field label="created_at" value={new Date(strategy.created_at).toLocaleString()} />
              <Field label="user_rating" value={textValue(strategy.user_rating)} />
              <Field label="rating_count" value={textValue(strategy.rating_count)} />
              <Field label="avg_rating" value={textValue(strategy.avg_rating)} />
              <Field label="trade_mode" value={textValue(strategy.trade_mode)} />
              <Field label="execution_allowed" value={String(strategy.execution_allowed)} />
              <Field label="risk_level" value={textValue(strategy.risk_level)} />
              <Field label="trade_recommended" value={String(strategy.trade_recommended)} />
            </div>

            <Field label="entry_signal" value={serializeJson(strategy.entry_signal)} />
            <Field label="market_context" value={serializeJson(strategy.market_context)} />
            <Field label="summary" value={textValue(strategy.summary)} />
            <Field label="detailed_analysis" value={textValue(strategy.detailed_analysis)} />
            <Field label="news_context" value={textValue(strategy.news_context)} />
            <Field label="user_feedback" value={textValue(strategy.user_feedback)} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default StrategyDetailSheet;
