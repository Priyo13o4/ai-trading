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

const parseInstruments = (value: unknown): string[] => {
  if (!value) return [];
  const parsed = parseJsonSafely(value);
  if (Array.isArray(parsed)) {
    return parsed.filter((v) => typeof v === 'string') as string[];
  }
  if (typeof parsed === 'object' && parsed !== null && 'data' in parsed) {
    const data = (parsed as Record<string, unknown>).data;
    if (Array.isArray(data)) {
      return data
        .map((d) => (typeof d === 'object' && d !== null && 'instrument' in d ? (d as any).instrument : d))
        .filter((v) => typeof v === 'string') as string[];
    }
  }
  return [];
};

const asNumberArray = (value: unknown): number[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number).filter(n => !isNaN(n));
  if (typeof value === 'string') {
     try {
       const parsed = JSON.parse(value);
       if (Array.isArray(parsed)) return parsed.map(Number).filter(n => !isNaN(n));
     } catch {
       return [];
     }
  }
  return [];
};

const coerceObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const parseJsonSafely = (value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
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
  // IMPORTANT: This adapter handles both standard news (email_news_analysis) 
  // and scheduled calendar events (economic_event_analysis).
  
  const item = coerceObject(raw) || {};

  // Resolve fields for Calendar events vs Regular news
  const eventName = coerceString(item.event_name);
  const eventTime = coerceString(item.event_time_utc || item.event_time);
  const eventImpact = coerceString(item.impact);
  const country = coerceString(item.country);
  
  const headline = eventName || coerceString(item.headline) || coerceString(item.title) || 'No headline';
  let timestamp = eventTime || coerceString(item.timestamp) || coerceString(item.created_at) || new Date().toISOString();
  if (timestamp) {
    let cleanStr = timestamp.trim().replace(/\sUTC$/, 'Z');
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(cleanStr)) {
      cleanStr = cleanStr.replace(' ', 'T');
    }
    timestamp = cleanStr;
  }

  const marketDynamics = coerceObject(item.market_dynamics);
  const tradingScenarios = coerceObject(item.trading_scenarios);

  let formattedAnalysis = coerceString(item.ai_analysis_summary) || coerceString(item.aiAnalysisSummary);
  if (!formattedAnalysis && (tradingScenarios || marketDynamics)) {
    const lines = [];
    if (marketDynamics?.main_risk) {
      lines.push(`MAIN RISK: ${marketDynamics.main_risk}\n`);
    }
    if (tradingScenarios) {
      lines.push('TRADING SCENARIOS:');
      if (tradingScenarios.actual_greater_than_forecast) lines.push(`- If > Forecast: ${tradingScenarios.actual_greater_than_forecast}`);
      if (tradingScenarios.actual_less_than_forecast) lines.push(`- If < Forecast: ${tradingScenarios.actual_less_than_forecast}`);
      if (tradingScenarios.actual_equals_forecast) lines.push(`- If = Forecast: ${tradingScenarios.actual_equals_forecast}`);
    }
    formattedAnalysis = lines.join('\n');
  }
  const summary = 
    coerceString(item.market_pricing_sentiment) || 
    coerceString(item.ai_analysis_summary) ||
    coerceString(item.aiAnalysisSummary) ||
    coerceString(item.summary) ||
    coerceString(item.text);

  const forexFactoryCategory = coerceString(item.forexfactory_category);
  const source = eventName 
    ? (country ? `${country} Economic Calendar` : 'Economic Calendar')
    : (forexFactoryCategory || coerceString(item.source) || 'Market News');

  const sentimentScore = coerceNumber(item.sentiment_score, 0);
  const sentiment: NewsSentiment =
    sentimentScore > 0 ? 'bullish' : sentimentScore < 0 ? 'bearish' : 'neutral';

  const instruments = parseInstruments(
    item.primary_affected_pairs ?? item.forex_instruments ?? item.instruments
  );

  const importance = eventImpact === 'High' ? 5 
    : eventImpact === 'Medium' ? 3 
    : eventImpact === 'Low' ? 1
    : coerceNumber(item.importance_score ?? item.importance, 3);

  const stableId = coerceString(item.analysis_id) || coerceString(item.id) || buildStableNewsFallbackId(item);

  return {
    id: stableId,
    headline,
    summary,
    content: coerceString(item.content) || coerceString(item.text),
    original_email_content: coerceString(item.original_email_content) || coerceString(item.originalEmailContent),
    ai_analysis_summary: formattedAnalysis,
    timestamp,
    source,

    importance,
    sentiment,
    instruments,
    breaking:
      forexFactoryCategory.includes('Breaking News') ||
      coerceBoolean(item.breaking_news) ||
      coerceBoolean(item.breaking),
    market_impact: coerceString(item.market_impact_prediction) || coerceString(item.market_impact) || eventImpact,
    volatility_expectation: coerceString(marketDynamics?.expected_volatility) || eventImpact || coerceString(item.volatility_expectation),
    forexfactory_url: coerceString(item.forexfactory_url) || null,
    
    // Additional analysis fields
    news_state: coerceString(item.news_state) as NewsState,
    market_pressure: coerceString(item.market_pressure) as MarketPressure,
    attention_window: coerceString(item.attention_window) as AttentionWindow,
    confidence_label: coerceString(item.confidence_label) as ConfidenceLabel,
    expected_followups: parseInstruments(item.expected_followups),
    is_priced_in: item.is_priced_in !== undefined ? coerceBoolean(item.is_priced_in) : undefined,
    similar_news_context: coerceString(item.similar_news_context),
    similar_news_ids: asNumberArray(item.similar_news_ids),

    // New API Fields
    attention_score: coerceNumber(item.attention_score, 0) || undefined,
    entities: parseInstruments(item.entities_mentioned ?? item.entities),
    sessions: parseInstruments(item.trading_sessions ?? item.sessions),
    impact_timeframe: coerceString(item.impact_timeframe),
    news_category: coerceString(item.news_category),
    analysis_confidence: coerceNumber(item.analysis_confidence, 0),
    central_bank_related: coerceBoolean(item.central_bank_related),
    trade_deal_related: coerceBoolean(item.trade_deal_related),
    human_takeaway: coerceString(item.human_takeaway) || coerceString(item.market_pricing_sentiment) || undefined,
    primary_instrument: coerceString(item.primary_instrument),
    key_numbers: coerceObject(item.key_numbers)
  };
}


