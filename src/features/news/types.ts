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
  pricing_state?: string;
  reaction_certainty?: string;
  directional_confidence?: number;
  repricing_type?: string;
  similar_news_context?: string;
  similar_news_ids?: number[];
  primary_instrument?: string;
  key_numbers?: Record<string, unknown>;
  market_session_open?: boolean;
}

export interface ScoreDriver {
  factor: string;
  impact: number;
}

export interface UsdContext {
  score: number;
  confidence: number;
  score_drivers: ScoreDriver[];
  bias: string;
  justification: string;
}

export interface CurrencyBiasEntry {
  currency: string;
  score: number;
  confidence: number;
  score_drivers: ScoreDriver[];
  bias: string;
  justification: string;
}

export interface PairBiasEntry {
  symbol: string;
  base_currency: string;
  quote_currency: string;
  base_score: number;
  quote_score: number;
  confidence: number;
  relative_strength_gap: number;
  driver_type: 'basket_consistent' | 'pair_specific_override';
  bias: string;
  justification: string;
}

export interface HighRiskWindow {
  date_time: string;
  event_name: string;
  event_state: 'unpriced' | 'partially_priced' | 'released';
  pricing_confidence: number;
  trap_or_opportunity: string;
}

export interface WeeklyPlaybookItem {
  playbook_id?: number;
  target_week_start?: string;
  date_range?: string;
  usd_context?: UsdContext;
  dominant_themes?: unknown;
  currency_bias?: CurrencyBiasEntry[];
  pair_bias?: PairBiasEntry[];
  high_risk_windows?: HighRiskWindow[];
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
