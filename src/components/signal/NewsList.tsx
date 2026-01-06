import { Card } from '@/components/ui/card';
import { ChevronRight, Newspaper, Radio, Loader2, ExternalLink } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import sseService from '@/services/sseService';
import apiService from '@/services/api';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  timestamp: string;
  source?: string;
  impact?: 'high' | 'medium' | 'low';
  importance?: number;
  instruments?: string[];
  forexfactory_url?: string | null;
  market_impact?: string;
  volatility_expectation?: string;
}

interface NewsListProps {
  symbol: string;
}

export function NewsList({ symbol }: NewsListProps) {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  // Map importance score to impact level
  const getImpactFromImportance = (importance?: number): 'high' | 'medium' | 'low' => {
    if (!importance) return 'low';
    if (importance >= 4) return 'high';
    if (importance >= 3) return 'medium';
    return 'low';
  };

  // Map API response to NewsItem
  const mapNewsItem = useCallback((item: any): NewsItem => ({
    id: item.id?.toString() || `news-${Date.now()}-${Math.random()}`,
    title: item.title || item.headline || 'No headline',
    summary: item.text || item.summary || '',
    content: item.text || item.content || item.summary || '',
    timestamp: item.timestamp || new Date().toISOString(),
    source: item.source || 'Market News',
    importance: item.importance_score || item.importance || 3,
    impact: getImpactFromImportance(item.importance_score || item.importance),
    instruments: item.forex_instruments || item.instruments || [],
    forexfactory_url: item.forexfactory_url || null,
    market_impact: item.market_impact_prediction || '',
    volatility_expectation: item.volatility_expectation || '',
  }), []);

  // Fetch news from API
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await apiService.getCurrentNews(10, 0);
        const data = (response.data as any);
        const newsArray = data?.news || data || [];
        
        if (Array.isArray(newsArray)) {
          // Filter news relevant to current symbol if possible
          let filteredNews = newsArray.map(mapNewsItem);
          
          // Optionally filter by symbol if instruments include it
          const symbolFiltered = filteredNews.filter(n => 
            n.instruments?.some(inst => 
              inst.toUpperCase().includes(symbol.replace('/', '')) ||
              symbol.toUpperCase().includes(inst)
            )
          );
          
          // Use symbol-filtered if we have results, otherwise show all
          setNews(symbolFiltered.length > 0 ? symbolFiltered.slice(0, 5) : filteredNews.slice(0, 5));
        }
      } catch (err) {
        console.error('[NewsList] Failed to fetch news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol, mapNewsItem]);

  // Subscribe to live news updates via SSE
  useEffect(() => {
    console.log('[NewsList] Subscribing to news SSE');
    setIsLive(true);

    const unsubscribe = sseService.subscribeToNews(
      (data) => {
        if (data.type === 'news_update' && data.news) {
          console.log('[NewsList] New news received:', data);
          
          const newItem = mapNewsItem(data.news);
          
          // Add new news to the top of the list
          setNews((prev) => {
            // Check if this news already exists
            const exists = prev.some(item => item.id === newItem.id || item.title === newItem.title);
            if (exists) return prev;
            
            // Add to top and limit to 5 items
            return [newItem, ...prev].slice(0, 5);
          });
        }
      },
      (error) => {
        console.error('[NewsList] SSE error:', error);
        setIsLive(false);
      }
    );

    return () => {
      console.log('[NewsList] Unsubscribing from news SSE');
      unsubscribe();
      setIsLive(false);
    };
  }, [mapNewsItem]);

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-[#D4AF37]';
      case 'low':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <>
      <Card className="mesh-gradient-card border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wide">
              Latest News
            </h3>
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 text-xs">
              <Radio className="w-3 h-3 text-green-400 animate-pulse" />
              <span className="text-green-400">LIVE</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
            </div>
          ) : news.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No recent news</p>
          ) : (
            news.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="w-full flex items-start gap-3 p-3 rounded-lg mesh-gradient-secondary hover:border-[#D4AF37]/30 transition-colors border border-slate-700/50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white mb-1 line-clamp-2">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    {item.impact && (
                      <>
                        <span>•</span>
                        <span className={getImpactColor(item.impact)}>
                          {item.impact.toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
              </button>
            ))
          )}
        </div>
      </Card>

      {/* News Details Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="mesh-gradient-card border-slate-700 text-white max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8">{selectedNews?.title}</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
              <span>{selectedNews && new Date(selectedNews.timestamp).toLocaleString()}</span>
              {selectedNews?.source && (
                <>
                  <span>•</span>
                  <span>{selectedNews.source}</span>
                </>
              )}
              {selectedNews?.impact && (
                <>
                  <span>•</span>
                  <span className={getImpactColor(selectedNews.impact)}>
                    {selectedNews.impact.toUpperCase()} Impact
                  </span>
                </>
              )}
            </div>
          </DialogHeader>
          {selectedNews && (
            <ScrollArea className="mt-4 max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Full Analysis */}
                {selectedNews.content && (
                  <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">Full Analysis</h4>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedNews.content}
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
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Volatility</h4>
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

                {/* ForexFactory Link */}
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
    </>
  );
}
