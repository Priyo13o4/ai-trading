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

import { NewsIntelligenceDialog } from '@/features/news/components/NewsIntelligenceDialog';
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
  const base = 'border-2 border-[#C8935A]/30';

  switch ((sentiment || '').toLowerCase()) {
    case 'bearish':
      return `${base} bg-gradient-to-br from-red-950/20 via-[#111315]/55 to-[#111315]/70`;
    case 'bullish':
      return `${base} bg-gradient-to-br from-emerald-950/20 via-[#111315]/55 to-[#111315]/70`;
    default:
      return `${base} bg-gradient-to-br from-[#E2B485]/5 via-[#111315]/55 to-[#111315]/70`;
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
    const unsubscribe = sseService.subscribeToSignalMuxNews(
      symbol,
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
                  'rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase transition-all',
                  newsMode === 'latest' ? 'bg-[#E2B485]/20 text-[#E2B485]' : 'text-slate-400 hover:text-white'
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

      <NewsIntelligenceDialog
        open={Boolean(selectedNews)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedNews(null);
          }
        }}
        news={selectedNews}
      />
    </>
  );
}
