/**
 * NewsEventPopup Component
 * 
 * Displays news event details in a popup when clicking on news markers.
 * Shows single event or aggregated list based on the number of events.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NewsIntelligenceDialog } from '@/features/news/components/NewsIntelligenceDialog';
import type { NewsSentiment } from '@/features/news/types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Clock,
  Activity,
  Box,
} from 'lucide-react';
import type { NewsMarker } from './types';

interface NewsEventPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: NewsMarker[];
  position?: { x: number; y: number };
}

const getImportanceBadge = (importance: number) => {
  if (importance >= 5) return { color: 'bg-destructive text-destructive-foreground hover:bg-destructive/90', label: 'Critical' };
  if (importance >= 4) return { color: 'bg-red-500/90 text-white hover:bg-red-500/80', label: 'High' };
  if (importance >= 3) return { color: 'bg-orange-500/90 text-white hover:bg-orange-500/80', label: 'Medium' };
  if (importance >= 2) return { color: 'bg-yellow-500/90 text-black hover:bg-yellow-500/80', label: 'Low' };
  return { color: 'bg-muted text-muted-foreground outline outline-1 outline-border', label: 'Minor' };
};

const getSentimentDisplay = (impact?: string, sentiment?: number) => {
  if (impact === 'bullish' || (sentiment && sentiment > 0.2)) {
    return {
      Icon: TrendingUp,
      color: 'text-emerald-500',
      label: 'Bullish',
    };
  }
  if (impact === 'bearish' || (sentiment && sentiment < -0.2)) {
    return {
      Icon: TrendingDown,
      color: 'text-destructive',
      label: 'Bearish',
    };
  }
  return {
    Icon: Minus,
    color: 'text-muted-foreground',
    label: 'Neutral',
  };
};

const formatUtcTime = (timeStr: string): string => {
  try {
    const date = new Date(timeStr);
    if (!Number.isFinite(date.getTime())) {
      return timeStr;
    }

    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = date.toLocaleString('en-US', { day: '2-digit', timeZone: 'UTC' });
    const year = date.toLocaleString('en-US', { year: 'numeric', timeZone: 'UTC' });
    const hour = date.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'UTC' });
    const minute = date.toLocaleString('en-US', { minute: '2-digit', timeZone: 'UTC' });
    return `${month} ${day}, ${year} ${hour}:${minute} UTC`;
  } catch {
    return timeStr;
  }
};

const normalizeSentiment = (event: NewsMarker): NewsSentiment => {
  if (event.impact === 'bullish' || (event.sentiment || 0) > 0.2) return 'bullish';
  if (event.impact === 'bearish' || (event.sentiment || 0) < -0.2) return 'bearish';
  return 'neutral';
};

const toDialogNews = (event: NewsMarker) => ({
  id: event.id || `${event.time}-${event.headline}`,
  headline: event.full_headline || event.headline,
  summary: event.summary || event.ai_analysis_summary || event.full_headline || event.headline,
  content: event.summary || event.ai_analysis_summary || event.headline,
  timestamp: event.time,
  source: 'Market Intelligence',
  importance: event.importance,
  sentiment: normalizeSentiment(event),
  instruments: event.instruments || [],
  breaking: event.breaking,
  market_impact: event.impact,
  volatility_expectation: event.volatility,
  forexfactory_url: event.forexfactory_url || null,
  news_category: event.category,
  ai_analysis_summary: event.ai_analysis_summary,
  human_takeaway: event.summary || event.ai_analysis_summary,
  primary_instrument: event.instruments?.[0],
});

const NewsEventCard: React.FC<{ event: NewsMarker; onOpenDetails: (event: NewsMarker) => void }> = ({
  event,
  onOpenDetails,
}) => {
  const importanceBadge = getImportanceBadge(event.importance);
  const sentiment = getSentimentDisplay(event.impact, event.sentiment);
  const SentimentIcon = sentiment.Icon;
  const summaryText = event.ai_analysis_summary || event.summary;

  return (
    <div className="bg-white/[0.03] text-white rounded-2xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={importanceBadge.color}>
            {importanceBadge.label}
          </Badge>
          {event.breaking && (
            <Badge variant="secondary" className="flex items-center gap-1 font-medium bg-white/10 text-white border border-white/10">
              <Zap className="w-3 h-3 text-yellow-500" />
              Breaking
            </Badge>
          )}
          {event.category && (
            <Badge variant="outline" className="text-xs uppercase tracking-wider text-slate-300 border-white/15 bg-white/[0.02]">
              {event.category.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-300 whitespace-nowrap shrink-0">
          <Clock className="w-3 h-3" />
          {formatUtcTime(event.time)}
        </div>
      </div>

      {/* Body */}
      <div>
        <h4 className="font-semibold text-sm sm:text-base leading-tight text-white">
          {event.full_headline || event.headline}
        </h4>
        {summaryText && (
          <p className="text-sm text-slate-300 mt-2 line-clamp-2">
            {summaryText}
          </p>
        )}
      </div>

      {/* Footer Details */}
      <div className="flex items-center gap-4 text-xs sm:text-sm font-medium mt-1 pt-3 border-t border-white/10">
        {/* Sentiment */}
        <div className={`flex items-center gap-1.5 ${sentiment.color}`}>
          <SentimentIcon className="w-4 h-4" />
          <span>{sentiment.label}</span>
        </div>

        {/* Volatility */}
        {event.volatility && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-4 h-4" />
            <span className="capitalize">{event.volatility}</span>
          </div>
        )}

        {/* Instruments */}
        {event.instruments && event.instruments.length > 0 && (
          <div className="flex items-center gap-1.5 text-slate-300 ml-auto max-w-[50%] overflow-hidden">
            <Box className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {event.instruments.slice(0, 3).join(', ')}
              {event.instruments.length > 3 && ` +${event.instruments.length - 3}`}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => onOpenDetails(event)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E2B485] hover:text-[#C8935A] transition-colors"
        >
          Read Full Analysis -&gt;
        </button>
      </div>
    </div>
  );
};

