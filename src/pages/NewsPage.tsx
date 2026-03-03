import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Minus,
  Newspaper,
  Radio,
  RefreshCw,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EventAnalysisPanel } from '@/features/news/components/EventAnalysisPanel';
import { NewsRow } from '@/features/news/components/NewsRow';
import { WeeklyPlaybookPanel } from '@/features/news/components/WeeklyPlaybookPanel';
import { useNewsFeed } from '@/features/news/hooks/useNewsFeed';
import { getBadgeTone, getFilterChipTone, getImpactTone, getSentimentTone } from '@/features/news/theme';
import type { NewsIntelligenceItem } from '@/features/news/types';
import { useAuth } from '@/hooks/useAuth';
import { useLowSpecDevice } from '@/hooks/useLowSpecDevice';
import { useSymbols } from '@/hooks/useSymbols';
import { sanitizeExternalUrl } from '@/lib/urlSanitizer';
import { cn } from '@/lib/utils';

type SortOption = 'date' | 'importance' | 'sentiment';
type TimeFilter = 'all' | 'today' | 'week' | 'month';
type SurfaceTone = 'muted' | 'success' | 'danger' | 'warning' | 'info';

type NewsItem = NewsIntelligenceItem & {
  original_email_content?: string;
  forexfactory_urls?: string[];
};

const EVENT_TYPES = [
  { value: 'all', label: 'All Events' },
  { value: 'economic_data', label: 'Economic Data' },
  { value: 'central_bank', label: 'Central Bank' },
  { value: 'geopolitical', label: 'Geopolitical' },
  { value: 'trade', label: 'Trade' },
  { value: 'political', label: 'Political' },
  { value: 'market_technical', label: 'Market Technical' },
  { value: 'other', label: 'Other' },
] as const;

