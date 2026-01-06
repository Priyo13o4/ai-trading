/**
 * NewsEventPopup Component
 * 
 * Displays news event details in a popup when clicking on news markers.
 * Shows single event or aggregated list based on the number of events.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Clock,
  Building2,
} from 'lucide-react';
import type { NewsMarker } from './types';

interface NewsEventPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: NewsMarker[];
  position?: { x: number; y: number };
}

/**
 * Get importance badge color and label
 */
const getImportanceBadge = (importance: number) => {
  if (importance >= 5) return { color: 'bg-red-600 text-white', label: 'Critical' };
  if (importance >= 4) return { color: 'bg-red-500 text-white', label: 'High' };
  if (importance >= 3) return { color: 'bg-orange-500 text-white', label: 'Medium' };
  if (importance >= 2) return { color: 'bg-yellow-500 text-black', label: 'Low' };
  return { color: 'bg-slate-500 text-white', label: 'Minor' };
};

/**
 * Get sentiment icon and color
 */
const getSentimentDisplay = (impact?: string, sentiment?: number) => {
  if (impact === 'bullish' || (sentiment && sentiment > 0.2)) {
    return {
      Icon: TrendingUp,
      color: 'text-green-400',
      label: 'Bullish',
    };
  }
  if (impact === 'bearish' || (sentiment && sentiment < -0.2)) {
    return {
      Icon: TrendingDown,
      color: 'text-red-400',
      label: 'Bearish',
    };
  }
  return {
    Icon: Minus,
    color: 'text-slate-400',
    label: 'Neutral',
  };
};

/**
 * Format time for display
 */
const formatTime = (timeStr: string): string => {
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return timeStr;
  }
};

/**
 * Single news event card
 */
const NewsEventCard: React.FC<{ event: NewsMarker; isCompact?: boolean }> = ({
  event,
  isCompact = false,
}) => {
  const importanceBadge = getImportanceBadge(event.importance);
  const sentiment = getSentimentDisplay(event.impact, event.sentiment);
  const SentimentIcon = sentiment.Icon;

  return (
    <div className={`bg-slate-800/50 rounded-lg border border-slate-700/50 ${isCompact ? 'p-3' : 'p-4'}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${importanceBadge.color} text-xs`}>
            {importanceBadge.label}
          </Badge>
          {event.breaking && (
            <Badge className="bg-amber-500 text-black text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Breaking
            </Badge>
          )}
          {event.category && (
            <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
              {event.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {formatTime(event.time)}
        </div>
      </div>

      {/* Headline */}
      <h4 className={`text-white font-medium ${isCompact ? 'text-sm' : ''} mb-2`}>
        {event.full_headline || event.headline}
      </h4>

      {/* Details row */}
      <div className="flex items-center gap-4 text-sm">
        {/* Sentiment */}
        <div className={`flex items-center gap-1 ${sentiment.color}`}>
          <SentimentIcon className="w-4 h-4" />
          <span>{sentiment.label}</span>
        </div>

        {/* Volatility */}
        {event.volatility && (
          <div className="flex items-center gap-1 text-slate-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="capitalize">{event.volatility} Volatility</span>
          </div>
        )}

        {/* Instruments */}
        {event.instruments && event.instruments.length > 0 && (
          <div className="flex items-center gap-1 text-slate-400">
            <Building2 className="w-4 h-4" />
            <span>{event.instruments.slice(0, 3).join(', ')}</span>
            {event.instruments.length > 3 && (
              <span className="text-slate-500">+{event.instruments.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main popup component
 */
export const NewsEventPopup: React.FC<NewsEventPopupProps> = ({
  open,
  onOpenChange,
  events,
}) => {
  if (!events || events.length === 0) return null;

  const isSingleEvent = events.length === 1;
  const highestImportance = Math.max(...events.map(e => e.importance || 0));
  const headerBadge = getImportanceBadge(highestImportance);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1419] border-slate-700/50 max-w-lg max-h-[80vh] overflow-hidden">
        <DialogHeader className="border-b border-slate-700/30 pb-3">
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="flex flex-col">
              <span>
                {isSingleEvent ? 'News Event' : `${events.length} News Events`}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                {formatTime(events[0].time)}
              </span>
            </div>
            <Badge className={`${headerBadge.color} ml-auto`}>
              {headerBadge.label} Impact
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isSingleEvent ? (
          /* Single event view */
          <div className="py-2">
            <NewsEventCard event={events[0]} />
          </div>
        ) : (
          /* Multiple events list view */
          <ScrollArea className="h-[400px] pr-3">
            <div className="space-y-3 py-2">
              {events.map((event, index) => (
                <NewsEventCard key={event.id || index} event={event} isCompact />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer note */}
        <div className="text-xs text-slate-500 border-t border-slate-700/30 pt-3">
          News events are sorted by importance level. High impact news may cause
          significant price movements.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsEventPopup;
