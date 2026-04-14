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
  original_email_content?: string;
  ai_analysis_summary?: string;
  is_priced_in?: boolean;
  similar_news_context?: string;
  similar_news_ids?: number[];
  primary_instrument?: string;
}

export interface WeeklyPlaybookItem {
  playbook_id?: number;
  target_week_start?: string;
  date_range?: string;
  dominant_themes?: unknown;
  currency_bias?: unknown;
  high_risk_windows?: unknown;
  overall_strategy?: string;
  created_at?: string;
}

export interface EventAnalysisItem {
  analysis_id?: number;
  event_name?: string;
  event_time?: string;
  currency?: string;
  impact?: string;
  key_numbers?: unknown;
  market_pricing_sentiment?: string;
  primary_affected_pairs?: unknown;
  trading_scenarios?: unknown;
  market_dynamics?: unknown;
  created_at?: string;
}
