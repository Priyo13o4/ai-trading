import { useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
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
import { getBadgeTone, getImpactTone, getSentimentTone } from '@/features/news/theme';
import type { NewsIntelligenceItem } from '@/features/news/types';
import { sanitizeExternalUrl } from '@/lib/urlSanitizer';
import { cn } from '@/lib/utils';

type SurfaceTone = 'muted' | 'success' | 'danger' | 'warning' | 'info';

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

const getSurfaceClass = (tone: SurfaceTone): string => `sa-news-tone sa-news-tone-${tone}`;

const getSurfaceHeadingTone = (tone: SurfaceTone): string => {
  switch (tone) {
    case 'success':
      return 'text-emerald-300';
    case 'danger':
      return 'text-rose-300';
    case 'warning':
      return 'text-amber-300';
    case 'info':
      return 'text-sky-300';
    default:
      return 'sa-accent';
  }
};

const getImpactSurfaceTone = (impact?: string): SurfaceTone => {
  switch ((impact || '').toLowerCase()) {
    case 'bullish':
      return 'success';
    case 'bearish':
      return 'danger';
    case 'mixed':
      return 'muted';
    default:
      return 'muted';
  }
};

const getDirectionPillClass = (impact?: string): string => {
  switch ((impact || '').toLowerCase()) {
    case 'bullish':
      return 'sa-pill-filled sa-pill-filled-success';
    case 'bearish':
      return 'sa-pill-filled sa-pill-filled-danger';
    case 'mixed':
      return 'sa-pill-filled sa-pill-filled-muted';
    default:
      return 'sa-pill-filled sa-pill-filled-muted';
  }
};

const getVolatilityPillClass = (volatility?: string): string => {
  const value = (volatility || '').toLowerCase();
  if (value === 'high' || value === 'extreme') return 'sa-pill-filled sa-pill-filled-danger';
  if (value === 'medium') return 'sa-pill-filled sa-pill-filled-warning';
  if (value === 'low') return 'sa-pill-filled sa-pill-filled-success';
  return 'sa-pill-filled sa-pill-filled-muted';
};

const getVolatilitySurfaceTone = (volatility?: string): SurfaceTone => {
  const value = (volatility || '').toLowerCase();
  if (value === 'high' || value === 'extreme') return 'danger';
  if (value === 'medium') return 'warning';
  if (value === 'low') return 'success';
  return 'muted';
};

const getConfidencePillClass = (label?: string): string => {
  const value = (label || '').toLowerCase();
  if (value.includes('high')) return 'sa-pill-filled sa-pill-filled-success';
  if (value.includes('medium')) return 'sa-pill-filled sa-pill-filled-warning';
  if (value.includes('low')) return 'sa-pill-filled sa-pill-filled-danger';
  return 'sa-pill-filled sa-pill-filled-info';
};

const getPressurePillClass = (pressure?: string): string => {
  const value = (pressure || '').toLowerCase();
  if (value === 'risk_on') return 'sa-pill-filled sa-pill-filled-success';
  if (value === 'risk_off') return 'sa-pill-filled sa-pill-filled-danger';
  if (value === 'uncertain') return 'sa-pill-filled sa-pill-filled-warning';
  return 'sa-pill-filled sa-pill-filled-muted';
};

const getWhySurfaceTone = (sentiment?: string, pressure?: string): SurfaceTone => {
  const pressureValue = (pressure || '').toLowerCase();
  if (pressureValue === 'risk_on') return 'success';
  if (pressureValue === 'risk_off') return 'danger';
  if (pressureValue === 'uncertain') return 'warning';

  switch ((sentiment || '').toLowerCase()) {
    case 'bullish':
      return 'success';
    case 'bearish':
      return 'danger';
    case 'mixed':
      return 'muted';
    default:
      return 'muted';
  }
};

const getSentimentIcon = (sentiment?: string) => {
  const className = getSentimentTone(sentiment);
  switch (sentiment) {
    case 'bullish':
      return <TrendingUp className={cn('h-4 w-4', className)} />;
    case 'bearish':
      return <TrendingDown className={cn('h-4 w-4', className)} />;
    default:
      return <Minus className={cn('h-4 w-4', className)} />;
  }
};

const getDialogSentimentClass = (sentiment?: string): string => {
  const base = 'border-2 border-amber-300/55';

  switch ((sentiment || '').toLowerCase()) {
    case 'bearish':
      return `${base} bg-gradient-to-br from-red-950/35 via-slate-900/55 to-slate-900/70`;
    case 'bullish':
      return `${base} bg-gradient-to-br from-emerald-950/35 via-slate-900/55 to-slate-900/70`;
    default:
      return `${base} bg-gradient-to-br from-white/10 via-slate-900/55 to-slate-900/70`;
  }
};

const getImpactBadge = (importance: number, breaking?: boolean) => {
  if (breaking) {
    return (
      <Badge className={cn(getBadgeTone('danger'), 'gap-1 sa-news-label')}>
        <Zap className="h-4 w-4" />
        Breaking
      </Badge>
    );
  }

  if (importance >= 4) {
    return (
      <Badge className={cn(getBadgeTone('warning'), 'gap-1 sa-news-label')}>
        <AlertTriangle className="h-4 w-4" />
        High Impact
      </Badge>
    );
  }

  if (importance >= 3) {
    return <Badge className={cn(getBadgeTone('accent'), 'sa-news-label')}>Medium Impact</Badge>;
  }

  return <Badge className={cn(getBadgeTone('muted'), 'sa-news-label')}>Low Impact</Badge>;
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
  const whySurfaceTone = getWhySurfaceTone(news?.sentiment, news?.market_pressure);
  const impactSurfaceTone = getImpactSurfaceTone(news?.market_impact);
  const volatilitySurfaceTone = getVolatilitySurfaceTone(news?.volatility_expectation);

  const handleHistoricalClick = () => {
    const id = news?.similar_news_ids?.[0];
    if (!id || !onHistoricalLinkClick) return;
    void onHistoricalLinkClick(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sa-news-dialog text-white sm:max-w-3xl', getDialogSentimentClass(news?.sentiment))}>
        <DialogHeader className="space-y-4 border-b border-amber-300/18 pb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900/55">
              {news && getSentimentIcon(news.sentiment)}
            </div>
            <DialogTitle className="pr-8 text-xl leading-tight sm:text-[1.65rem]">
              {news?.headline || 'News Intelligence'}
            </DialogTitle>
          </div>
          {news && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge className={cn(getBadgeTone('muted'), 'gap-1.5 sa-news-label')}>
                <Clock className="h-3.5 w-3.5" />
                {new Date(news.timestamp).toLocaleString()}
              </Badge>
              {news.source && (
                <Badge className={cn(getBadgeTone('muted'), 'sa-news-label')}>
                  {news.source}
                </Badge>
              )}
              {news.sentiment && (
                <Badge className={cn(getImpactTone(news.sentiment), 'uppercase sa-news-label')}>
                  {news.sentiment}
                </Badge>
              )}

              {getImpactBadge(news.importance, news.breaking)}
            </div>
          )}
        </DialogHeader>

        {news && (
          <ScrollArea className="mt-4 max-h-[64vh] pr-3">
            <div className="space-y-4">
              <section>
                <h4
                  className={cn(
                    'mb-2 text-sm font-semibold uppercase tracking-wide',
                    getSurfaceHeadingTone(whySurfaceTone)
                  )}
                >
                  Why This Matters
                </h4>
                <div className={cn('space-y-3 p-4 sa-news-tone-gold', getSurfaceClass(whySurfaceTone))}>
                  {news.human_takeaway && (
                    <p className="text-sm leading-relaxed text-slate-200">
                      {news.human_takeaway}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {news.market_pressure && (
                      <Badge className={cn(getPressurePillClass(news.market_pressure))}>
                        {news.market_pressure.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                    {news.attention_window && (
                      <Badge className="sa-pill-filled sa-pill-filled-warning">
                        ATTENTION {news.attention_window}
                      </Badge>
                    )}
                    {news.confidence_label && (
                      <Badge className={cn(getConfidencePillClass(news.confidence_label))}>
                        {news.confidence_label} CONFIDENCE
                      </Badge>
                    )}
                  </div>
                </div>
              </section>

              {news.expected_followups && news.expected_followups.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-300">
                    What to Watch Next
                  </h4>
                  <div className={cn('p-4', getSurfaceClass('info'))}>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                      {news.expected_followups.map((followup) => (
                        <li key={followup}>{followup}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              <section>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">
                  Market Context
                </h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {news.market_impact && (
                    <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass(impactSurfaceTone))}>
                      <Badge className={cn(getDirectionPillClass(news.market_impact))}>
                        DIRECTION: {news.market_impact.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  {news.volatility_expectation && (
                    <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass(volatilitySurfaceTone))}>
                      <Badge className={cn(getVolatilityPillClass(news.volatility_expectation))}>
                        VOLATILITY: {news.volatility_expectation.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  {news.impact_timeframe && (
                    <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass('info'))}>
                      <div className="mb-1 text-xs sa-muted">Timeframe</div>
                      <Badge className={cn(getBadgeTone('info'), 'sa-news-label text-xs')}>
                        {news.impact_timeframe.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {news.instruments && news.instruments.length > 0 && (
                    <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass('muted'))}>
                      <div className="mb-2 text-xs sa-muted">Currency Pairs</div>
                      <div className="flex flex-wrap gap-2">
                        {news.instruments.map((instrument) => {
                          const isPrimary = news.primary_instrument === instrument;
                          return (
                            <Badge
                              key={instrument}
                              className={cn(
                                isPrimary
                                  ? 'bg-[#C8935A] text-[#111315] font-bold shadow-[0_0_15px_rgba(200,147,90,0.3)] ring-2 ring-[#C8935A]/30'
                                  : getBadgeTone('muted')
                              )}
                            >
                              {instrument}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {news.sessions && news.sessions.length > 0 && (
                    <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass('muted'))}>
                      <div className="mb-2 text-xs sa-muted">Active Sessions</div>
                      <div className="flex flex-wrap gap-2">
                        {news.sessions.map((session) => (
                          <Badge key={session} className={getBadgeTone('violet')}>
                            {session}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {news.similar_news_context && (
                <section>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-400/80">
                    Historical Precedent
                  </h4>
                  <div className={cn('p-4 border-l-2 border-amber-500/30', getSurfaceClass('muted'))}>
                    <p className="text-sm leading-relaxed text-slate-300 italic">
                      "{news.similar_news_context}"
                    </p>
                    {news.similar_news_ids && news.similar_news_ids.length > 0 && onHistoricalLinkClick && (
                      <button
                        onClick={handleHistoricalClick}
                        className="mt-3 text-xs font-semibold text-[#C8935A] hover:text-[#E2B485] transition-colors underline decoration-[#C8935A]/30 underline-offset-4 flex items-center gap-1"
                        disabled={isFetchingHistory}
                      >
                        {isFetchingHistory ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {isFetchingHistory ? 'Loading history...' : 'View historical news analysis ↗'}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {(news.ai_analysis_summary || news.summary) && (
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-200">
                    Full Analysis
                  </summary>
                  <div className={cn('p-4', getSurfaceClass('muted'))}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {news.ai_analysis_summary || news.summary}
                    </p>
                  </div>
                </details>
              )}

              <details className="space-y-2">
                <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-200">
                  Original Source
                </summary>
                <div className="space-y-3">
                  {(news.original_email_content || news.content) && (
                    <div className={cn('p-4', getSurfaceClass('muted'))}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                        {news.original_email_content || news.content}
                      </p>
                    </div>
                  )}
                  {sanitizedSourceUrls.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {sanitizedSourceUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sa-filter-chip sa-filter-chip-active inline-flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Source
                        </a>
                      ))}
                    </div>
                  )}
                  {blockedSourceUrlCount > 0 && (
                    <p className="text-xs sa-muted">
                      {blockedSourceUrlCount} source link
                      {blockedSourceUrlCount > 1 ? 's were' : ' was'} blocked as unsafe.
                    </p>
                  )}
                </div>
              </details>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewsIntelligenceDialog;