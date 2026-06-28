import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart2,
  Building2,
  Clock,
  Globe,
  Minus,
  Shield,
  Star,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NewsIntelligenceItem } from '@/features/news/types';
import { cn } from '@/lib/utils';

export interface NewsRowProps {
  item: NewsIntelligenceItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenDetails: () => void;
  showInstruments?: boolean;
  onHistoricalLinkClick?: (id: number) => void;
}

function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipPrimitive.Portal>
        <TooltipContent
          sideOffset={6}
          avoidCollisions
          collisionPadding={12}
          className="max-w-[200px] text-center text-[11px] leading-snug bg-[#1a1d20] border border-[#C8935A]/40 text-slate-300 px-2.5 py-1.5 z-[9999] shadow-lg shadow-black/40"
        >
          {text}
        </TooltipContent>
      </TooltipPrimitive.Portal>
    </Tooltip>
  );
}

const DIRECTION_TIPS: Record<string, string> = {
  bullish: 'Price expected to rise once the market fully digests this',
  bearish: 'Price expected to fall once the market fully digests this',
  mixed:   'Fundamental direction genuinely unclear after full analysis',
  neutral: 'No significant directional pressure expected',
};

const PRICING_STATE_TIPS: Record<string, string> = {
  not_priced_in:       'Genuine surprise — market has not had a chance to incorporate this yet',
  partially_priced_in: 'Story was known, but this update changes timing, scope, or probability',
  priced_in:           'Already expected — routine, telegraphed, or repeated confirmation',
  unclear:             'Credibility is thin or signals conflict — interpretation contested',
};

const PRESSURE_TIPS: Record<string, string> = {
  risk_on:   'Market in risk-appetite mode. Independent of the instrument price direction.',
  risk_off:  'Market in safe-haven mode. Independent of the instrument price direction.',
  uncertain: 'Conflicting risk signals — no clear overall tone',
};

const VOLATILITY_TIPS: Record<string, string> = {
  extreme: 'Black Swan event — expect outsized moves and gap risk',
  high:    'Clear mechanism for a significant price move',
  medium:  'Moderate surprise — above-average move expected',
  low:     'Routine event — limited price impact expected',
};

const CERTAINTY_TIPS: Record<string, string> = {
  clear:     'Every professional trading desk would agree on direction instantly',
  contested: 'Reasonable desks can interpret this headline differently',
};

const getCategoryIcon = (category?: string): ReactNode => {
  switch (category) {
    case 'geopolitical':  return <Shield className="h-3 w-3 text-rose-400/50" />;
    case 'central_bank':  return <Building2 className="h-3 w-3 text-sky-400/50" />;
    case 'economic_data': return <BarChart2 className="h-3 w-3 text-emerald-400/50" />;
    case 'trade':         return <Globe className="h-3 w-3 text-amber-400/50" />;
    case 'political':     return <Shield className="h-3 w-3 text-violet-400/50" />;
    default:              return <Minus className="h-3 w-3 text-slate-700" />;
  }
};

const getDirectionIcon = (impact?: string): ReactNode => {
  switch ((impact || '').toLowerCase()) {
    case 'bullish': return <ArrowUp className="h-3.5 w-3.5" />;
    case 'bearish': return <ArrowDown className="h-3.5 w-3.5" />;
    default:        return <Minus className="h-3.5 w-3.5" />;
  }
};

const getDirectionClasses = (impact?: string): string => {
  switch ((impact || '').toLowerCase()) {
    case 'bullish': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25';
    case 'bearish': return 'text-rose-400 bg-rose-400/10 border-rose-400/25';
    case 'mixed':   return 'text-amber-400 bg-amber-400/10 border-amber-400/25';
    default:        return 'text-slate-500 bg-slate-800/50 border-slate-700/40';
  }
};

