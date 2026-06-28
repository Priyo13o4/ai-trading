import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart2,
  Building2,
  ExternalLink,
  Globe,
  Loader2,
  Minus,
  Shield,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getBadgeTone } from '@/features/news/theme';
import type { NewsIntelligenceItem } from '@/features/news/types';
import { sanitizeExternalUrl } from '@/lib/urlSanitizer';
import { cn } from '@/lib/utils';

type DialogNewsItem = NewsIntelligenceItem & {
  original_email_content?: string;
  forexfactory_urls?: string[];
};

interface NewsIntelligenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: DialogNewsItem | null;
  onHistoricalLinkClick?: (id: number) => void | Promise<void>;
  isFetchingHistory?: boolean;
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
          className="max-w-[220px] text-center text-[11px] leading-snug bg-[#1a1d20] border border-[#C8935A]/40 text-slate-300 px-2.5 py-1.5 z-[9999] shadow-lg shadow-black/40"
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
  unclear:             'Credibility thin or signals conflict — interpretation contested',
};

const REPRICING_TYPE_TIPS: Record<string, string> = {
  fundamental:        'Supply/demand or macro expectations have materially changed',
  positioning_unwind: 'A crowded position is being forced to cover',
  credibility_shock:  'An institution or policy has lost market credibility',
  mixed:              'Multiple repricing mechanisms are active simultaneously',
};

const PRESSURE_TIPS: Record<string, string> = {
  risk_on:   'Market in risk-appetite mode. Independent of the instrument price direction.',
  risk_off:  'Market in safe-haven mode. Independent of the instrument price direction.',
  uncertain: 'Conflicting risk signals — no clear overall tone',
  neutral:   'No dominant risk tone — market is not in a directional risk mood',
};

const VOLATILITY_TIPS: Record<string, string> = {
  extreme: 'Black Swan event — expect outsized moves and gap risk',
  high:    'Clear mechanism for a significant price move',
  medium:  'Moderate surprise — above-average move expected',
  low:     'Routine event — limited price impact expected',
};

const TIMEFRAME_TIPS: Record<string, string> = {
  immediate: 'Reaction expected within minutes to ~2 hours of the news',
  intraday:  'Expected to play out within the current trading session',
  daily:     'Reaction at next market open — market may be closed now',
  weekly:    'Structural repricing developing over several days',
  'long-term': 'Multi-week or structural theme — not an intraday catalyst',
};

const CATEGORY_LABELS: Record<string, string> = {
  economic_data:    'ECONOMIC DATA',
  central_bank:     'CENTRAL BANK',
  geopolitical:     'GEOPOLITICAL',
  trade:            'TRADE',
  political:        'POLITICAL',
  market_technical: 'MARKET TECHNICAL',
  other:            'OTHER',
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'geopolitical':  return <Shield className="h-4 w-4 text-rose-400/60" />;
    case 'central_bank':  return <Building2 className="h-4 w-4 text-sky-400/60" />;
    case 'economic_data': return <BarChart2 className="h-4 w-4 text-emerald-400/60" />;
    case 'trade':         return <Globe className="h-4 w-4 text-amber-400/60" />;
    case 'political':     return <Shield className="h-4 w-4 text-violet-400/60" />;
    default:              return null;
  }
};

const getDirectionIcon = (impact?: string) => {
  switch ((impact || '').toLowerCase()) {
    case 'bullish': return <ArrowUp className="h-7 w-7" />;
    case 'bearish': return <ArrowDown className="h-7 w-7" />;
    default:        return <Minus className="h-7 w-7" />;
  }
};

const getDirectionColors = (impact?: string) => {
  switch ((impact || '').toLowerCase()) {
    case 'bullish': return { text: 'text-emerald-400', bg: 'bg-emerald-400/8',  border: 'border-emerald-400/25', bar: 'bg-emerald-500' };
    case 'bearish': return { text: 'text-rose-400',    bg: 'bg-rose-400/8',     border: 'border-rose-400/25',    bar: 'bg-rose-500' };
    case 'mixed':   return { text: 'text-amber-400',   bg: 'bg-amber-400/8',    border: 'border-amber-400/25',   bar: 'bg-amber-500' };
    default:        return { text: 'text-slate-500',   bg: 'bg-slate-800/40',   border: 'border-slate-700/40',   bar: 'bg-slate-600' };
  }
};

