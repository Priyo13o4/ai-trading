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

const getNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const formatPrice = (value: number | null): string | null =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : null;

const formatDirection = (direction: StrategyRecord['direction']): string => {
  if (direction === 'long') return 'Long';
  if (direction === 'short') return 'Short';
  return 'Unknown';
};

const formatDateTime = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toLocaleString();
};

const getEntrySignalValue = (strategy: StrategyRecord): string | null => {
  const signal = strategy.entry_signal;
  const entry =
    getNumericValue(signal?.level) ??
    getNumericValue(signal?.entry_price) ??
    getNumericValue(signal?.entryPrice) ??
    getNumericValue(signal?.entry) ??
    getNumericValue(signal?.price);

  return formatPrice(entry);
};

const getEntrySignalContext = (strategy: StrategyRecord) => {
  const signal = strategy.entry_signal;

  return {
    timeframe: textValue(signal?.timeframe),
    confirmation: textValue(signal?.confirmation),
    conditionType: textValue(signal?.condition_type ?? signal?.conditionType),
  };
};

const isMeaningfulText = (value: string | null | undefined): value is string => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  const lowered = trimmed.toLowerCase();
  return lowered !== 'null' && lowered !== 'undefined' && lowered !== '[]' && lowered !== '{}';
};

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!isMeaningfulText(value)) return null;

  return (
    <div className="rounded-md border border-slate-700/60 p-3">
      <p className="mb-1 text-[11px] uppercase tracking-wide sa-muted">{label}</p>
      <p className="text-sm text-slate-100 break-words">{value}</p>
    </div>
  );
};

const serializeJson = (value: Record<string, unknown> | null) => {
  if (!value || Object.keys(value).length === 0) return null;
  return JSON.stringify(value, null, 2);
};

const textValue = (value: unknown) => {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'object') {
    if (Array.isArray(value) && value.length === 0) return null;
    if (!Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0) {
      return null;
    }
    return JSON.stringify(value);
  }
  return String(value);
};

export function StrategyDetailSheet({ open, strategy, onOpenChange }: StrategyDetailSheetProps) {
  const entrySignal = strategy ? getEntrySignalValue(strategy) : null;
  const entrySignalContext = strategy ? getEntrySignalContext(strategy) : null;
  const takeProfit = strategy ? formatPrice(getNumericValue(strategy.take_profit)) : null;
  const stopLoss = strategy ? formatPrice(getNumericValue(strategy.stop_loss)) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden border-slate-700/60 bg-slate-950 text-slate-100 sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle className="text-slate-100">Strategy details</SheetTitle>
          <SheetDescription>
            Selected strategy snapshot.
          </SheetDescription>
        </SheetHeader>

        {!strategy ? null : (
          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pb-6 pr-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{strategy.strategy_name}</h3>
              <Badge className="sa-pill">{strategy.symbol}</Badge>
              <Badge className="sa-pill">{strategy.status}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Direction" value={formatDirection(strategy.direction)} />
              <Field label="Entry Signal" value={entrySignal} />
              <Field label="Entry Timeframe" value={entrySignalContext?.timeframe} />
              <Field label="Entry Confirmation" value={entrySignalContext?.confirmation} />
              <Field label="Entry Condition Type" value={entrySignalContext?.conditionType} />
              <Field label="TP" value={takeProfit} />
              <Field label="SL" value={stopLoss} />
              <Field label="Confidence" value={strategy.confidence} />
              <Field label="Risk/Reward" value={textValue(strategy.risk_reward_ratio)} />
              <Field label="Trade Mode" value={textValue(strategy.trade_mode)} />
              <Field label="Risk Level" value={textValue(strategy.risk_level)} />
              <Field label="Execution Allowed" value={strategy.execution_allowed ? 'Yes' : 'No'} />
              <Field label="Recommended" value={strategy.trade_recommended ? 'Yes' : 'No'} />
              <Field label="Expiry (minutes)" value={textValue(strategy.expiry_minutes)} />
              <Field label="Signal Time" value={formatDateTime(strategy.timestamp)} />
              <Field label="Expiry Time" value={formatDateTime(strategy.expiry_time)} />
              <Field label="Executed At" value={formatDateTime(strategy.executed_at)} />
              <Field label="Created At" value={formatDateTime(strategy.created_at)} />
              <Field label="User Rating" value={textValue(strategy.user_rating)} />
              <Field label="Rating Count" value={textValue(strategy.rating_count)} />
              <Field label="Average Rating" value={textValue(strategy.avg_rating)} />
              <Field label="Strategy ID" value={textValue(strategy.strategy_id)} />
              <Field label="Batch ID" value={textValue(strategy.batch_id)} />
            </div>

            <Field label="Summary" value={textValue(strategy.summary)} />
            <Field label="Detailed Analysis" value={textValue(strategy.detailed_analysis)} />
            <Field label="News Context" value={textValue(strategy.news_context)} />
            <Field label="User Feedback" value={textValue(strategy.user_feedback)} />
            <Field label="Market Context" value={serializeJson(strategy.market_context)} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default StrategyDetailSheet;
