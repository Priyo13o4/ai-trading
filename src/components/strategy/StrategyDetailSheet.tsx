import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toDisplayTimeframe, toEntrySignalDisplay, toHumanReadableText } from '@/lib/strategyFormatters';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
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
  typeof value === 'number' && Number.isFinite(value) ? value.toString() : null;

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
  return toEntrySignalDisplay(strategy.entry_signal) ?? formatPrice(getNumericValue(strategy.entry_signal?.price));
};

const getEntrySignalContext = (strategy: StrategyRecord) => {
  const signal = strategy.entry_signal;

  return {
    timeframe: toDisplayTimeframe(signal?.timeframe),
    confirmation: toHumanReadableText(signal?.confirmation_type ?? signal?.confirmation),
    conditionType: toHumanReadableText(
      signal?.entry_condition ?? signal?.condition_type ?? signal?.conditionType
    ),
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
    <div className="rounded-xl border border-[#C8935A]/20 bg-[#16191c]/50 p-3 transition-colors hover:border-[#C8935A]/40">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#C8935A]/60">{label}</p>
      <p className="text-sm font-medium text-slate-200 break-words">{value}</p>
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

interface NewsEvent {
  event_name: string;
  event_time_utc?: string;
  impact?: string;
  market_pricing_sentiment?: string;
  trading_scenarios?: {
    weight_if_less?: number;
    weight_if_equals?: number;
    weight_if_greater?: number;
    actual_equals_forecast?: string;
    actual_less_than_forecast?: string;
    actual_greater_than_forecast?: string;
  };
  market_dynamics?: {
    main_risk?: string;
    reaction_speed?: string;
    volatility_score?: number;
    latency_multiplier?: number;
    expected_volatility?: string;
  };
}

function NewsContextView({ value }: { value: string | null | undefined }) {
  if (!isMeaningfulText(value)) return null;

  let events: NewsEvent[] = [];
  try {
    const parsed = JSON.parse(value);
    events = Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    return (
      <div className="rounded-xl border border-[#C8935A]/20 bg-[#16191c]/50 p-3 transition-colors hover:border-[#C8935A]/40">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#C8935A]/60">News Context</p>
        <p className="text-sm font-medium text-slate-200 break-words whitespace-pre-wrap">{value}</p>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#C8935A]/60">News Context & Sentiment</p>
      {events.map((event, idx) => {
        const impact = event.impact || 'Low';
        const toneClass = 
          impact.toLowerCase() === 'high' ? 'sa-news-tone-danger' :
          impact.toLowerCase() === 'medium' ? 'sa-news-tone-warning' :
          'sa-news-tone-muted';
        
        const badgeClass =
          impact.toLowerCase() === 'high' ? 'sa-badge-danger' :
          impact.toLowerCase() === 'medium' ? 'sa-badge-warning' :
          'sa-badge-muted';

        return (
          <div key={idx} className={cn("sa-news-tone p-4 flex flex-col gap-4 border", toneClass)}>
            {/* Header: Name, Time, Impact */}
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div className="min-w-0 flex-1">
                <h5 className="font-bold text-white text-base leading-snug">{event.event_name}</h5>
                {event.event_time_utc && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(event.event_time_utc).toLocaleString()}
                  </p>
                )}
              </div>
              <Badge className={cn("font-bold tracking-widest uppercase text-[10px] py-0.5 px-2", badgeClass)}>
                {impact} Impact
              </Badge>
            </div>

            {/* Market Pricing Sentiment */}
            {event.market_pricing_sentiment && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#C8935A]/60">Market Pricing & Sentiment</p>
                <p className="text-sm text-slate-300 leading-relaxed">{event.market_pricing_sentiment}</p>
              </div>
            )}

            {/* Trading Scenarios Grid */}
            {event.trading_scenarios && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#C8935A]/60">Trading Scenarios</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Scenario 1: Actual < Forecast */}
                  <div className="bg-[#111315]/80 rounded-lg p-3 border border-white/[0.04] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-1.5 border-b border-white/[0.04] pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Actual &lt; Forecast</span>
                      {event.trading_scenarios.weight_if_less !== undefined && (
                        <span className={cn(
                          "text-[10px] font-black font-mono px-1.5 py-0.5 rounded",
                          event.trading_scenarios.weight_if_less > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          event.trading_scenarios.weight_if_less < 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        )}>
                          {(event.trading_scenarios.weight_if_less > 0 ? '+' : '') + event.trading_scenarios.weight_if_less}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {event.trading_scenarios.actual_less_than_forecast || 'No scenario documented'}
                    </p>
                  </div>

                  {/* Scenario 2: Actual = Forecast */}
                  <div className="bg-[#111315]/80 rounded-lg p-3 border border-white/[0.04] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-1.5 border-b border-white/[0.04] pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Actual = Forecast</span>
                      {event.trading_scenarios.weight_if_equals !== undefined && (
                        <span className={cn(
                          "text-[10px] font-black font-mono px-1.5 py-0.5 rounded",
                          event.trading_scenarios.weight_if_equals > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          event.trading_scenarios.weight_if_equals < 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        )}>
                          {(event.trading_scenarios.weight_if_equals > 0 ? '+' : '') + event.trading_scenarios.weight_if_equals}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {event.trading_scenarios.actual_equals_forecast || 'No scenario documented'}
                    </p>
                  </div>

                  {/* Scenario 3: Actual > Forecast */}
                  <div className="bg-[#111315]/80 rounded-lg p-3 border border-white/[0.04] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-1.5 border-b border-white/[0.04] pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Actual &gt; Forecast</span>
                      {event.trading_scenarios.weight_if_greater !== undefined && (
                        <span className={cn(
                          "text-[10px] font-black font-mono px-1.5 py-0.5 rounded",
                          event.trading_scenarios.weight_if_greater > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          event.trading_scenarios.weight_if_greater < 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        )}>
                          {(event.trading_scenarios.weight_if_greater > 0 ? '+' : '') + event.trading_scenarios.weight_if_greater}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {event.trading_scenarios.actual_greater_than_forecast || 'No scenario documented'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Market Dynamics */}
            {event.market_dynamics && (
              <div className="space-y-2 border-t border-white/[0.06] pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#C8935A]/60">Market Dynamics & Risks</p>
                
                {/* Tags row */}
                <div className="flex flex-wrap gap-2">
                  {event.market_dynamics.expected_volatility && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300">
                      Volatility: {event.market_dynamics.expected_volatility}
                    </span>
                  )}
                  {event.market_dynamics.reaction_speed && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300">
                      Reaction: {event.market_dynamics.reaction_speed}
                    </span>
                  )}
                  {event.market_dynamics.volatility_score !== undefined && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300">
                      Vix Score: {event.market_dynamics.volatility_score}
                    </span>
                  )}
                  {event.market_dynamics.latency_multiplier !== undefined && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300">
                      Latency Mult: {event.market_dynamics.latency_multiplier}x
                    </span>
                  )}
                </div>

                {/* Main Risk */}
                {event.market_dynamics.main_risk && (
                  <div className="bg-rose-500/5 rounded-lg p-3 border border-rose-500/10 flex gap-2.5 items-start">
                    <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-rose-400">Main Volatility Risk</p>
                      <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{event.market_dynamics.main_risk}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StrategyDetailSheet({ open, strategy, onOpenChange }: StrategyDetailSheetProps) {
  const entrySignal = strategy ? getEntrySignalValue(strategy) : null;
  const entrySignalContext = strategy ? getEntrySignalContext(strategy) : null;
  const takeProfit = strategy ? formatPrice(getNumericValue(strategy.take_profit)) : null;
  const stopLoss = strategy ? formatPrice(getNumericValue(strategy.stop_loss)) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden border-[#C8935A]/30 bg-[#111315] text-slate-100 sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle className="text-slate-100">Strategy details</SheetTitle>
          <SheetDescription>
            Selected strategy snapshot.
          </SheetDescription>
        </SheetHeader>

        {!strategy ? null : (
          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pb-6 pr-1">
          <div className="mt-6 flex flex-col gap-5 border-b border-[#C8935A]/20 pb-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#C8935A]/10 text-[#C8935A] border-[#C8935A]/20 font-mono tracking-wider">
                  {strategy.symbol}
                </Badge>
                <Badge className={cn(
                  "font-bold tracking-widest uppercase text-[10px]",
                  strategy.status.toLowerCase() === 'active' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                  strategy.status.toLowerCase() === 'pending' ? "border-amber-500/30 text-amber-400 bg-amber-500/10" :
                  "border-slate-500/30 text-slate-400 bg-slate-500/10"
                )}>
                  {strategy.status}
                </Badge>
              </div>
              <h3 className="text-2xl font-display font-semibold text-white leading-tight">
                {strategy.strategy_name}
              </h3>
            </div>
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
              <Field label="Expiry (minutes)" value={textValue(strategy.expiry_minutes)} />
              <Field label="Signal Time" value={formatDateTime(strategy.timestamp)} />
              <Field label="Expiry Time" value={formatDateTime(strategy.expiry_time)} />
              <Field label="Created At" value={formatDateTime(strategy.created_at)} />
            </div>

            <Field label="Summary" value={textValue(strategy.summary)} />
            <Field label="Detailed Analysis" value={textValue(strategy.detailed_analysis)} />
            <NewsContextView value={strategy.news_context} />
            <Field label="Market Context" value={serializeJson(strategy.market_context)} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default StrategyDetailSheet;