const getDialogBgClass = (impact?: string): string => {
  switch ((impact || '').toLowerCase()) {
    case 'bearish': return 'bg-gradient-to-br from-red-950/25 via-[#0d0f11] to-[#111315]';
    case 'bullish': return 'bg-gradient-to-br from-emerald-950/20 via-[#0d0f11] to-[#111315]';
    default:        return 'bg-[#111315]';
  }
};

const getDialogBorderClass = (impact?: string): string => {
  switch ((impact || '').toLowerCase()) {
    case 'bearish': return 'border-rose-500/25';
    case 'bullish': return 'border-emerald-500/25';
    default:        return 'border-white/10';
  }
};

const getPricingStateConfig = (state?: string) => {
  switch (state) {
    case 'not_priced_in':       return { label: 'NOT PRICED IN',       cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8' };
    case 'partially_priced_in': return { label: 'PARTIALLY PRICED IN', cls: 'text-amber-400 border-amber-500/30 bg-amber-500/8' };
    case 'priced_in':           return { label: 'PRICED IN',           cls: 'text-slate-400 border-slate-600/30 bg-slate-800/40' };
    case 'unclear':             return { label: 'UNCLEAR',             cls: 'text-rose-400 border-rose-500/30 bg-rose-500/8' };
    default:                    return null;
  }
};

const getRepricingTypeLabel = (type?: string): string => {
  switch (type) {
    case 'fundamental':        return 'FUNDAMENTAL';
    case 'positioning_unwind': return 'POSITIONING UNWIND';
    case 'credibility_shock':  return 'CREDIBILITY SHOCK';
    case 'mixed':              return 'MIXED';
    default:                   return (type || '').toUpperCase();
  }
};

const getPressureLabel = (p?: string): string => {
  switch (p) {
    case 'risk_on':   return 'RISK ON';
    case 'risk_off':  return 'RISK OFF';
    case 'uncertain': return 'UNCERTAIN';
    default:          return (p || 'NEUTRAL').replace(/_/g, ' ').toUpperCase();
  }
};

const getPressureColor = (p?: string): string => {
  switch ((p || '').toLowerCase()) {
    case 'risk_on':   return 'text-emerald-400';
    case 'risk_off':  return 'text-rose-400';
    case 'uncertain': return 'text-amber-400';
    default:          return 'text-slate-500';
  }
};

const getVolatilityColor = (v?: string): string => {
  switch ((v || '').toLowerCase()) {
    case 'extreme': return 'text-rose-400';
    case 'high':    return 'text-orange-400';
    case 'medium':  return 'text-amber-400';
    default:        return 'text-emerald-400';
  }
};

export function NewsIntelligenceDialog({
  open,
  onOpenChange,
  news,
  onHistoricalLinkClick,
  isFetchingHistory = false,
}: NewsIntelligenceDialogProps) {
  const sourceUrls = useMemo(() => {
    if (!news) return [] as string[];
    if (news.forexfactory_urls?.length) return news.forexfactory_urls;
    if (news.forexfactory_url) return [news.forexfactory_url];
    return [] as string[];
  }, [news]);

  const sanitizedSourceUrls = useMemo(
    () => sourceUrls.map((url) => sanitizeExternalUrl(url)).filter((url): url is string => Boolean(url)),
    [sourceUrls]
  );
  const blockedSourceUrlCount = Math.max(0, sourceUrls.length - sanitizedSourceUrls.length);

  const direction = news?.market_impact;
  const dc = getDirectionColors(direction);
  const confidence = news?.directional_confidence;
  const confidencePct = confidence !== undefined ? Math.round(confidence * 100) : null;
  const pricingConfig = getPricingStateConfig(news?.pricing_state);

  const handleHistoricalClick = () => {
    const id = news?.similar_news_ids?.[0];
    if (!id || !onHistoricalLinkClick) return;
    void onHistoricalLinkClick(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        'sa-news-dialog text-white sm:max-w-2xl border-2',
        getDialogBorderClass(direction),
        getDialogBgClass(direction)
      )}>
        {/* ── Header ── */}
        <DialogHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {news?.news_category && getCategoryIcon(news.news_category)}
            {news?.news_category && (
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                {CATEGORY_LABELS[news.news_category] ?? news.news_category.toUpperCase()}
              </span>
            )}
            {news && (
              <>
                <span className="text-slate-700">·</span>
                <span className={cn('text-[10px] font-bold tracking-widest uppercase',
                  (news.importance ?? 0) >= 4 ? 'text-rose-500' :
                  (news.importance ?? 0) >= 3 ? 'text-orange-400' : 'text-yellow-500'
                )}>
                  {(news.importance ?? 0) >= 4 ? 'HIGH IMPACT' : (news.importance ?? 0) >= 3 ? 'MEDIUM IMPACT' : 'LOW IMPACT'}
                </span>
              </>
            )}
            {news?.breaking && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase flex items-center gap-1">
                  <Zap className="h-3 w-3" /> BREAKING
                </span>
              </>
            )}
            {news && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-[10px] text-slate-500">{new Date(news.timestamp).toLocaleString()}</span>
              </>
            )}
          </div>
          <DialogTitle className="text-lg font-bold leading-snug text-slate-100 sm:text-xl pr-8">
            {news?.headline || 'News Intelligence'}
          </DialogTitle>
        </DialogHeader>

        {news && (
          <ScrollArea className="max-h-[68vh] pr-2 mt-1">
            <div className="space-y-4 pb-2">

              {/* ── SECTION 1: FUNDAMENTAL REPRICING CALL ── */}
              {(news.primary_instrument || direction) && (
                <section className={cn('rounded-xl border p-4', dc.bg, dc.border)}>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-600 mb-3">
                    Fundamental Repricing Call
                  </div>

                  {/* Instrument → Direction hero */}
                  <div className="flex items-center gap-3 mb-4">
                    {news.primary_instrument && (
                      <Tip text="The single instrument with the clearest, most direct causal link to this headline">
                        <div className="font-mono text-base font-bold text-[#C8935A] bg-[#C8935A]/10 border border-[#C8935A]/25 px-3 py-2 rounded-lg tracking-wider cursor-default">
                          {news.primary_instrument}
                        </div>
                      </Tip>
                    )}
                    {news.primary_instrument && direction && (
                      <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
                    )}
                    {direction && (
                      <Tip text={DIRECTION_TIPS[(direction || '').toLowerCase()] ?? ''}>
                        <div className={cn('flex items-center gap-2 text-2xl font-bold cursor-default', dc.text)}>
                          {getDirectionIcon(direction)}
                          <span className="tracking-wider">{direction.toUpperCase()}</span>
                        </div>
                      </Tip>
                    )}
                  </div>

                  {/* Directional confidence bar */}
                  {confidencePct !== null && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <Tip text="Confidence in the fundamental price direction once fully digested — not confidence in the first candle">
                          <span className="text-[9px] uppercase tracking-widest font-bold text-slate-600 cursor-default underline decoration-dotted underline-offset-2">
                            Directional Confidence
                          </span>
                        </Tip>
                        <span className={cn('text-[12px] font-bold tabular-nums', dc.text)}>
                          {confidencePct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', dc.bar)}
                          style={{ width: `${confidencePct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* State pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {pricingConfig && (
                      <Tip text={PRICING_STATE_TIPS[news.pricing_state ?? ''] ?? ''}>
                        <Badge variant="outline" className={cn('text-[9px] font-bold border px-2 py-0.5 cursor-default', pricingConfig.cls)}>
                          {pricingConfig.label}
                        </Badge>
                      </Tip>
                    )}
                    {news.reaction_certainty && (
                      <Tip text={news.reaction_certainty === 'clear'
                        ? 'Every professional trading desk would agree on direction instantly'
                        : 'Reasonable desks can interpret this headline differently'}>
                        <Badge variant="outline" className={cn(
                          'text-[9px] font-bold border px-2 py-0.5 cursor-default',
                          news.reaction_certainty === 'clear'
                            ? 'text-sky-400 border-sky-500/30 bg-sky-500/8'
                            : 'text-orange-400 border-orange-500/30 bg-orange-500/8'
                        )}>
                          {news.reaction_certainty === 'clear' ? 'CLEAR REACTION' : 'CONTESTED'}
                        </Badge>
                      </Tip>
                    )}
                    {news.repricing_type && news.repricing_type !== 'none' && (
                      <Tip text={REPRICING_TYPE_TIPS[news.repricing_type] ?? ''}>
                        <Badge variant="outline" className="text-[9px] font-bold border px-2 py-0.5 text-violet-400 border-violet-500/30 bg-violet-500/8 cursor-default">
                          {getRepricingTypeLabel(news.repricing_type)}
                        </Badge>
                      </Tip>
                    )}
                  </div>
                </section>
              )}

              {/* ── SECTION 2: ANALYSIS ── */}
              {(news.human_takeaway || news.ai_analysis_summary || news.summary) && (
                <section className="space-y-2">
                  {news.human_takeaway && (
                    <div className="border-l-2 border-[#C8935A]/35 pl-4">
                      <p className="text-[13px] leading-relaxed text-slate-200 font-medium">
                        {news.human_takeaway}
                      </p>
                    </div>
                  )}
                  {(news.ai_analysis_summary || news.summary) && (
                    <div className="rounded-xl bg-[#09090b]/60 border border-white/5 p-3">
                      <div className="text-[9px] uppercase tracking-widest font-bold text-slate-700 mb-2">
                        Causal Analysis
                      </div>
                      <p className="text-[12px] leading-relaxed text-slate-400 whitespace-pre-wrap">
                        {news.ai_analysis_summary || news.summary}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* ── SECTION 3: MARKET ENVIRONMENT ── */}
              {(news.market_pressure || news.volatility_expectation || news.impact_timeframe || news.attention_window) && (
                <section>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-700 mb-2">
                    Market Environment
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {news.market_pressure && (
                      <Tip text={PRESSURE_TIPS[(news.market_pressure || '').toLowerCase()] ?? ''}>
                        <div className="rounded-lg bg-[#09090b]/60 border border-white/5 p-2.5 cursor-default">
                          <div className="text-[8px] uppercase tracking-widest text-slate-700 mb-1 font-bold">Risk Tone</div>
                          <div className={cn('text-[10px] font-bold', getPressureColor(news.market_pressure))}>
                            {getPressureLabel(news.market_pressure)}
                          </div>
                        </div>
                      </Tip>
                    )}
                    {news.volatility_expectation && (
                      <Tip text={VOLATILITY_TIPS[(news.volatility_expectation || '').toLowerCase()] ?? ''}>
                        <div className="rounded-lg bg-[#09090b]/60 border border-white/5 p-2.5 cursor-default">
                          <div className="text-[8px] uppercase tracking-widest text-slate-700 mb-1 font-bold">Volatility</div>
                          <div className={cn('text-[10px] font-bold', getVolatilityColor(news.volatility_expectation))}>
                            {news.volatility_expectation.toUpperCase()}
                          </div>
                        </div>
                      </Tip>
                    )}
                    {news.impact_timeframe && news.impact_timeframe !== 'none' && (
                      <Tip text={TIMEFRAME_TIPS[news.impact_timeframe] ?? 'Expected timing of the fundamental price move'}>
                        <div className="rounded-lg bg-[#09090b]/60 border border-white/5 p-2.5 cursor-default">
                          <div className="text-[8px] uppercase tracking-widest text-slate-700 mb-1 font-bold">Timeframe</div>
                          <div className="text-[10px] font-bold text-sky-400">
                            {news.impact_timeframe.toUpperCase()}
                          </div>
                        </div>
                      </Tip>
                    )}
                    {news.attention_window && (
                      <Tip text="How long this news is expected to remain actively market-relevant">
                        <div className="rounded-lg bg-[#09090b]/60 border border-white/5 p-2.5 cursor-default">
                          <div className="text-[8px] uppercase tracking-widest text-slate-700 mb-1 font-bold">Watch Window</div>
                          <div className="text-[10px] font-bold text-amber-400">
                            {news.attention_window.toUpperCase()}
                          </div>
                        </div>
                      </Tip>
                    )}
                  </div>
                  {news.sessions && news.sessions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {news.sessions.map((session) => (
                        <Badge key={session} className={getBadgeTone('violet')}>{session}</Badge>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ── SECTION 4: AFFECTED INSTRUMENTS ── */}
              {news.instruments && news.instruments.length > 0 && (
                <section>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-700 mb-2">
                    Affected Instruments
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {news.instruments.map((inst) => {
                      const isPrimary = news.primary_instrument === inst;
                      return (
                        <Tip
                          key={inst}
                          text={isPrimary
                            ? 'Primary — fewest causal steps from headline to price move'
                            : 'Secondary — direct causal link but more steps removed'}
                        >
                          <Badge className={cn(
                            'font-mono text-[11px] px-2.5 py-1 cursor-default',
                            isPrimary
                              ? 'bg-[#C8935A]/20 border border-[#C8935A]/50 text-[#C8935A] ring-1 ring-[#C8935A]/15'
                              : 'bg-[#0d0f11] border border-slate-700/50 text-slate-400'
                          )}>
                            {isPrimary && '★ '}{inst}
                          </Badge>
                        </Tip>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── KEY NUMBERS ── */}
              {news.key_numbers && Object.keys(news.key_numbers).length > 0 && (
                <section>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-700 mb-2">Key Numbers</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(news.key_numbers).map(([key, val]) => (
                      <div key={key} className="rounded-lg border border-[#C8935A]/10 bg-[#0d0f11] p-3">
                        <div className="text-[9px] uppercase tracking-wider text-[#C8935A]/55 mb-1 font-semibold">{key}</div>
                        <div className="text-lg font-bold text-slate-100 font-mono tracking-tight">
                          {typeof val === 'string' || typeof val === 'number' ? String(val) : JSON.stringify(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── SECTION 5: HISTORICAL PRECEDENT ── */}
              {news.similar_news_context && (
                <section>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-700 mb-2">
                    Historical Precedent
                  </div>
                  <div className="rounded-xl bg-[#09090b]/60 border border-amber-500/15 border-l-2 border-l-amber-500/40 p-3">
                    <p className="text-[12px] text-slate-300 italic leading-relaxed">
                      "{news.similar_news_context}"
                    </p>
                    {news.similar_news_ids && news.similar_news_ids.length > 0 && onHistoricalLinkClick && (
                      <button
                        onClick={handleHistoricalClick}
                        className="mt-2 text-[10px] font-semibold text-[#C8935A] hover:text-[#E2B485] transition-colors flex items-center gap-1"
                        disabled={isFetchingHistory}
                      >
                        {isFetchingHistory ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {isFetchingHistory ? 'Loading...' : 'View historical analysis ↗'}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* ── SECTION 6: EXPECTED FOLLOW-UPS ── */}
              {news.expected_followups && news.expected_followups.length > 0 && (
                <section>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-700 mb-2">Watch Next</div>
                  <div className="rounded-xl bg-[#09090b]/60 border border-white/5 p-3 space-y-1.5">
                    {news.expected_followups.map((followup, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[12px] text-slate-300">
                        <div className="mt-1.5 h-1 w-1 rounded-full bg-[#C8935A]/40 shrink-0" />
                        <span>{followup}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── SECTION 7: ORIGINAL SOURCE ── */}
              {(news.original_email_content || news.content || sanitizedSourceUrls.length > 0) && (
                <details className="group">
                  <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors select-none list-none flex items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center justify-center w-3.5 h-3.5 border rounded-sm transition-colors text-[8px]',
                      'border-slate-700 group-open:border-[#C8935A]/40 group-open:bg-[#C8935A]/10 text-slate-600 group-open:text-[#C8935A]'
                    )}>+</span>
                    Original Source
                  </summary>
                  <div className="mt-3 space-y-2">
                    {(news.original_email_content || news.content) && (
                      <div className="rounded-xl bg-[#09090b]/60 border border-white/5 p-3">
                        <p className="text-[11px] leading-relaxed text-slate-500 whitespace-pre-wrap">
                          {news.original_email_content || news.content}
                        </p>
                      </div>
                    )}
                    {sanitizedSourceUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sanitizedSourceUrls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sa-filter-chip sa-filter-chip-active inline-flex items-center gap-2 text-[10px]"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Source
                          </a>
                        ))}
                      </div>
                    )}
                    {blockedSourceUrlCount > 0 && (
                      <p className="text-[10px] text-slate-700">
                        {blockedSourceUrlCount} source link{blockedSourceUrlCount > 1 ? 's were' : ' was'} blocked as unsafe.
                      </p>
                    )}
                  </div>
                </details>
              )}

            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewsIntelligenceDialog;
