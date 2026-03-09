import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  Minus,
  Newspaper,
  Radio,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { NewsRow } from '@/features/news/components/NewsRow';
import { mapApiNewsItem } from '@/features/news/adapters';
import { getBadgeTone, getImpactTone, getSentimentTone } from '@/features/news/theme';
import type { NewsIntelligenceItem } from '@/features/news/types';
import { useAuth } from '@/hooks/useAuth';
import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { sanitizeExternalUrl } from '@/lib/urlSanitizer';
import { cn } from '@/lib/utils';

type SurfaceTone = 'muted' | 'success' | 'danger' | 'warning' | 'info';

type NewsItem = NewsIntelligenceItem & {
  original_email_content?: string;
  forexfactory_urls?: string[];
};

interface NewsListProps {
  symbol: string;
}

type NewsMode = 'latest' | 'upcoming';

const MAX_NEWS_ITEMS = 50;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const normalizeInstrument = (value: string): string => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

const dedupeNews = (items: NewsItem[]): NewsItem[] => {
  const seen = new Set<string>();
  const result: NewsItem[] = [];

  items.forEach((item) => {
    const key = `${item.id}:${item.headline}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });

  return result;
};

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

const getVolatilityTone = (volatility?: string): string => {
  const value = (volatility || '').toLowerCase();
  if (value === 'high' || value === 'extreme') return getBadgeTone('danger');
  if (value === 'medium') return getBadgeTone('warning');
  if (value === 'low') return getBadgeTone('success');
  return getBadgeTone('muted');
};

const getPressureTone = (pressure?: string): string => {
  const value = (pressure || '').toLowerCase();
  if (value === 'risk_on') return getBadgeTone('success');
  if (value === 'risk_off') return getBadgeTone('danger');
  if (value === 'uncertain') return getBadgeTone('warning');
  return getBadgeTone('muted');
};

const getConfidenceTone = (label?: string): string => {
  const value = (label || '').toLowerCase();
  if (value.includes('high')) return getBadgeTone('success');
  if (value.includes('medium')) return getBadgeTone('warning');
  if (value.includes('low')) return getBadgeTone('danger');
  return getBadgeTone('info');
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

export function NewsList({ symbol }: NewsListProps) {
  const { isAuthenticated, status, backendAvailable } = useAuth();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsMode, setNewsMode] = useState<NewsMode>('latest');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(typeof document === 'undefined' ? true : !document.hidden);

  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const previousVisibleRef = useRef(isVisible);
  const newsRef = useRef<NewsItem[]>([]);

  useEffect(() => {
    newsRef.current = news;
  }, [news]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const filterBySymbol = useCallback(
    (items: NewsItem[]): NewsItem[] => {
      const normalizedSymbol = normalizeInstrument(symbol);
      if (!normalizedSymbol) return items.slice(0, MAX_NEWS_ITEMS);

      const filtered = items.filter((item) =>
        item.instruments?.some((inst) => {
          const normalizedInst = normalizeInstrument(String(inst || ''));
          return normalizedInst === normalizedSymbol;
        })
      );
      return filtered.slice(0, MAX_NEWS_ITEMS);
    },
    [symbol]
  );

  const fetchNews = useCallback(
    async (options?: { silent?: boolean; mode?: NewsMode }) => {
      const mode = options?.mode ?? newsMode;

      if (status === 'loading') return;
      if (!isAuthenticated) {
        setNews([]);
        setLoading(false);
        setError(null);
        setIsLive(false);
        setLastUpdatedAt(null);
        hasFetchedRef.current = false;
        return;
      }
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setError(null);
      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const response =
          mode === 'upcoming'
            ? await apiService.getUpcomingNews()
            : await apiService.getCurrentNews(20, 0);

        if (response.error) {
          throw new Error(response.error);
        }

        const payload = response.data as unknown;
        const payloadRecord =
          payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;

        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payloadRecord?.news)
            ? payloadRecord.news
            : Array.isArray(payloadRecord?.upcoming)
              ? payloadRecord.upcoming
              : Array.isArray(payloadRecord?.events)
                ? payloadRecord.events
                : Array.isArray(payloadRecord?.items)
                  ? payloadRecord.items
                  : [];

        if (!Array.isArray(rows)) {
          setNews([]);
          return;
        }

        const mapped = rows.map(mapApiNewsItem) as NewsItem[];
        const filtered = filterBySymbol(dedupeNews(mapped));
        setNews(filtered);
        const nowIso = new Date().toISOString();
        setLastUpdatedAt(nowIso);
      } catch (fetchError) {
        console.error('[NewsList] Failed to fetch news:', fetchError);
        setError('Failed to load live news.');
        if (newsRef.current.length === 0) {
          setNews([]);
        }
      } finally {
        hasFetchedRef.current = true;
        isFetchingRef.current = false;
        setLoading(false);
      }
    },
    [filterBySymbol, isAuthenticated, newsMode, status]
  );

  useEffect(() => {
    if (status === 'loading') return;
    void fetchNews();
  }, [fetchNews, newsMode, status]);

  useEffect(() => {
    if (status === 'loading') return;
    if (newsMode !== 'latest' || !isAuthenticated) {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const unsubscribe = sseService.subscribeToNews(
      (payload) => {
        const data = asRecord(payload);
        if (!data) return;
        if (data.type === 'heartbeat' || data.type === 'connected') return;

        if (data.type === 'news_snapshot' && Array.isArray(data.news)) {
          const snapshot = filterBySymbol(dedupeNews(data.news.map((entry) => mapApiNewsItem(entry) as NewsItem)));
          setNews(snapshot);
          setLastUpdatedAt(new Date().toISOString());
          return;
        }

        if (data.type === 'news_update' && data.news) {
          const next = mapApiNewsItem(data.news) as NewsItem;
          setNews((prev) => {
            const merged = filterBySymbol(dedupeNews([next, ...prev]));
            return merged;
          });
          setLastUpdatedAt(new Date().toISOString());
        }
      },
      (sseError) => {
        console.error('[NewsList] SSE error:', sseError);
        setIsLive(false);
      }
    );

    return () => {
      unsubscribe();
      setIsLive(false);
    };
  }, [filterBySymbol, isAuthenticated, newsMode, status]);

  useEffect(() => {
    const wasVisible = previousVisibleRef.current;
    previousVisibleRef.current = isVisible;

    if (wasVisible || !isVisible) return;
    if (!isAuthenticated || status === 'loading') return;

    void fetchNews({ silent: true });
  }, [fetchNews, isAuthenticated, isVisible, status]);

  const sourceUrls = selectedNews?.forexfactory_urls?.length
    ? selectedNews.forexfactory_urls
    : selectedNews?.forexfactory_url
      ? [selectedNews.forexfactory_url]
      : [];
  const sanitizedSourceUrls = sourceUrls
    .map((url) => sanitizeExternalUrl(url))
    .filter((url): url is string => Boolean(url));
  const blockedSourceUrlCount = Math.max(0, sourceUrls.length - sanitizedSourceUrls.length);

  const whySurfaceTone = getWhySurfaceTone(selectedNews?.sentiment, selectedNews?.market_pressure);
  const impactSurfaceTone = getImpactSurfaceTone(selectedNews?.market_impact);
  const volatilitySurfaceTone = getVolatilitySurfaceTone(selectedNews?.volatility_expectation);

  return (
    <>
      <Card className="sa-news-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 sa-accent" />
            <h3 className="text-sm font-semibold uppercase tracking-wide sa-accent">
              {newsMode === 'latest' ? 'Latest News' : 'Upcoming News'}
            </h3>
            <div className="ml-2 inline-flex rounded-md border border-white/10 bg-slate-900/40 p-0.5">
              <button
                type="button"
                onClick={() => setNewsMode('latest')}
                className={cn(
                  'rounded px-2 py-1 text-[11px] font-medium transition-colors',
                  newsMode === 'latest' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-300 hover:text-white'
                )}
              >
                Latest
              </button>
              <button
                type="button"
                onClick={() => setNewsMode('upcoming')}
                className={cn(
                  'rounded px-2 py-1 text-[11px] font-medium transition-colors',
                  newsMode === 'upcoming' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-300 hover:text-white'
                )}
              >
                Upcoming
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {newsMode === 'latest' && isLive && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-xs',
                  backendAvailable ? 'text-emerald-300' : 'text-rose-300'
                )}
              >
                <Radio className={cn('h-4 w-4', backendAvailable && 'animate-pulse')} />
                <span>LIVE</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-300 hover:text-white"
              onClick={() => void fetchNews()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {lastUpdatedAt && (
          <p className="mb-2 text-[11px] text-slate-400">
            Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
          </p>
        )}
        {error && <p className="mb-2 text-xs text-amber-300">{error}</p>}
        <div className="max-h-[520px] overflow-y-auto pr-1">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
              </div>
            ) : news.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                {newsMode === 'latest' ? 'No recent news' : 'No upcoming news'}
              </p>
            ) : (
              news.map((item) => (
                <NewsRow
                  key={item.id}
                  item={item}
                  expanded={false}
                  onToggleExpand={() => setSelectedNews(item)}
                  onOpenDetails={() => setSelectedNews(item)}
                  showInstruments={false}
                />
              ))
            )}
          </div>
        </div>
      </Card>

      <Dialog open={Boolean(selectedNews)} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className={cn('sa-news-dialog text-white sm:max-w-3xl', getDialogSentimentClass(selectedNews?.sentiment))}>
          <DialogHeader className="space-y-4 border-b border-amber-300/18 pb-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900/55">
                {selectedNews && getSentimentIcon(selectedNews.sentiment)}
              </div>
              <DialogTitle className="pr-8 text-xl leading-tight sm:text-[1.65rem]">
                {selectedNews?.headline}
              </DialogTitle>
            </div>
            {selectedNews && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge className={cn(getBadgeTone('muted'), 'gap-1.5 sa-news-label')}>
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(selectedNews.timestamp).toLocaleString()}
                </Badge>
                {selectedNews.source && (
                  <Badge className={cn(getBadgeTone('muted'), 'sa-news-label')}>
                    {selectedNews.source}
                  </Badge>
                )}
                {selectedNews.sentiment && (
                  <Badge className={cn(getImpactTone(selectedNews.sentiment), 'uppercase sa-news-label')}>
                    {selectedNews.sentiment}
                  </Badge>
                )}
                {getImpactBadge(selectedNews.importance, selectedNews.breaking)}
              </div>
            )}
          </DialogHeader>

          {selectedNews && (
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
                    {selectedNews.human_takeaway && (
                      <p className="text-sm leading-relaxed text-slate-200">
                        {selectedNews.human_takeaway}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {selectedNews.market_pressure && (
                        <Badge className={cn(getPressurePillClass(selectedNews.market_pressure))}>
                          {selectedNews.market_pressure.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                      {selectedNews.attention_window && (
                        <Badge className="sa-pill-filled sa-pill-filled-warning">
                          ATTENTION {selectedNews.attention_window}
                        </Badge>
                      )}
                      {selectedNews.confidence_label && (
                        <Badge className={cn(getConfidencePillClass(selectedNews.confidence_label))}>
                          {selectedNews.confidence_label} CONFIDENCE
                        </Badge>
                      )}
                    </div>
                  </div>
                </section>

                {selectedNews.expected_followups && selectedNews.expected_followups.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-300">
                      What to Watch Next
                    </h4>
                    <div className={cn('p-4', getSurfaceClass('info'))}>
                      <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                        {selectedNews.expected_followups.map((followup) => (
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
                    {selectedNews.market_impact && (
                      <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass(impactSurfaceTone))}>
                        <Badge className={cn(getDirectionPillClass(selectedNews.market_impact))}>
                          DIRECTION: {selectedNews.market_impact.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {selectedNews.volatility_expectation && (
                      <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass(volatilitySurfaceTone))}>
                        <Badge className={cn(getVolatilityPillClass(selectedNews.volatility_expectation))}>
                          VOLATILITY: {selectedNews.volatility_expectation.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {selectedNews.impact_timeframe && (
                      <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass('info'))}>
                        <div className="mb-1 text-xs sa-muted">Timeframe</div>
                        <Badge className={cn(getBadgeTone('info'), 'sa-news-label text-xs')}>
                          {selectedNews.impact_timeframe.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {selectedNews.instruments && selectedNews.instruments.length > 0 && (
                      <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass('muted'))}>
                        <div className="mb-2 text-xs sa-muted">Currency Pairs</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedNews.instruments.map((instrument) => (
                            <Badge key={instrument} className={getBadgeTone('muted')}>
                              {instrument}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedNews.sessions && selectedNews.sessions.length > 0 && (
                      <div className={cn('p-3 sa-news-tone-gold', getSurfaceClass('muted'))}>
                        <div className="mb-2 text-xs sa-muted">Active Sessions</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedNews.sessions.map((session) => (
                            <Badge key={session} className={getBadgeTone('violet')}>
                              {session}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {selectedNews.summary && (
                  <details className="space-y-2">
                    <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-200">
                      Full Analysis
                    </summary>
                    <div className={cn('p-4', getSurfaceClass('muted'))}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                        {selectedNews.summary}
                      </p>
                    </div>
                  </details>
                )}

                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-200">
                    Original Source
                  </summary>
                  <div className="space-y-3">
                    {(selectedNews.original_email_content || selectedNews.content) && (
                      <div className={cn('p-4', getSurfaceClass('muted'))}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                          {selectedNews.original_email_content || selectedNews.content}
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
    </>
  );
}
