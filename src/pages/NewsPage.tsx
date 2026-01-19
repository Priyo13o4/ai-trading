import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Search,
  Filter,
  Radio,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertTriangle,
  Zap,
  RefreshCw,
  ChevronDown,
  Newspaper,
  Star,
  Calendar,
  ExternalLink,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { useSymbols } from '@/hooks/useSymbols';
import type { NewsIntelligenceItem } from '@/features/news/types';
import { useNewsFeed } from '@/features/news/hooks/useNewsFeed';
import { NewsRow } from '@/features/news/components/NewsRow';

type NewsItem = NewsIntelligenceItem;

type SortOption = 'date' | 'importance' | 'sentiment';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function NewsPage() {
  const navigate = useNavigate();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);

  const {
    items: news,
    loading,
    loadingMore,
    error,
    isLive,
    refresh,
    loadMore,
    hasMore,
    total,
  } = useNewsFeed();
  
  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get dynamic instruments from API
  const { symbols: INSTRUMENTS } = useSymbols();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [minImportance, setMinImportance] = useState(1);
  const [showBreakingOnly, setShowBreakingOnly] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [showCentralBankOnly, setShowCentralBankOnly] = useState(false);
  const [showTradeDealOnly, setShowTradeDealOnly] = useState(false);

  const EVENT_TYPES = [
    { value: 'all', label: 'All Events' },
    { value: 'economic_data', label: 'Economic Data' },
    { value: 'central_bank', label: 'Central Bank' },
    { value: 'geopolitical', label: 'Geopolitical' },
    { value: 'trade', label: 'Trade' },
    { value: 'political', label: 'Political' },
    { value: 'market_technical', label: 'Market Technical' },
    { value: 'other', label: 'Other' },
  ];

  // (Data plumbing moved into useNewsFeed)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  // (SSE moved into useNewsFeed)

  // Filter and sort news
  const filteredNews = useMemo(() => {
    let result = [...news];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.headline.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query)
      );
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      result = result.filter((item) => {
        const itemDate = new Date(item.timestamp);
        switch (timeFilter) {
          case 'today':
            return itemDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Instrument filter
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

    // Importance filter
    result = result.filter((item) => item.importance >= minImportance);

    // Breaking news filter
    if (showBreakingOnly) {
      result = result.filter((item) => item.breaking);
    }

    // Event type filter
    if (selectedEventType !== 'all') {
      result = result.filter((item) => item.news_category === selectedEventType);
    }

    // Central bank filter
    if (showCentralBankOnly) {
      result = result.filter((item) => item.central_bank_related);
    }

    // Trade deal filter
    if (showTradeDealOnly) {
      result = result.filter((item) => item.trade_deal_related);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'importance':
          return b.importance - a.importance;
        case 'sentiment':
          const sentimentOrder = { bullish: 2, neutral: 1, bearish: 0 };
          return (sentimentOrder[b.sentiment || 'neutral'] || 1) - (sentimentOrder[a.sentiment || 'neutral'] || 1);
        default:
          return 0;
      }
    });

    return result;
  }, [news, searchQuery, timeFilter, selectedInstruments, minImportance, showBreakingOnly, selectedEventType, showCentralBankOnly, showTradeDealOnly, sortBy]);

  // Group news by date
  const groupedNews = useMemo(() => {
    const groups: { [key: string]: NewsItem[] } = {};
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    filteredNews.forEach((item) => {
      const itemDate = new Date(item.timestamp);
      let groupKey: string;

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

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredNews]);

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getImportanceStars = (importance: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <Star
            key={level}
            className={`w-3 h-3 ${
              level <= importance ? 'text-orange-400 fill-orange-400' : 'text-slate-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getImpactBadge = (importance: number, breaking?: boolean) => {
    if (breaking) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
          <Zap className="w-3 h-3 mr-1" />
          BREAKING
        </Badge>
      );
    }
    if (importance >= 4) {
      return (
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          HIGH
        </Badge>
      );
    }
    if (importance >= 3) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
          MEDIUM
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30">
        LOW
      </Badge>
    );
  };

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(instrument)
        ? prev.filter((i) => i !== instrument)
        : [...prev, instrument]
    );
  };

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#0a0d1a] via-[#0f1419] to-[#0a0d1a] text-slate-200">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0d1a]/95 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-orange-400" />
                <h1 className="text-xl font-display font-semibold text-white">Market News</h1>
              </div>
              {isLive && (
                <div className="flex items-center gap-1.5 text-xs ml-4">
                  <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                  <span className="text-green-400">LIVE</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filters Bar */}
        <Card className="mesh-gradient-card border-slate-700/50 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500/50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Time Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Calendar className="w-4 h-4 mr-2" />
                    {timeFilter === 'all' ? 'All Time' : timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0f1419] border-slate-700">
                  <DropdownMenuCheckboxItem
                    checked={timeFilter === 'all'}
                    onCheckedChange={() => setTimeFilter('all')}
                    className="text-slate-200"
                  >
                    All Time
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={timeFilter === 'today'}
                    onCheckedChange={() => setTimeFilter('today')}
                    className="text-slate-200"
                  >
                    Today
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={timeFilter === 'week'}
                    onCheckedChange={() => setTimeFilter('week')}
                    className="text-slate-200"
                  >
                    This Week
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={timeFilter === 'month'}
                    onCheckedChange={() => setTimeFilter('month')}
                    className="text-slate-200"
                  >
                    This Month
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Instruments Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Filter className="w-4 h-4 mr-2" />
                    Instruments
                    {selectedInstruments.length > 0 && (
                      <Badge className="ml-2 bg-orange-500/20 text-orange-400">
                        {selectedInstruments.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0f1419] border-slate-700">
                  <DropdownMenuLabel className="text-slate-400">Select Instruments</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  {INSTRUMENTS.map((instrument) => (
                    <DropdownMenuCheckboxItem
                      key={instrument}
                      checked={selectedInstruments.includes(instrument)}
                      onCheckedChange={() => toggleInstrument(instrument)}
                      className="text-slate-200"
                    >
                      {instrument}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Importance Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Star className="w-4 h-4 mr-2" />
                    Importance: {minImportance}+
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0f1419] border-slate-700">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <DropdownMenuCheckboxItem
                      key={level}
                      checked={minImportance === level}
                      onCheckedChange={() => setMinImportance(level)}
                      className="text-slate-200"
                    >
                      {level}+ Stars
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0f1419] border-slate-700">
                  <DropdownMenuCheckboxItem
                    checked={sortBy === 'date'}
                    onCheckedChange={() => setSortBy('date')}
                    className="text-slate-200"
                  >
                    Date
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === 'importance'}
                    onCheckedChange={() => setSortBy('importance')}
                    className="text-slate-200"
                  >
                    Importance
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === 'sentiment'}
                    onCheckedChange={() => setSortBy('sentiment')}
                    className="text-slate-200"
                  >
                    Sentiment
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Breaking Only Toggle */}
              <Button
                variant={showBreakingOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowBreakingOnly(!showBreakingOnly)}
                className={
                  showBreakingOnly
                    ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }
              >
                <Zap className="w-4 h-4 mr-2" />
                Breaking Only
              </Button>

              {/* Event Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Filter className="w-4 h-4 mr-2" />
                    {EVENT_TYPES.find(t => t.value === selectedEventType)?.label || 'Event Type'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0f1419] border-slate-700">
                  <DropdownMenuLabel className="text-slate-400">Event Type</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  {EVENT_TYPES.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type.value}
                      checked={selectedEventType === type.value}
                      onCheckedChange={() => setSelectedEventType(type.value)}
                      className="text-slate-200"
                    >
                      {type.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Central Bank Toggle */}
              <Button
                variant={showCentralBankOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCentralBankOnly(!showCentralBankOnly)}
                className={
                  showCentralBankOnly
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Central Bank
              </Button>

              {/* Trade Deal Toggle */}
              <Button
                variant={showTradeDealOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowTradeDealOnly(!showTradeDealOnly)}
                className={
                  showTradeDealOnly
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Trade Deal
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedInstruments.length > 0 || searchQuery || timeFilter !== 'all' || minImportance > 1 || showBreakingOnly || selectedEventType !== 'all' || showCentralBankOnly || showTradeDealOnly) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
              <span className="text-xs text-slate-500">Active filters:</span>
              {searchQuery && (
                <Badge
                  className="bg-slate-700/50 text-slate-300 cursor-pointer hover:bg-slate-700"
                  onClick={() => setSearchQuery('')}
                >
                  Search: "{searchQuery}" ✕
                </Badge>
              )}
              {timeFilter !== 'all' && (
                <Badge
                  className="bg-slate-700/50 text-slate-300 cursor-pointer hover:bg-slate-700"
                  onClick={() => setTimeFilter('all')}
                >
                  Time: {timeFilter} ✕
                </Badge>
              )}
              {selectedInstruments.map((inst) => (
                <Badge
                  key={inst}
                  className="bg-orange-500/20 text-orange-400 cursor-pointer hover:bg-orange-500/30"
                  onClick={() => toggleInstrument(inst)}
                >
                  {inst} ✕
                </Badge>
              ))}
              {minImportance > 1 && (
                <Badge
                  className="bg-slate-700/50 text-slate-300 cursor-pointer hover:bg-slate-700"
                  onClick={() => setMinImportance(1)}
                >
                  {minImportance}+ Stars ✕
                </Badge>
              )}
              {showBreakingOnly && (
                <Badge
                  className="bg-red-500/20 text-red-400 cursor-pointer hover:bg-red-500/30"
                  onClick={() => setShowBreakingOnly(false)}
                >
                  Breaking Only ✕
                </Badge>
              )}
              {selectedEventType !== 'all' && (
                <Badge
                  className="bg-slate-700/50 text-slate-300 cursor-pointer hover:bg-slate-700"
                  onClick={() => setSelectedEventType('all')}
                >
                  {EVENT_TYPES.find(t => t.value === selectedEventType)?.label} ✕
                </Badge>
              )}
              {showCentralBankOnly && (
                <Badge
                  className="bg-blue-500/20 text-blue-400 cursor-pointer hover:bg-blue-500/30"
                  onClick={() => setShowCentralBankOnly(false)}
                >
                  Central Bank ✕
                </Badge>
              )}
              {showTradeDealOnly && (
                <Badge
                  className="bg-purple-500/20 text-purple-400 cursor-pointer hover:bg-purple-500/30"
                  onClick={() => setShowTradeDealOnly(false)}
                >
                  Trade Deal ✕
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setTimeFilter('all');
                  setSelectedInstruments([]);
                  setMinImportance(1);
                  setShowBreakingOnly(false);
                  setSelectedEventType('all');
                  setShowCentralBankOnly(false);
                  setShowTradeDealOnly(false);
                }}
                className="text-xs text-slate-400 hover:text-white h-6 px-2"
              >
                Clear all
              </Button>
            </div>
          )}
        </Card>

        {/* News Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
              <p className="text-slate-400">Loading news...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="mesh-gradient-card border-slate-700/50 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={refresh} variant="outline" className="border-orange-500/50 text-orange-400">
              Try Again
            </Button>
          </Card>
        ) : filteredNews.length === 0 ? (
          <Card className="mesh-gradient-card border-slate-700/50 p-8 text-center">
            <Newspaper className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No news found</p>
            <p className="text-sm text-slate-500">Try adjusting your filters</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNews).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-display font-semibold text-white">{date}</h2>
                  <Badge className="bg-slate-700/50 text-slate-400">
                    {items.length} {items.length === 1 ? 'article' : 'articles'}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {items.map((item) => (
                    <NewsRow
                      key={item.id}
                      item={item}
                      expanded={expandedNewsId === item.id}
                      onToggleExpand={() => setExpandedNewsId(item.id)}
                      onOpenDetails={() => setSelectedNews(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {/* Load More / Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="py-8 flex flex-col items-center gap-4">
              {loadingMore && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more news...</span>
                </div>
              )}
              {hasMore && !loadingMore && (
                <Button
                  variant="outline"
                  onClick={loadMore}
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                >
                  Load More News
                </Button>
              )}
              {!hasMore && news.length > 0 && (
                <p className="text-sm text-slate-500">
                  You've reached the end • {total} total news items
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="mesh-gradient-card border-slate-700 text-white max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {selectedNews && getSentimentIcon(selectedNews.sentiment)}
              <DialogTitle className="text-xl pr-8 leading-tight">
                {selectedNews?.headline}
              </DialogTitle>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{selectedNews && new Date(selectedNews.timestamp).toLocaleString()}</span>
              </div>
              {selectedNews?.source && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>{selectedNews.source}</span>
                </>
              )}
              {selectedNews && getImpactBadge(selectedNews.importance, selectedNews.breaking)}
            </div>
          </DialogHeader>

          {selectedNews && (
            <ScrollArea className="mt-4 max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* 1) Why This Matters */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">Why This Matters</h4>
                  <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700/50 space-y-3">
                    {selectedNews.human_takeaway && (
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedNews.human_takeaway}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedNews.market_pressure && (
                        <Badge className={`text-xs px-2 py-0.5 ${
                          selectedNews.market_pressure === 'risk_on' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          selectedNews.market_pressure === 'risk_off' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          selectedNews.market_pressure === 'uncertain' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-slate-700/50 text-slate-400'
                        }`}>
                          {selectedNews.market_pressure.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                      {selectedNews.attention_window && (
                        <Badge className="bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5">
                          Attention: {selectedNews.attention_window}
                        </Badge>
                      )}
                      {selectedNews.confidence_label && (
                        <Badge className="bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5">
                          {selectedNews.confidence_label} confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2) What to Watch Next */}
                {selectedNews.expected_followups && selectedNews.expected_followups.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">What to Watch Next</h4>
                    <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {selectedNews.expected_followups.map((followup) => (
                          <li key={followup}>{followup}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 3) Market Context */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide">Market Context</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedNews.market_impact && (
                      <div className="p-3 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Direction</div>
                        <Badge className={`${
                          selectedNews.market_impact === 'bullish' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          selectedNews.market_impact === 'bearish' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          selectedNews.market_impact === 'mixed' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-slate-700/50 text-slate-400'
                        } text-sm`}>
                          {selectedNews.market_impact.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {selectedNews.volatility_expectation && (
                      <div className="p-3 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Volatility</div>
                        <Badge className={`${
                          selectedNews.volatility_expectation === 'high' || selectedNews.volatility_expectation === 'extreme' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          selectedNews.volatility_expectation === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-green-500/20 text-green-400 border-green-500/30'
                        } text-sm`}>
                          {selectedNews.volatility_expectation.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {selectedNews.impact_timeframe && (
                      <div className="p-3 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Timeframe</div>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm">
                          {selectedNews.impact_timeframe.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedNews.instruments && selectedNews.instruments.length > 0 && (
                      <div className="p-3 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-2">Currency Pairs</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedNews.instruments.map((inst) => (
                            <Badge key={inst} className="bg-slate-700/50 text-slate-300">
                              {inst}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedNews.sessions && selectedNews.sessions.length > 0 && (
                      <div className="p-3 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-2">Active Sessions</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedNews.sessions.map((session) => (
                            <Badge key={session} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              {session}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4) Full Analysis (collapsible, default collapsed) */}
                {selectedNews.summary && (
                  <details className="space-y-3">
                    <summary className="text-sm font-semibold text-slate-200 uppercase tracking-wide cursor-pointer">
                      Full Analysis
                    </summary>
                    <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedNews.summary}
                      </p>
                    </div>
                  </details>
                )}

                {/* 5) Original Source (collapsible, default collapsed) */}
                <details className="space-y-3">
                  <summary className="text-sm font-semibold text-slate-200 uppercase tracking-wide cursor-pointer">
                    Original Source
                  </summary>
                  <div className="space-y-3">
                    {(() => {
                      const originalEmailContent = (selectedNews as any)?.original_email_content as string | undefined;
                      const contentToShow = originalEmailContent || selectedNews.content;
                      return contentToShow ? (
                        <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {contentToShow}
                          </p>
                        </div>
                      ) : null;
                    })()}

                    {(() => {
                      const urls = ((selectedNews as any)?.forexfactory_urls as string[] | undefined) ||
                        (selectedNews.forexfactory_url ? [selectedNews.forexfactory_url] : []);

                      if (!urls.length) return null;

                      return (
                        <div className="flex flex-col items-center justify-center gap-2 pt-1">
                          {urls.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                              View on Forex Factory
                            </a>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </details>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
