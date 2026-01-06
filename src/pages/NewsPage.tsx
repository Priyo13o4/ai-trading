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
} from 'lucide-react';
import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { useSymbols } from '@/hooks/useSymbols';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  content?: string;
  timestamp: string;
  source?: string;
  importance: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  instruments?: string[];
  breaking?: boolean;
  market_impact?: string;
  volatility_expectation?: string;
  forexfactory_url?: string | null;
}

type SortOption = 'date' | 'importance' | 'sentiment';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function NewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
  
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

  // Helper to map API response to NewsItem
  const mapNewsItem = useCallback((item: any): NewsItem => ({
    id: item.id || `news-${Date.now()}-${Math.random()}`,
    headline: item.headline || item.title || 'No headline',
    summary: item.summary || item.text || item.ai_analysis_summary || '',
    content: item.content || item.text || '',
    timestamp: item.timestamp || item.created_at || new Date().toISOString(),
    source: item.forexfactory_category || item.source || 'Market News',
    importance: item.importance_score || item.importance || 3,
    sentiment: (item.sentiment_score > 0 ? 'bullish' : item.sentiment_score < 0 ? 'bearish' : 'neutral') as 'bullish' | 'bearish' | 'neutral',
    instruments: item.forex_instruments || item.instruments || [],
    breaking: item.forexfactory_category?.includes('Breaking News') || item.breaking_news || item.breaking || false,
    market_impact: item.market_impact_prediction || '',
    volatility_expectation: item.volatility_expectation || '',
    forexfactory_url: item.forexfactory_url || null,
  }), []);

  // Fetch news data with pagination
  const fetchNews = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOffset(0);
    }
    setError(null);
    
    try {
      const currentOffset = isLoadMore ? offset : 0;
      const response = await apiService.getCurrentNews(PAGE_SIZE, currentOffset);
      const data = (response.data as any);
      
      const newsArray = data?.news || data || [];
      const totalCount = data?.total || newsArray.length;
      
      if (Array.isArray(newsArray)) {
        const mappedNews = newsArray.map(mapNewsItem);
        
        if (isLoadMore) {
          setNews(prev => {
            // Deduplicate by headline
            const existing = new Set(prev.map(n => n.headline));
            const newItems = mappedNews.filter(n => !existing.has(n.headline));
            return [...prev, ...newItems];
          });
          setOffset(currentOffset + PAGE_SIZE);
        } else {
          setNews(mappedNews);
          setOffset(PAGE_SIZE);
        }
        
        setTotal(totalCount);
        setHasMore(currentOffset + PAGE_SIZE < totalCount);
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, mapNewsItem]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNews(true);
    }
  }, [loadingMore, hasMore, fetchNews]);

  useEffect(() => {
    fetchNews();
  }, []);

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

  // Subscribe to live updates
  useEffect(() => {
    setIsLive(true);

    const unsubscribe = sseService.subscribeToNews(
      (data) => {
        if (data.type === 'news_update' && data.news) {
          setNews((prev) => {
            const newItem = mapNewsItem(data.news);

            // Check for duplicates
            const exists = prev.some((item) => item.headline === newItem.headline);
            if (exists) return prev;

            return [newItem, ...prev];
          });
        }
      },
      (error) => {
        console.error('[NewsPage] SSE error:', error);
        setIsLive(false);
      }
    );

    return () => {
      unsubscribe();
      setIsLive(false);
    };
  }, [mapNewsItem]);

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
  }, [news, searchQuery, timeFilter, selectedInstruments, minImportance, showBreakingOnly, sortBy]);

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
              onClick={fetchNews}
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
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedInstruments.length > 0 || searchQuery || timeFilter !== 'all' || minImportance > 1 || showBreakingOnly) && (
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setTimeFilter('all');
                  setSelectedInstruments([]);
                  setMinImportance(1);
                  setShowBreakingOnly(false);
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
            <Button onClick={() => fetchNews()} variant="outline" className="border-orange-500/50 text-orange-400">
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

                <div className="grid gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="mesh-gradient-card border-slate-700/50 p-4 hover:border-orange-500/30 transition-all cursor-pointer group"
                      onClick={() => setSelectedNews(item)}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2">
                            {getSentimentIcon(item.sentiment)}
                            <h3 className="text-base font-medium text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                              {item.headline}
                            </h3>
                          </div>

                          {item.summary && (
                            <p className="text-sm text-slate-400 line-clamp-2 mb-3 ml-7">
                              {item.summary}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 ml-7">
                            {/* Time */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(item.timestamp).toLocaleString()}</span>
                            </div>

                            {/* Source */}
                            {item.source && (
                              <span className="text-xs text-slate-500">
                                via {item.source}
                              </span>
                            )}

                            {/* Instruments */}
                            {item.instruments && item.instruments.length > 0 && (
                              <div className="flex gap-1.5">
                                {item.instruments.slice(0, 3).map((inst) => (
                                  <Badge
                                    key={inst}
                                    className="bg-slate-700/50 text-slate-300 text-xs"
                                  >
                                    {inst}
                                  </Badge>
                                ))}
                                {item.instruments.length > 3 && (
                                  <Badge className="bg-slate-700/50 text-slate-400 text-xs">
                                    +{item.instruments.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Side: Importance & Impact */}
                        <div className="flex lg:flex-col items-center lg:items-end gap-3 lg:gap-2 ml-7 lg:ml-0">
                          {getImpactBadge(item.importance, item.breaking)}
                          {getImportanceStars(item.importance)}
                        </div>
                      </div>
                    </Card>
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
                {/* Full Analysis (content/text) */}
                {(selectedNews.content || selectedNews.summary) && (
                  <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">Full Analysis</h4>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedNews.content || selectedNews.summary}
                    </p>
                  </div>
                )}

                {/* Market Impact & Volatility */}
                {(selectedNews.market_impact || selectedNews.volatility_expectation) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedNews.market_impact && (
                      <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">Market Impact</h4>
                        <p className="text-sm text-slate-300">{selectedNews.market_impact}</p>
                      </div>
                    )}
                    {selectedNews.volatility_expectation && (
                      <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Volatility Expectation</h4>
                        <p className="text-sm text-slate-300">{selectedNews.volatility_expectation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Affected Instruments */}
                {selectedNews.instruments && selectedNews.instruments.length > 0 && (
                  <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Affected Instruments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNews.instruments.map((inst) => (
                        <Badge key={inst} className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          {inst}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Importance Rating */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <span className="text-sm text-slate-500">Importance Rating</span>
                  {getImportanceStars(selectedNews.importance)}
                </div>

                {/* ForexFactory Link - use actual URL from database */}
                {selectedNews.forexfactory_url && (
                  <div className="flex items-center justify-center pt-4 border-t border-slate-700/50">
                    <a
                      href={selectedNews.forexfactory_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Forex Factory
                    </a>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