const sentimentOrder: Record<string, number> = {
  bullish: 2,
  neutral: 1,
  bearish: 0,
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
  const base = 'border-2 border-amber-300/55'; // Gold outline default

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

export default function NewsPage() {
  const navigate = useNavigate();
  const { backendAvailable } = useAuth();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    items,
    loading,
    loadingMore,
    error,
    isLive,
    isCachedFallback,
    lastUpdatedAt,
    refresh,
    loadMore,
    hasMore,
    total,
  } = useNewsFeed();
  const news = items as NewsItem[];

  const { symbols: instruments } = useSymbols();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [minImportance, setMinImportance] = useState(1);
  const [showBreakingOnly, setShowBreakingOnly] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [showCentralBankOnly, setShowCentralBankOnly] = useState(false);
  const [showTradeDealOnly, setShowTradeDealOnly] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = loadMoreRef.current;
    if (target) observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  const filteredNews = useMemo(() => {
    let result = [...news];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        return (
          item.headline.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query)
        );
      });
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      result = result.filter((item) => {
        const itemDate = new Date(item.timestamp);
        switch (timeFilter) {
          case 'today': {
            return itemDate.toDateString() === now.toDateString();
          }
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= monthAgo;
          }
          default:
            return true;
        }
      });
    }

    if (selectedInstruments.length > 0) {
      result = result.filter((item) =>
        item.instruments?.some((inst) =>
          selectedInstruments.some(
            (selected) =>
              inst.toUpperCase().includes(selected) ||
              selected.includes(inst.toUpperCase())
          )
        )
      );
    }

    result = result.filter((item) => item.importance >= minImportance);

    if (showBreakingOnly) {
      result = result.filter((item) => item.breaking);
    }

    if (selectedEventType !== 'all') {
      result = result.filter((item) => item.news_category === selectedEventType);
    }

    if (showCentralBankOnly) {
      result = result.filter((item) => item.central_bank_related);
    }

    if (showTradeDealOnly) {
      result = result.filter((item) => item.trade_deal_related);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'importance':
          return b.importance - a.importance;
        case 'sentiment':
          return (
            (sentimentOrder[b.sentiment || 'neutral'] ?? 1) -
            (sentimentOrder[a.sentiment || 'neutral'] ?? 1)
          );
        default:
          return 0;
      }
    });

    return result;
  }, [
    news,
    searchQuery,
    timeFilter,
    selectedInstruments,
    minImportance,
    showBreakingOnly,
    selectedEventType,
    showCentralBankOnly,
    showTradeDealOnly,
    sortBy,
  ]);

  const groupedNews = useMemo(() => {
    const groups: Record<string, NewsItem[]> = {};
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    filteredNews.forEach((item) => {
      const itemDate = new Date(item.timestamp);
      let groupKey = '';
      if (itemDate.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (itemDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = itemDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredNews]);

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments((previous) =>
      previous.includes(instrument)
        ? previous.filter((item) => item !== instrument)
        : [...previous, instrument]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTimeFilter('all');
    setSelectedInstruments([]);
    setMinImportance(1);
    setShowBreakingOnly(false);
    setSelectedEventType('all');
    setShowCentralBankOnly(false);
    setShowTradeDealOnly(false);
  };

  const hasActiveFilters =
    selectedInstruments.length > 0 ||
    Boolean(searchQuery) ||
    timeFilter !== 'all' ||
    minImportance > 1 ||
    showBreakingOnly ||
    selectedEventType !== 'all' ||
    showCentralBankOnly ||
    showTradeDealOnly;

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
  const liveBadgeTone = backendAvailable ? getBadgeTone('success') : getBadgeTone('danger');
  const liveLabel = backendAvailable ? 'Live' : 'Offline';
  const showLiveBadge = isLive || !backendAvailable;
  const isLowSpecDevice = useLowSpecDevice();

  return (
    <main className={cn('sa-scope relative min-h-screen overflow-x-hidden text-white', isLowSpecDevice && 'sa-low-spec')}>
      <div className={cn('relative z-10 pt-16', !isLowSpecDevice && 'sa-noise-overlay')}>
      <header
        style={{ top: 'calc(var(--beta-banner-offset, 0px) + 4rem)' }}
        className="sticky z-40 border-b border-slate-700/60 bg-transparent"
      >
        <div className="sa-container py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="sa-btn-ghost">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 sa-accent" />
                  <h1 className="text-xl font-display font-semibold text-white">Market News</h1>
                </div>
                <p className="text-xs sa-muted">Live intelligence feed with contextual impact.</p>
              </div>
              {showLiveBadge && (
                <Badge className={cn(liveBadgeTone, 'ml-2 gap-1 sa-news-label')}>
                  <Radio className={cn('h-4 w-4', backendAvailable && 'animate-pulse')} />
                  {liveLabel}
                </Badge>
              )}
              {isCachedFallback && (
                <Badge className={cn(getBadgeTone('warning'), 'ml-2')}>Cached</Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button variant="outline" size="sm" onClick={refresh} className="sa-btn-neutral">
                <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
                Refresh
              </Button>
              {lastUpdatedAt && (
                <span className="text-[11px] sa-muted">
                  Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="sa-container pb-10 pt-6">
        <Tabs defaultValue="news-feed" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 p-1 sm:grid-cols-3">
            <TabsTrigger
              value="news-feed"
              className="data-[state=active]:sa-btn-neutral data-[state=active]:text-white"
            >
              News Feed
            </TabsTrigger>
            <TabsTrigger
              value="weekly-playbook"
              className="data-[state=active]:sa-btn-neutral data-[state=active]:text-white"
            >
              Weekly Playbook
            </TabsTrigger>
            <TabsTrigger
              value="event-analysis"
              className="data-[state=active]:sa-btn-neutral data-[state=active]:text-white"
            >
              Event Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news-feed" className="mt-0">
        <Card className={cn('mb-6 p-4', isLowSpecDevice ? 'sa-news-card-low-spec' : 'sa-news-card sa-liquid-card')}>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 sa-muted" />
              <Input
                placeholder="Search headlines or summaries..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="sa-input pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="sa-btn-neutral">
                    <Calendar className="mr-2 h-4 w-4" />
                    {timeFilter === 'all'
                      ? 'All Time'
                      : timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sa-news-card text-slate-100">
                  {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option}
                      checked={timeFilter === option}
                      onCheckedChange={() => setTimeFilter(option)}
                    >
                      {option === 'all'
                        ? 'All Time'
                        : option.charAt(0).toUpperCase() + option.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="sa-btn-neutral">
                    <Filter className="mr-2 h-4 w-4" />
                    Instruments
                    {selectedInstruments.length > 0 && (
                      <Badge className="ml-2 sa-badge-accent">{selectedInstruments.length}</Badge>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sa-news-card text-slate-100">
                  <DropdownMenuLabel className="sa-muted">Select Instruments</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700/70" />
                  {instruments.map((instrument) => (
                    <DropdownMenuCheckboxItem
                      key={instrument}
                      checked={selectedInstruments.includes(instrument)}
                      onCheckedChange={() => toggleInstrument(instrument)}
                    >
                      {instrument}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="sa-btn-neutral">
                    <Star className="mr-2 h-4 w-4" />
                    Importance {minImportance}+
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sa-news-card text-slate-100">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <DropdownMenuCheckboxItem
                      key={level}
                      checked={minImportance === level}
                      onCheckedChange={() => setMinImportance(level)}
                    >
                      {level}+ stars
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="sa-btn-neutral">
                    Sort {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sa-news-card text-slate-100">
                  {(['date', 'importance', 'sentiment'] as SortOption[]).map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option}
                      checked={sortBy === option}
                      onCheckedChange={() => setSortBy(option)}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBreakingOnly((value) => !value)}
                className={getFilterChipTone('danger', showBreakingOnly)}
              >
                <Zap className="mr-1 h-4 w-4" />
                Breaking
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="sa-btn-neutral">
                    Event Type
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="sa-news-card text-slate-100">
                  <DropdownMenuLabel className="sa-muted">Event Type</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700/70" />
                  {EVENT_TYPES.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type.value}
                      checked={selectedEventType === type.value}
                      onCheckedChange={() => setSelectedEventType(type.value)}
                    >
                      {type.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCentralBankOnly((value) => !value)}
                className={getFilterChipTone('info', showCentralBankOnly)}
              >
                <TrendingUp className="mr-1 h-4 w-4" />
                Central Bank
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTradeDealOnly((value) => !value)}
                className={getFilterChipTone('violet', showTradeDealOnly)}
              >
                <BarChart3 className="mr-1 h-4 w-4" />
                Trade Deal
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-amber-300/20 pt-4">
              <span className="text-xs sa-muted">Active filters:</span>

              {searchQuery && (
                <button className={getFilterChipTone('default', true)} onClick={() => setSearchQuery('')}>
                  Search: "{searchQuery}" ✕
                </button>
              )}
              {timeFilter !== 'all' && (
                <button className={getFilterChipTone('default', true)} onClick={() => setTimeFilter('all')}>
                  Time: {timeFilter} ✕
                </button>
              )}
              {selectedInstruments.map((instrument) => (
                <button
                  key={instrument}
                  className={getFilterChipTone('accent', true)}
                  onClick={() => toggleInstrument(instrument)}
                >
                  {instrument} ✕
                </button>
              ))}
              {minImportance > 1 && (
                <button className={getFilterChipTone('default', true)} onClick={() => setMinImportance(1)}>
                  {minImportance}+ stars ✕
                </button>
              )}
              {showBreakingOnly && (
                <button
                  className={getFilterChipTone('danger', true)}
                  onClick={() => setShowBreakingOnly(false)}
                >
                  Breaking ✕
                </button>
              )}
              {selectedEventType !== 'all' && (
                <button className={getFilterChipTone('default', true)} onClick={() => setSelectedEventType('all')}>
                  {EVENT_TYPES.find((item) => item.value === selectedEventType)?.label} ✕
                </button>
              )}
              {showCentralBankOnly && (
                <button className={getFilterChipTone('info', true)} onClick={() => setShowCentralBankOnly(false)}>
                  Central Bank ✕
                </button>
              )}
              {showTradeDealOnly && (
                <button className={getFilterChipTone('violet', true)} onClick={() => setShowTradeDealOnly(false)}>
                  Trade Deal ✕
                </button>
              )}

              <Button variant="ghost" size="sm" onClick={clearFilters} className="sa-btn-ghost h-7">
                Clear all
              </Button>
            </div>
          )}
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
              <p className="sa-muted">Loading market news...</p>
            </div>
          </div>
        ) : error && filteredNews.length === 0 ? (
          <Card className="sa-news-card sa-liquid-card p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-rose-300" />
            <p className="mb-4 text-rose-300">{error}</p>
            <Button variant="outline" className="sa-btn-neutral" onClick={refresh}>
              Try Again
            </Button>
          </Card>
        ) : filteredNews.length === 0 ? (
          <Card className="sa-news-card sa-liquid-card p-8 text-center">
            <Newspaper className="mx-auto mb-3 h-12 w-12 text-slate-500" />
            <p className="mb-1 text-slate-300">No news found</p>
            <p className="text-sm sa-muted">Try adjusting your filters.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNews).map(([date, dateItems]) => (
              <section key={date}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-display font-semibold text-white">{date}</h2>
                  <Badge className={getBadgeTone('muted')}>
                    {dateItems.length} {dateItems.length === 1 ? 'article' : 'articles'}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {dateItems.map((item) => (
                    <NewsRow
                      key={item.id}
                      item={item}
                      expanded={expandedNewsId === item.id}
                      onToggleExpand={() =>
                        setExpandedNewsId((current) => (current === item.id ? null : item.id))
                      }
                      onOpenDetails={() => setSelectedNews(item)}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div ref={loadMoreRef} className="flex flex-col items-center gap-4 py-8">
              {loadingMore && (
                <div className="flex items-center gap-2 sa-muted">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading more news...
                </div>
              )}
              {hasMore && !loadingMore && (
                <Button variant="outline" className="sa-btn-neutral" onClick={loadMore}>
                  Load More
                </Button>
              )}
              {!hasMore && news.length > 0 && (
                <p className="text-sm sa-muted">End of feed • {total} total items</p>
              )}
            </div>
          </div>
        )}
          </TabsContent>

          <TabsContent value="weekly-playbook" className="mt-0">
            <WeeklyPlaybookPanel />
          </TabsContent>

          <TabsContent value="event-analysis" className="mt-0">
            <EventAnalysisPanel />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(selectedNews)} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className={cn(
          "sa-news-dialog text-white sm:max-w-3xl",
          getDialogSentimentClass(selectedNews?.sentiment)
        )}>
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
      </div>
    </main>
  );
}
