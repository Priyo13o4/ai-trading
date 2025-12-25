import { Card } from '@/components/ui/card';
import { ChevronRight, Newspaper, Radio } from 'lucide-react';
import { useState, useEffect } from 'react';
import sseService from '@/services/sseService';
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
}

interface NewsListProps {
  news: NewsItem[];
  symbol: string;
}

export function NewsList({ news: initialNews, symbol }: NewsListProps) {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [liveUpdates, setLiveUpdates] = useState(0);
  const [isLive, setIsLive] = useState(false);

  // Update news when props change
  useEffect(() => {
    setNews(initialNews);
  }, [initialNews]);

  // Subscribe to live news updates via SSE
  useEffect(() => {
    console.log('[NewsList] Subscribing to news SSE');
    setIsLive(true);

    const unsubscribe = sseService.subscribeToNews(
      (data) => {
        if (data.type === 'news_update') {
          console.log('[NewsList] New news received:', data);
          
          // Add new news to the top of the list
          setNews((prev) => {
            const newItem = data.news;
            // Check if this news already exists
            const exists = prev.some(item => item.id === newItem.id);
            if (exists) return prev;
            
            // Add to top and limit to 20 items
            return [newItem, ...prev].slice(0, 20);
          });

          setLiveUpdates((prev) => prev + 1);
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
  }, []);

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-orange-400';
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
            <Newspaper className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">
              Latest {symbol} News
            </h3>
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 text-xs">
              <Radio className="w-3 h-3 text-green-400 animate-pulse" />
              <span className="text-green-400">LIVE</span>
            </div>
          )}
        </div>
        <div className="space-y-2">{news.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No recent news</p>
          ) : (
            news.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="w-full flex items-start gap-3 p-3 rounded-lg mesh-gradient-secondary hover:border-orange-500/30 transition-colors border border-slate-700/50 text-left"
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
                {selectedNews.summary && (
                  <div className="p-4 mesh-gradient-secondary rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {selectedNews.summary}
                    </p>
                  </div>
                )}
                <div className="prose prose-invert prose-sm max-w-none">
                  <div
                    className="text-slate-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
