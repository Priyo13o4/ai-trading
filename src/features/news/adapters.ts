import type {
  AttentionWindow,
  ConfidenceLabel,
  EventAnalysisItem,
  MarketPressure,
  NewsIntelligenceItem,
  NewsState,
  NewsSentiment,
  WeeklyPlaybookItem,
} from './types';

const coerceNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const coerceString = (value: unknown, fallback: string = ''): string => {
  if (typeof value === 'string') return value;
  return fallback;
};

const coerceBoolean = (value: unknown, fallback: boolean = false): boolean => {
  if (typeof value === 'boolean') return value;
  return fallback;
};

const asStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[];
  return [];
};

const coerceObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const buildStableNewsFallbackId = (item: Record<string, unknown>): string => {
  const identityParts = [
    coerceString(item.timestamp),
    coerceString(item.created_at),
    coerceString(item.headline) || coerceString(item.title),
    coerceString(item.source) || coerceString(item.forexfactory_category),
    coerceString(item.forexfactory_url),
  ]
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  return `news:${identityParts.join('|') || 'unknown'}`;
};

export function mapApiNewsItem(raw: unknown): NewsIntelligenceItem {
  // IMPORTANT: This adapter is intentionally aligned with the current NewsPage mapping
  // to avoid UI/behavior changes during Phase 1.

  const item = coerceObject(raw) || {};

  const sentimentScore = coerceNumber(item.sentiment_score, 0);
  const sentiment: NewsSentiment =
    sentimentScore > 0 ? 'bullish' : sentimentScore < 0 ? 'bearish' : 'neutral';
  const forexFactoryCategory = coerceString(item.forexfactory_category);
  const stableId = coerceString(item.id) || buildStableNewsFallbackId(item);

  return {
    id: stableId,
    headline: coerceString(item.headline) || coerceString(item.title) || 'No headline',
    summary:
      coerceString(item.summary) ||
      coerceString(item.text) ||
      coerceString(item.ai_analysis_summary),
    content: coerceString(item.content) || coerceString(item.text),
    timestamp: coerceString(item.timestamp) || coerceString(item.created_at) || new Date().toISOString(),
    source: forexFactoryCategory || coerceString(item.source) || 'Market News',

    importance: coerceNumber(item.importance_score ?? item.importance, 3),
    sentiment,
    instruments: asStringArray(item.forex_instruments ?? item.instruments),
    breaking:
      forexFactoryCategory.includes('Breaking News') ||
      coerceBoolean(item.breaking_news) ||
      coerceBoolean(item.breaking),
    market_impact: coerceString(item.market_impact_prediction) || coerceString(item.market_impact),
    volatility_expectation: coerceString(item.volatility_expectation),

    // Keep behavior identical (do not infer from forexfactory_urls array in Phase 1)
    forexfactory_url: coerceString(item.forexfactory_url) || null,

    entities: asStringArray(item.entities_mentioned ?? item.entities),
    sessions: asStringArray(item.trading_sessions ?? item.sessions),
    impact_timeframe: coerceString(item.impact_timeframe),
    news_category: coerceString(item.news_category),
    analysis_confidence: coerceNumber(item.analysis_confidence, 0),
    central_bank_related: coerceBoolean(item.central_bank_related),
    trade_deal_related: coerceBoolean(item.trade_deal_related),

    // New user-centric fields (optional; no UI wiring in Phase 1)
    human_takeaway: typeof item.human_takeaway === 'string' ? item.human_takeaway : undefined,
    attention_score: coerceNumber(item.attention_score, 0) || undefined,
    news_state: item.news_state as NewsState | undefined,
    market_pressure: item.market_pressure as MarketPressure | undefined,
    attention_window: item.attention_window as AttentionWindow | undefined,
    confidence_label: item.confidence_label as ConfidenceLabel | undefined,
    expected_followups: asStringArray(item.expected_followups),
  };
}

export function mapApiPlaybookItem(raw: unknown): WeeklyPlaybookItem {
  const item = coerceObject(raw) || {};

  return {
    playbook_id: coerceNumber(item.playbook_id, 0) || undefined,
    target_week_start:
      typeof item.target_week_start === 'string' ? item.target_week_start : undefined,
    date_range: typeof item.date_range === 'string' ? item.date_range : undefined,
    dominant_themes: item.dominant_themes,
    currency_bias: item.currency_bias,
    high_risk_windows: item.high_risk_windows,
    overall_strategy:
      typeof item.overall_strategy === 'string' ? item.overall_strategy : undefined,
    created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
  };
}

export function mapApiEventAnalysisItem(raw: unknown): EventAnalysisItem {
  const item = coerceObject(raw) || {};

  return {
    analysis_id: coerceNumber(item.analysis_id, 0) || undefined,
    event_name: typeof item.event_name === 'string' ? item.event_name : undefined,
    event_time: typeof item.event_time === 'string' ? item.event_time : undefined,
    currency: typeof item.currency === 'string' ? item.currency : undefined,
    impact: typeof item.impact === 'string' ? item.impact : undefined,
    key_numbers: item.key_numbers,
    market_pricing_sentiment:
      typeof item.market_pricing_sentiment === 'string'
        ? item.market_pricing_sentiment
        : undefined,
    primary_affected_pairs: item.primary_affected_pairs,
    trading_scenarios: item.trading_scenarios,
    market_dynamics: item.market_dynamics,
    created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
  };
}

const normalizePlaybookArrayPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const objectPayload = coerceObject(payload);
  if (!objectPayload) return [];

  const candidates = [
    objectPayload.playbook,
    objectPayload.playbooks,
    objectPayload.weekly_playbook,
    objectPayload.weeklyPlaybook,
    objectPayload.result,
    objectPayload.data,
    objectPayload.items,
    objectPayload.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (coerceObject(candidate)) return [candidate];
  }

  if (
    typeof objectPayload.overall_strategy === 'string' ||
    typeof objectPayload.target_week_start === 'string' ||
    typeof objectPayload.date_range === 'string' ||
    typeof objectPayload.playbook_id !== 'undefined'
  ) {
    return [objectPayload];
  }

  return [];
};

const normalizeEventAnalysisArrayPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const objectPayload = coerceObject(payload);
  if (!objectPayload) return [];

  const candidates = [
    objectPayload.events,
    objectPayload.event_analyses,
    objectPayload.eventAnalyses,
    objectPayload.analysis,
    objectPayload.result,
    objectPayload.data,
    objectPayload.items,
    objectPayload.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (coerceObject(candidate)) return [candidate];
  }

  if (
    typeof objectPayload.event_name === 'string' ||
    typeof objectPayload.event_time === 'string' ||
    typeof objectPayload.currency === 'string' ||
    typeof objectPayload.analysis_id !== 'undefined'
  ) {
    return [objectPayload];
  }

  return [];
};

export function mapApiPlaybookPayload(payload: unknown): WeeklyPlaybookItem[] {
  return normalizePlaybookArrayPayload(payload).map(mapApiPlaybookItem);
}

export function mapApiEventAnalysisPayload(payload: unknown): EventAnalysisItem[] {
  return normalizeEventAnalysisArrayPayload(payload).map(mapApiEventAnalysisItem);
}
