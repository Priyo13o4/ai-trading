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
  onHistoricalLinkClick?: (id: number) => void;
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
          level <= importance ? 'fill-[#C8935A] text-[#C8935A]' : 'text-slate-700'
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
  onHistoricalLinkClick,
}: NewsRowProps) {
  const isFresh = item.news_state === 'fresh';
  const isStale = item.news_state === 'stale' || item.news_state === 'resolved';
  const attentionScore = typeof item.attention_score === 'number' ? item.attention_score : undefined;
  const isHighAttention = attentionScore !== undefined && attentionScore >= 85;

  return (
    <Card
      className={cn(
        'sa-news-card sa-liquid-card cursor-pointer overflow-hidden transition-all outline-none focus-within:outline-none focus-within:ring-0 group',
        isHighAttention && 'border-[#C8935A]/40 shadow-[#C8935A]/5',
        isStale && 'opacity-60'
      )}
      onClick={onToggleExpand}
    >
      {isFresh && (
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/10 shadow-[0_0_8px_rgba(52,211,153,0.5)] z-20"
        />
      )}



      <div className="flex items-stretch">
        <div className="flex min-w-[92px] flex-col items-center justify-between border-r border-[#C8935A]/10 p-3 bg-[#0d0f11]/40">
          <div className="text-center">
            <div className="mb-1 text-[11px] sa-muted font-mono tracking-tighter font-bold">
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            {getImportanceStars(item.importance)}
          </div>
          {item.breaking && (
            <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 text-[10px] animate-pulse">
              <Zap className="h-3 w-3 fill-rose-400" />
            </Badge>
          )}
        </div>

        <div className="min-w-0 flex-1 p-3">
          <div className="mb-2 flex items-start gap-2">
            {getSentimentIcon(item.sentiment)}
            <h3 className="flex-1 truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-[#C8935A]">
              {item.headline}
            </h3>
            <div className="flex gap-1.5 shrink-0">
              {item.market_impact && (
                <Badge className={cn(getImpactTone(item.market_impact), 'px-2 py-0.5 text-[10px] font-bold tracking-widest')}>
                  {item.market_impact.toUpperCase()}
                </Badge>
              )}
              {item.volatility_expectation && (
                <Badge
                  className={cn(getVolatilityTone(item.volatility_expectation), 'px-2 py-0.5 text-[10px] font-bold tracking-widest')}
                >
                  VOL {item.volatility_expectation.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          <div className="ml-6 flex flex-wrap items-center gap-2 text-xs">
            {item.impact_timeframe && (
              <Badge variant="outline" className="bg-[#111315] border-[#C8935A]/20 text-[#C8935A] px-2 py-0.5 font-medium">
                <Clock className="mr-1 h-3 w-3" />
                {item.impact_timeframe}
              </Badge>
            )}

            {showInstruments &&
              item.instruments?.slice(0, 4).map((instrument) => {
                const isPrimary = item.primary_instrument === instrument;
                return (
                  <Badge 
                    key={instrument} 
                    variant="outline" 
                    className={cn(
                      "px-2 py-0.5 font-mono transition-all",
                      isPrimary 
                        ? "bg-[#C8935A]/20 border-[#C8935A]/50 text-[#C8935A] shadow-[0_0_10px_rgba(200,147,90,0.15)] ring-1 ring-[#C8935A]/20" 
                        : "bg-[#0d0f11] border-slate-700/50 text-slate-400"
                    )}
                  >
                    {instrument}
                  </Badge>
                );
              })}

            {showInstruments && item.instruments && item.instruments.length > 4 && (
              <Badge variant="outline" className="bg-[#0d0f11] border-slate-700/50 text-slate-400 px-2 py-0.5">
                +{item.instruments.length - 4}
              </Badge>
            )}

            {item.entities?.slice(0, 3).map((entity) => (
              <Badge key={entity} variant="outline" className="bg-[#C8935A]/5 border-[#C8935A]/10 text-[#C8935A]/80 px-2 py-0.5">
                {entity}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#C8935A]/10 px-3 pb-3 bg-[#0d0f11]/10">
          <div className="mt-3 p-4 rounded-xl border border-[#C8935A]/10 bg-[#111315]/50 backdrop-blur-md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {item.confidence_label && (
                  <Badge className={cn(getConfidencePillClass(item.confidence_label), "font-bold tracking-wider")}>
                    {item.confidence_label} CONFIDENCE
                  </Badge>
                )}
                {item.attention_window && (
                  <Badge className={cn(getAttentionPillClass(), "font-bold tracking-wider")}>
                    ATTENTION {item.attention_window}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className={cn('sa-btn-neutral border-[#C8935A]/20 hover:border-[#C8935A]/40 transition-all font-bold uppercase tracking-wider text-[11px]', getSentimentButtonClass(item.sentiment))}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetails();
                }}
              >
                View full intelligence
              </Button>
            </div>

            {item.human_takeaway && (
              <div className="relative pl-4 border-l-2 border-[#C8935A]/30 mb-4">
                <p className="text-sm leading-relaxed text-slate-200 font-medium">{item.human_takeaway}</p>
              </div>
            )}

            {showInstruments && item.instruments && item.instruments.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">Top Impact Pairs</div>
                <div className="flex flex-wrap gap-2">
                  {item.instruments.map((instrument) => {
                    const isPrimary = item.primary_instrument === instrument;
                    return (
                      <Badge 
                        key={instrument} 
                        className={cn(
                          "px-2 py-0.5 font-mono",
                          isPrimary 
                            ? "bg-[#C8935A]/20 border border-[#C8935A]/50 text-[#C8935A]" 
                            : "bg-[#0d0f11] border border-slate-700/50 text-slate-400"
                        )}
                      >
                        {instrument}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {item.news_state && (
              <div className="mb-4">
                <div className="mb-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">News Lifecycle Timeline</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {['fresh', 'developing', 'stale', 'resolved'].map((state, idx) => {
                    const isActive = item.news_state === state;
                    return (
                      <div key={state} className="flex items-center gap-1.5">
                        <Badge variant="outline" className={cn(
                          "px-2 py-0.5 text-[10px] uppercase tracking-wider",
                          isActive
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
                            : "bg-[#0d0f11]/50 text-slate-600 border-slate-800/80"
                        )}>
                          {state}
                        </Badge>
                        {idx < 3 && <div className="w-4 h-[1px] bg-slate-800" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {item.similar_news_context && (
              <div className="mb-4 bg-[#0d0f11]/40 rounded-lg p-3 border border-amber-500/10 border-l-2 border-l-amber-500/30">
                <div className="mb-2 text-[10px] uppercase tracking-widest font-bold text-amber-500/70">Historical Precedent</div>
                <p className="text-xs text-slate-300 italic leading-relaxed">"{item.similar_news_context}"</p>
                {item.similar_news_ids && item.similar_news_ids.length > 0 && onHistoricalLinkClick && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onHistoricalLinkClick(item.similar_news_ids![0]);
                    }}
                    className="mt-2 text-xs font-semibold text-[#C8935A] hover:text-[#E2B485] transition-colors underline decoration-[#C8935A]/30 underline-offset-4 flex items-center gap-1"
                  >
                    View historical news analysis ↗
                  </button>
                )}
              </div>
            )}

            {item.expected_followups && item.expected_followups.length > 0 && (
              <div className="bg-[#0d0f11]/40 rounded-lg p-3 border border-slate-800/50">
                <div className="mb-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">Expected developments</div>
                <ul className="space-y-2">
                  {item.expected_followups.map((followup, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#C8935A]/40" />
                      <span>{followup}</span>
                    </li>
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