const getPricingStateBadge = (state?: string): ReactNode => {
  if (!state || state === 'priced_in') return null;
  const config: Record<string, { label: string; cls: string }> = {
    not_priced_in:       { label: 'NOT PRICED IN', cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8' },
    partially_priced_in: { label: 'PARTIAL',        cls: 'text-amber-400 border-amber-500/30 bg-amber-500/8' },
    unclear:             { label: 'UNCLEAR',         cls: 'text-rose-400 border-rose-500/30 bg-rose-500/8' },
  };
  const c = config[state];
  if (!c) return null;
  return (
    <Tip text={PRICING_STATE_TIPS[state] ?? ''}>
      <Badge variant="outline" className={cn('px-1.5 py-0 text-[9px] font-bold tracking-wider border cursor-default', c.cls)}>
        {c.label}
      </Badge>
    </Tip>
  );
};

const getPressureClasses = (pressure?: string): string => {
  switch ((pressure || '').toLowerCase()) {
    case 'risk_on':   return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8';
    case 'risk_off':  return 'text-rose-400 border-rose-500/30 bg-rose-500/8';
    case 'uncertain': return 'text-amber-400 border-amber-500/30 bg-amber-500/8';
    default:          return 'text-slate-600 border-slate-700/40 bg-slate-800/30';
  }
};

const formatPressure = (pressure?: string): string => {
  switch (pressure) {
    case 'risk_on':   return 'RISK ON';
    case 'risk_off':  return 'RISK OFF';
    case 'uncertain': return 'UNCERTAIN';
    default:          return (pressure || '').replace(/_/g, ' ').toUpperCase();
  }
};

const getVolatilityClasses = (v?: string): string => {
  const val = (v || '').toLowerCase();
  if (val === 'extreme') return 'text-rose-400 border-rose-500/30 bg-rose-500/8';
  if (val === 'high')    return 'text-orange-400 border-orange-500/30 bg-orange-500/8';
  if (val === 'medium')  return 'text-amber-400 border-amber-500/30 bg-amber-500/8';
  return '';
};

const getImportanceStars = (importance: number): ReactNode => (
  <div className="flex items-center gap-0.5 justify-center">
    {[1, 2, 3, 4, 5].map((level) => (
      <Star
        key={level}
        className={cn('h-2.5 w-2.5', level <= importance ? 'fill-[#C8935A] text-[#C8935A]' : 'text-slate-800')}
      />
    ))}
  </div>
);

const getConfidencePillClass = (label?: string): string => {
  const v = (label || '').toLowerCase();
  if (v.includes('high'))   return 'sa-pill-filled sa-pill-filled-success';
  if (v.includes('medium')) return 'sa-pill-filled sa-pill-filled-warning';
  if (v.includes('low'))    return 'sa-pill-filled sa-pill-filled-danger';
  return 'sa-pill-filled sa-pill-filled-info';
};

export function NewsRow({
  item,
  expanded,
  onToggleExpand,
  onOpenDetails,
  showInstruments = true,
  onHistoricalLinkClick,
}: NewsRowProps) {
  const isFresh = item.news_state === 'fresh';
  const isStale = item.news_state === 'stale' || item.news_state === 'resolved';
  const isHighAttention = typeof item.attention_score === 'number' && item.attention_score >= 85;

  const direction = item.market_impact;
  const showPressure = item.market_pressure && item.market_pressure !== 'neutral';
  const showVol = item.volatility_expectation && item.volatility_expectation !== 'low';

  const timeStr = (() => {
    let s = String(item.timestamp).trim().replace(/\sUTC$/, 'Z');
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T');
    return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  })();

  return (
    <Card
      className={cn(
        'sa-news-card sa-liquid-card cursor-pointer overflow-hidden transition-all outline-none focus-within:outline-none focus-within:ring-0 group relative',
        isHighAttention && 'border-[#C8935A]/40',
        isStale && 'opacity-55'
      )}
      onClick={onToggleExpand}
    >
      {isFresh && (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/10 shadow-[0_0_8px_rgba(52,211,153,0.5)] z-20" />
      )}

      <div className="flex items-stretch">
        {/* ── Left panel ── */}
        <div className="flex min-w-[76px] flex-col items-center justify-between border-r border-white/5 p-3 bg-[#09090b]/50 gap-2">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-mono font-bold tracking-tight mb-1.5">{timeStr}</div>
            {getImportanceStars(item.importance)}
          </div>
          <div className="flex flex-col items-center gap-1.5">
            {getCategoryIcon(item.news_category)}
            {item.breaking && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-rose-500/20 border border-rose-500/30">
                <Zap className="h-2.5 w-2.5 text-rose-400 fill-rose-400" />
              </span>
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="min-w-0 flex-1 p-3 flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold text-slate-100 leading-snug line-clamp-2 group-hover:text-[#C8935A] transition-colors">
            {item.headline}
          </h3>

          {/* Instrument → Direction */}
          {(item.primary_instrument || direction) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.primary_instrument && (
                <Tip text="Primary instrument most directly affected by this news">
                  <span className="font-mono text-[11px] font-bold text-[#C8935A] bg-[#C8935A]/10 border border-[#C8935A]/20 px-2 py-0.5 rounded-md tracking-wider cursor-default">
                    {item.primary_instrument}
                  </span>
                </Tip>
              )}
              {item.primary_instrument && direction && (
                <ArrowRight className="h-3 w-3 text-slate-700 shrink-0" />
              )}
              {direction && (
                <Tip text={DIRECTION_TIPS[(direction || '').toLowerCase()] ?? ''}>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-default',
                    getDirectionClasses(direction)
                  )}>
                    {getDirectionIcon(direction)}
                    {direction.toUpperCase()}
                  </span>
                </Tip>
              )}
              {getPricingStateBadge(item.pricing_state)}
            </div>
          )}

          {/* Context badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {showPressure && (
              <Tip text={PRESSURE_TIPS[(item.market_pressure || '').toLowerCase()] ?? ''}>
                <Badge variant="outline" className={cn('px-1.5 py-0 text-[9px] font-bold tracking-wider border cursor-default', getPressureClasses(item.market_pressure))}>
                  {formatPressure(item.market_pressure)}
                </Badge>
              </Tip>
            )}
            {showVol && (
              <Tip text={VOLATILITY_TIPS[(item.volatility_expectation || '').toLowerCase()] ?? ''}>
                <Badge variant="outline" className={cn('px-1.5 py-0 text-[9px] font-bold tracking-wider border cursor-default', getVolatilityClasses(item.volatility_expectation))}>
                  VOL {(item.volatility_expectation || '').toUpperCase()}
                </Badge>
              </Tip>
            )}
            {item.impact_timeframe && item.impact_timeframe !== 'none' && (
              <Tip text="Expected timing of the fundamental price move">
                <Badge variant="outline" className="px-1.5 py-0 text-[9px] text-slate-600 border-slate-700/40 bg-transparent tracking-wide cursor-default">
                  <Clock className="h-2.5 w-2.5 mr-1 inline" />
                  {item.impact_timeframe}
                </Badge>
              </Tip>
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="border-t border-white/5 px-3 pb-3 bg-[#09090b]/20">
          <div className="mt-3 rounded-xl border border-[#C8935A]/10 bg-[#111315]/50 p-3 space-y-3">

            {item.human_takeaway && (
              <p className="text-[12px] leading-relaxed text-slate-200 border-l-2 border-[#C8935A]/30 pl-3">
                {item.human_takeaway}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              {item.confidence_label && (
                <Tip text="Confidence in the overall analysis quality, not in the direction">
                  <Badge className={cn(getConfidencePillClass(item.confidence_label), 'text-[9px] cursor-default')}>
                    {item.confidence_label.toUpperCase()} CONF
                  </Badge>
                </Tip>
              )}
              {item.reaction_certainty && (
                <Tip text={CERTAINTY_TIPS[item.reaction_certainty] ?? ''}>
                  <Badge variant="outline" className={cn(
                    'text-[9px] font-bold border px-1.5 py-0 cursor-default',
                    item.reaction_certainty === 'clear'
                      ? 'text-sky-400 border-sky-500/30 bg-sky-500/8'
                      : 'text-orange-400 border-orange-500/30 bg-orange-500/8'
                  )}>
                    {item.reaction_certainty === 'clear' ? 'CLEAR' : 'CONTESTED'}
                  </Badge>
                </Tip>
              )}
              {item.attention_window && (
                <Tip text="How long this news is expected to remain market-relevant">
                  <Badge className="sa-pill-filled sa-pill-filled-warning text-[9px] cursor-default">
                    WATCH {item.attention_window.toUpperCase()}
                  </Badge>
                </Tip>
              )}
            </div>

            {item.news_state && (
              <div>
                <div className="mb-1.5 text-[9px] uppercase tracking-widest font-bold text-slate-700">Lifecycle</div>
                <div className="flex items-center gap-1.5">
                  {(['fresh', 'developing', 'stale', 'resolved'] as const).map((state, idx) => {
                    const isActive = item.news_state === state;
                    return (
                      <div key={state} className="flex items-center gap-1.5">
                        <div className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-amber-400' : 'bg-slate-800')} />
                        <span className={cn('text-[9px] uppercase tracking-wide', isActive ? 'text-amber-400 font-bold' : 'text-slate-700')}>
                          {state}
                        </span>
                        {idx < 3 && <div className="w-3 h-[1px] bg-slate-800" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showInstruments && item.instruments && item.instruments.length > 0 && (
              <div>
                <div className="mb-1.5 text-[9px] uppercase tracking-widest font-bold text-slate-700">Affected Instruments</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.instruments.map((inst) => {
                    const isPrimary = item.primary_instrument === inst;
                    return (
                      <Tip key={inst} text={isPrimary ? 'Primary instrument — fewest causal steps from headline to price' : 'Secondary instrument with a direct causal link to this headline'}>
                        <Badge className={cn(
                          'font-mono text-[10px] px-2 py-0.5 cursor-default',
                          isPrimary
                            ? 'bg-[#C8935A]/20 border border-[#C8935A]/50 text-[#C8935A]'
                            : 'bg-[#0d0f11] border border-slate-700/50 text-slate-400'
                        )}>
                          {isPrimary && '★ '}{inst}
                        </Badge>
                      </Tip>
                    );
                  })}
                </div>
              </div>
            )}

            {item.similar_news_context && (
              <div className="rounded-lg bg-[#0d0f11]/60 border-l-2 border-amber-500/30 p-2.5">
                <div className="mb-1 text-[9px] uppercase tracking-widest font-bold text-amber-500/60">Precedent</div>
                <p className="text-[11px] text-slate-400 italic leading-relaxed">"{item.similar_news_context}"</p>
                {item.similar_news_ids && item.similar_news_ids.length > 0 && onHistoricalLinkClick && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onHistoricalLinkClick(item.similar_news_ids![0]); }}
                    className="mt-1.5 text-[10px] font-semibold text-[#C8935A] hover:text-[#E2B485] transition-colors flex items-center gap-1"
                  >
                    View historical analysis ↗
                  </button>
                )}
              </div>
            )}

            {item.expected_followups && item.expected_followups.length > 0 && (
              <div>
                <div className="mb-1.5 text-[9px] uppercase tracking-widest font-bold text-slate-700">Watch Next</div>
                <ul className="space-y-1">
                  {item.expected_followups.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                      <div className="mt-1.5 h-1 w-1 rounded-full bg-[#C8935A]/40 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest border-[#C8935A]/20 text-[#C8935A] hover:border-[#C8935A]/50 hover:text-[#E2B485] transition-all"
                onClick={(e) => { e.stopPropagation(); onOpenDetails(); }}
              >
                Full Intelligence →
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
