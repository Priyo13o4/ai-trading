import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Minus, Star, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

import type { NewsIntelligenceItem } from '@/features/news/types';

export interface NewsRowProps {
  item: NewsIntelligenceItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenDetails: () => void;
}

const getSentimentIcon = (sentiment?: string): ReactNode => {
  switch (sentiment) {
    case 'bullish':
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    case 'bearish':
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    default:
      return <Minus className="w-4 h-4 text-slate-400" />;
  }
};

const getImportanceStars = (importance: number): ReactNode => {
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

export function NewsRow({ item, expanded, onToggleExpand, onOpenDetails }: NewsRowProps) {
  const attentionScore = typeof item.attention_score === 'number' ? item.attention_score : undefined;
  const isHighAttention = attentionScore !== undefined && attentionScore >= 85;
  const isLowAttention = attentionScore !== undefined && attentionScore < 70;

  const isFresh = item.news_state === 'fresh';
  const isStaleOrResolved = item.news_state === 'stale' || item.news_state === 'resolved';

  return (
    <Card
      className={
        `mesh-gradient-card border-slate-700/50 hover:border-orange-500/30 transition-all cursor-pointer group overflow-hidden relative ${
          isHighAttention ? 'border-slate-500/60 ring-1 ring-slate-500/15' : ''
        } ${
          isStaleOrResolved ? 'opacity-70' : isLowAttention ? 'opacity-85' : ''
        }`
      }
      onClick={() => {
        if (expanded) {
          onOpenDetails();
          return;
        }
        onToggleExpand();
      }}
    >
      {isFresh && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-3 right-3 h-2 w-2 rounded-full bg-slate-200/70 ring-1 ring-slate-500/30"
        />
      )}
      {/* Horizontal Bloomberg-style Layout */}
      <div className="flex items-stretch">
        {/* Left: Time & Importance */}
        <div className="flex flex-col items-center justify-between bg-slate-800/50 p-3 min-w-[80px] border-r border-slate-700/50">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {getImportanceStars(item.importance)}
          </div>
          {item.breaking && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-1.5 py-0.5">
              <Zap className="w-3 h-3" />
            </Badge>
          )}
        </div>

        {/* Center: Content */}
        <div className="flex-1 p-3 min-w-0">
          {/* Top Row: Headline + Sentiment */}
          <div className="flex items-start gap-2 mb-2">
            {getSentimentIcon(item.sentiment)}
            <h3 className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors line-clamp-1 flex-1">
              {item.headline}
            </h3>
            {/* Impact Badges */}
            <div className="flex gap-1.5 flex-shrink-0">
              {item.market_impact && (
                <Badge
                  className={`text-xs px-2 py-0.5 ${
                    item.market_impact === 'bullish'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : item.market_impact === 'bearish'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : item.market_impact === 'mixed'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-slate-700/50 text-slate-400'
                  }`}
                >
                  {item.market_impact.toUpperCase()}
                </Badge>
              )}
              {item.volatility_expectation && (
                <Badge
                  className={`text-xs px-2 py-0.5 ${
                    item.volatility_expectation === 'high' || item.volatility_expectation === 'extreme'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : item.volatility_expectation === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}
                >
                  VOL: {item.volatility_expectation.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Bottom Row: Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs ml-6">
            {/* Timeframe */}
            {item.impact_timeframe && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-2 py-0.5">
                <Clock className="w-3 h-3 mr-1" />
                {item.impact_timeframe}
              </Badge>
            )}

            {/* Instruments */}
            {item.instruments && item.instruments.length > 0 && (
              <>
                {item.instruments.slice(0, 4).map((inst) => (
                  <Badge key={inst} className="bg-slate-700/50 text-slate-300 px-2 py-0.5">
                    {inst}
                  </Badge>
                ))}
                {item.instruments.length > 4 && (
                  <Badge className="bg-slate-700/50 text-slate-400 px-2 py-0.5">
                    +{item.instruments.length - 4}
                  </Badge>
                )}
              </>
            )}

            {/* Trading Sessions */}
            {item.sessions && item.sessions.length > 0 && (
              <div className="flex items-center gap-1 text-slate-500">
                <span>•</span>
                {item.sessions.slice(0, 2).map((session) => (
                  <span key={session}>{session}</span>
                ))}
                {item.sessions.length > 2 && <span>+{item.sessions.length - 2}</span>}
              </div>
            )}

            {/* Entities */}
            {item.entities && item.entities.length > 0 && (
              <div className="flex gap-1">
                {item.entities.slice(0, 3).map((entity) => (
                  <Badge
                    key={entity}
                    className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-2 py-0.5"
                  >
                    {entity}
                  </Badge>
                ))}
                {item.entities.length > 3 && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-2 py-0.5">
                    +{item.entities.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/50 px-3 pb-3">
          <div className="mt-3 p-3 mesh-gradient-secondary rounded-lg border border-slate-700/50">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap gap-2">
                {item.confidence_label && (
                  <Badge className="bg-slate-700/50 text-slate-300 px-2 py-0.5">
                    {item.confidence_label} confidence
                  </Badge>
                )}
                {item.attention_window && (
                  <Badge className="bg-slate-700/50 text-slate-300 px-2 py-0.5">
                    attention: {item.attention_window}
                  </Badge>
                )}
                {item.impact_timeframe && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-2 py-0.5">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.impact_timeframe}
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails();
                }}
              >
                View details
              </Button>
            </div>

            {item.human_takeaway && (
              <p className="text-sm text-slate-200 leading-relaxed mb-3">
                {item.human_takeaway}
              </p>
            )}

            {item.expected_followups && item.expected_followups.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Expected follow-ups</div>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
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
