import type { ReactNode } from 'react';
import {
  Clock,
  Minus,
  Star,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { NewsIntelligenceItem } from '@/features/news/types';
import {
  getBadgeTone,
  getImpactTone,
  getSentimentTone,
} from '@/features/news/theme';
import { cn } from '@/lib/utils';

export interface NewsRowProps {
  item: NewsIntelligenceItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenDetails: () => void;
  showInstruments?: boolean;
}

const getVolatilityTone = (volatility?: string): string => {
  const value = (volatility || '').toLowerCase();
  if (value === 'high' || value === 'extreme') return getBadgeTone('danger');
  if (value === 'medium') return getBadgeTone('warning');
  if (value === 'low') return getBadgeTone('success');
  return getBadgeTone('muted');
};

const getSentimentIcon = (sentiment?: string): ReactNode => {
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

const getSentimentButtonClass = (sentiment?: string): string => {
  switch ((sentiment || '').toLowerCase()) {
    case 'bullish':
      return 'sa-btn-sentiment sa-btn-sentiment-bullish';
    case 'bearish':
      return 'sa-btn-sentiment sa-btn-sentiment-bearish';
    default:
      return 'sa-btn-sentiment sa-btn-sentiment-neutral';
  }
};

const getImportanceStars = (importance: number): ReactNode => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((level) => (
      <Star
        key={level}
        className={cn(
          'h-3 w-3',
          level <= importance ? 'fill-amber-300 text-amber-300' : 'text-slate-600'
        )}
      />
    ))}
  </div>
);

const getAttentionPillClass = (): string => {
  return 'sa-pill-filled sa-pill-filled-warning';
};

const getTimeframePillClass = (): string => {
  return 'sa-pill-filled sa-pill-filled-info';
};

const getConfidencePillClass = (label?: string): string => {
  const value = (label || '').toLowerCase();
  if (value.includes('high')) return 'sa-pill-filled sa-pill-filled-success';
  if (value.includes('medium')) return 'sa-pill-filled sa-pill-filled-warning';
  if (value.includes('low')) return 'sa-pill-filled sa-pill-filled-danger';
  return 'sa-pill-filled sa-pill-filled-info';
};

export function NewsRow({
  item,
  expanded,
  onToggleExpand,
  onOpenDetails,
  showInstruments = true,
}: NewsRowProps) {
  const isFresh = item.news_state === 'fresh';
  const isStale = item.news_state === 'stale' || item.news_state === 'resolved';
  const attentionScore = typeof item.attention_score === 'number' ? item.attention_score : undefined;
  const isHighAttention = attentionScore !== undefined && attentionScore >= 85;

  return (
    <Card
      className={cn(
        'sa-news-card sa-liquid-card cursor-pointer overflow-hidden transition-colors outline-none focus-within:outline-none focus-within:ring-0',
        isHighAttention && 'border-amber-300/35',
        isStale && 'opacity-75'
      )}
      onClick={onToggleExpand}
    >
      {isFresh && (
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-300 ring-1 ring-emerald-200/30"
        />
      )}

      <div className="flex items-stretch">
        <div className="sa-news-card-muted flex min-w-[92px] flex-col items-center justify-between border-r border-amber-300/20 p-3">
          <div className="text-center">
            <div className="mb-1 text-xs sa-muted">
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            {getImportanceStars(item.importance)}
          </div>
          {item.breaking && (
            <Badge className="sa-badge-danger px-2 py-0.5 text-[10px]">
              <Zap className="h-3 w-3" />
            </Badge>
          )}
        </div>

        <div className="min-w-0 flex-1 p-3">
          <div className="mb-2 flex items-start gap-2">
            {getSentimentIcon(item.sentiment)}
            <h3 className="flex-1 truncate text-sm font-semibold text-white transition-colors hover:text-amber-300">
              {item.headline}
            </h3>
            <div className="flex gap-1.5">
              {item.market_impact && (
                <Badge className={cn(getImpactTone(item.market_impact), 'px-2 py-0.5 text-[10px]')}>
                  {item.market_impact.toUpperCase()}
                </Badge>
              )}
              {item.volatility_expectation && (
                <Badge
                  className={cn(getVolatilityTone(item.volatility_expectation), 'px-2 py-0.5 text-[10px]')}
                >
                  VOL {item.volatility_expectation.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          <div className="ml-6 flex flex-wrap items-center gap-2 text-xs">
            {item.impact_timeframe && (
              <Badge className={cn(getBadgeTone('info'), 'px-2 py-0.5')}>
                <Clock className="mr-1 h-3 w-3" />
                {item.impact_timeframe}
              </Badge>
            )}

            {showInstruments &&
              item.instruments?.slice(0, 4).map((instrument) => (
                <Badge key={instrument} className={cn(getBadgeTone('muted'), 'px-2 py-0.5')}>
                  {instrument}
                </Badge>
              ))}

            {showInstruments && item.instruments && item.instruments.length > 4 && (
              <Badge className={cn(getBadgeTone('muted'), 'px-2 py-0.5')}>
                +{item.instruments.length - 4}
              </Badge>
            )}

            {item.entities?.slice(0, 3).map((entity) => (
              <Badge key={entity} className={cn(getBadgeTone('accent'), 'px-2 py-0.5')}>
                {entity}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-amber-300/18 px-3 pb-3">
          <div className="sa-news-card-muted sa-liquid-card mt-3 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="rounded-lg border border-amber-300/30 bg-gradient-to-br from-slate-900/40 to-slate-900/60 p-3 backdrop-blur-sm">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
                  Overview
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.confidence_label && (
                    <Badge className={cn(getConfidencePillClass(item.confidence_label))}>
                      {item.confidence_label} CONFIDENCE
                    </Badge>
                  )}
                  {item.attention_window && (
                    <Badge className={cn(getAttentionPillClass())}>
                      ATTENTION {item.attention_window}
                    </Badge>
                  )}
                  {item.impact_timeframe && (
                    <Badge className={cn(getTimeframePillClass())}>
                      <Clock className="mr-1 h-3 w-3" />
                      {item.impact_timeframe}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={cn('sa-btn-neutral', getSentimentButtonClass(item.sentiment))}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetails();
                }}
              >
                View details
              </Button>
            </div>

            {item.human_takeaway && (
              <p className="mb-3 text-sm leading-relaxed text-slate-200">{item.human_takeaway}</p>
            )}

            {item.expected_followups && item.expected_followups.length > 0 && (
              <div>
                <div className="mb-2 text-xs sa-muted">Expected follow-ups</div>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                  {item.expected_followups.map((followup) => (
                    <li key={followup}>{followup}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
