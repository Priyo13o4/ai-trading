import type {
  AttentionWindow,
  ConfidenceLabel,
  MarketPressure,
  NewsIntelligenceItem,
  NewsState,
  NewsSentiment,
} from './types';

const coerceNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[];
  return [];
};

export function mapApiNewsItem(raw: any): NewsIntelligenceItem {
  // IMPORTANT: This adapter is intentionally aligned with the current NewsPage mapping
  // to avoid UI/behavior changes during Phase 1.

  const sentimentScore = coerceNumber(raw?.sentiment_score, 0);
  const sentiment: NewsSentiment =
    sentimentScore > 0 ? 'bullish' : sentimentScore < 0 ? 'bearish' : 'neutral';

  return {
    id: raw?.id || `news-${Date.now()}-${Math.random()}`,
    headline: raw?.headline || raw?.title || 'No headline',
    summary: raw?.summary || raw?.text || raw?.ai_analysis_summary || '',
    content: raw?.content || raw?.text || '',
    timestamp: raw?.timestamp || raw?.created_at || new Date().toISOString(),
    source: raw?.forexfactory_category || raw?.source || 'Market News',

    importance: raw?.importance_score || raw?.importance || 3,
    sentiment,
    instruments: raw?.forex_instruments || raw?.instruments || [],
    breaking:
      raw?.forexfactory_category?.includes('Breaking News') ||
      raw?.breaking_news ||
      raw?.breaking ||
      false,
    market_impact: raw?.market_impact_prediction || '',
    volatility_expectation: raw?.volatility_expectation || '',

    // Keep behavior identical (do not infer from forexfactory_urls array in Phase 1)
    forexfactory_url: raw?.forexfactory_url || null,

    entities: raw?.entities_mentioned || [],
    sessions: raw?.trading_sessions || [],
    impact_timeframe: raw?.impact_timeframe || '',
    news_category: raw?.news_category || '',
    analysis_confidence: raw?.analysis_confidence || 0,
    central_bank_related: raw?.central_bank_related || false,
    trade_deal_related: raw?.trade_deal_related || false,

    // New user-centric fields (optional; no UI wiring in Phase 1)
    human_takeaway: typeof raw?.human_takeaway === 'string' ? raw.human_takeaway : undefined,
    attention_score: coerceNumber(raw?.attention_score, 0) || undefined,
    news_state: raw?.news_state as NewsState | undefined,
    market_pressure: raw?.market_pressure as MarketPressure | undefined,
    attention_window: raw?.attention_window as AttentionWindow | undefined,
    confidence_label: raw?.confidence_label as ConfidenceLabel | undefined,
    expected_followups: asStringArray(raw?.expected_followups),
  };
}