export const NewsEventPopup: React.FC<NewsEventPopupProps> = ({
  open,
  onOpenChange,
  events,
}) => {
  if (!events || events.length === 0) return null;
  const [selectedDetailNews, setSelectedDetailNews] = useState<ReturnType<typeof toDialogNews> | null>(null);

  // Sort events by importance (High to Low)
  const sortedEvents = [...events].sort((a, b) => (b.importance || 0) - (a.importance || 0));
  const hasHighImpact = sortedEvents.some((event) => (event.importance || 0) >= 4 || Boolean(event.breaking));

  const handleOpenDetails = (event: NewsMarker) => {
    setSelectedDetailNews(toDialogNews(event));
    onOpenChange(false);
  };

  const shouldUseScrollArea = sortedEvents.length >= 5;
  const eventsList = (
    <div className="p-4 space-y-4">
      {sortedEvents.map((event, index) => (
        <NewsEventCard key={event.id || index} event={event} onOpenDetails={handleOpenDetails} />
      ))}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sa-news-dialog sm:max-w-2xl p-0 gap-0 overflow-hidden bg-[#0f1419] border border-white/10 text-white shadow-2xl shadow-black/60 z-[1100] [&>button]:top-4 [&>button]:right-4 [&>button]:h-8 [&>button]:w-8 [&>button]:rounded-full">
          <DialogHeader className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <DialogTitle className="flex flex-col items-start gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                {sortedEvents.length === 1 ? 'Market Event' : `${sortedEvents.length} Market Events`}
              </span>
              {hasHighImpact && (
                <Badge className="bg-red-500/90 text-white hover:bg-red-500/80 px-2.5 py-0.5">
                  High Impact
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {shouldUseScrollArea ? (
            <ScrollArea className="max-h-[420px]">
              {eventsList}
            </ScrollArea>
          ) : eventsList}
        </DialogContent>
      </Dialog>

      <NewsIntelligenceDialog
        open={Boolean(selectedDetailNews)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedDetailNews(null);
          }
        }}
        news={selectedDetailNews}
      />
    </>
  );
};

export default NewsEventPopup;