export function mapApiPlaybookItem(raw: unknown): WeeklyPlaybookItem {
  const item = coerceObject(raw) || {};

  return {
    playbook_id: coerceNumber(item.playbook_id, 0) || undefined,
    target_week_start:
      typeof item.target_week_start === 'string' ? item.target_week_start : undefined,
    date_range: typeof item.date_range === 'string' ? item.date_range : undefined,
    dominant_themes: parseJsonSafely(item.dominant_themes),
    currency_bias: parseJsonSafely(item.currency_bias),
    pair_bias: parseJsonSafely(item.pair_bias),
    high_risk_windows: parseJsonSafely(item.high_risk_windows),
    overall_strategy:
      typeof item.overall_strategy === 'string' ? item.overall_strategy : undefined,
    created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
  };
}

export function mapApiEventAnalysisItem(raw: unknown): EventAnalysisItem {
  const item = coerceObject(raw) || {};

  const rawTime = item.event_time_utc || item.event_time;

  return {
    analysis_id: coerceNumber(item.analysis_id, 0) || undefined,
    event_name: typeof item.event_name === 'string' ? item.event_name : undefined,
    event_time: typeof rawTime === 'string' ? rawTime : undefined,
    currency: typeof item.currency === 'string' ? item.currency : undefined,
    impact: typeof item.impact === 'string' ? item.impact : undefined,
    key_numbers: parseJsonSafely(item.key_numbers),
    market_pricing_sentiment:
      typeof item.market_pricing_sentiment === 'string'
        ? item.market_pricing_sentiment
        : undefined,
    primary_affected_pairs: parseJsonSafely(item.primary_affected_pairs),
    trading_scenarios: parseJsonSafely(item.trading_scenarios),
    market_dynamics: parseJsonSafely(item.market_dynamics),
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
    typeof objectPayload.event_time_utc === 'string' ||
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
