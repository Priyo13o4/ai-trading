export type NewsSentiment = 'bullish' | 'bearish' | 'neutral';

export type NewsState = 'fresh' | 'developing' | 'stale' | 'resolved';
export type MarketPressure = 'risk_on' | 'risk_off' | 'uncertain' | 'neutral';
export type AttentionWindow = 'minutes' | 'hours' | 'days' | 'weeks';
export type ConfidenceLabel = 'low' | 'medium' | 'high';

/**
 * Frontend model for the News Intelligence feed.
 *
 * Goal: keep UI stable while the backend evolves.
 * - Includes legacy fields currently used in NewsPage.
 * - Adds new user-centric intelligence fields as optional-first to avoid breaking older payloads.
 */
export interface NewsIntelligenceItem {
  id: string;
  headline: string;
  summary: string;
  content?: string;
  timestamp: string;
  source?: string;

  // Legacy analysis fields (already used in UI)
  importance: number;
  sentiment?: NewsSentiment;
  instruments?: string[];
  breaking?: boolean;
  market_impact?: string;
  volatility_expectation?: string;
  forexfactory_url?: string | null;
  entities?: string[];
  sessions?: string[];
  impact_timeframe?: string;
  news_category?: string;
  analysis_confidence?: number;
  central_bank_related?: boolean;
  trade_deal_related?: boolean;

  // New user-centric intelligence fields (news-focused; not strategy)
  human_takeaway?: string;
  attention_score?: number;
  news_state?: NewsState;
  market_pressure?: MarketPressure;
  attention_window?: AttentionWindow;
  confidence_label?: ConfidenceLabel;
  expected_followups?: string[];
}
