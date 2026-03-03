export type StrategyDirection = 'long' | 'short' | 'unknown';

export type StrategyStatus =
  | 'active'
  | 'expired'
  | 'executed'
  | 'cancelled'
  | 'invalidated'
  | 'pending'
  | 'closed'
  | 'unknown';

export interface StrategyRecord {
  strategy_id: number;
  batch_id: number | null;
  strategy_name: string;
  symbol: string;
  direction: StrategyDirection;
  raw_direction: string | null;
  entry_signal: Record<string, unknown> | null;
  take_profit: number;
  stop_loss: number;
  risk_reward_ratio: number | null;
  confidence: string;
  expiry_minutes: number | null;
  timestamp: string;
  expiry_time: string;
  detailed_analysis: string | null;
  market_context: Record<string, unknown> | null;
  status: StrategyStatus;
  raw_status: string | null;
  executed_at: string | null;
  created_at: string;
  user_rating: number | null;
  rating_count: number;
  avg_rating: number | null;
  user_feedback: string | null;
  trade_mode: string | null;
  execution_allowed: boolean;
  risk_level: string | null;
  trade_recommended: boolean;
  summary: string | null;
  news_context: string | null;
}

export interface StrategyQueryParams {
  pair?: string;
  status?: StrategyStatus | 'all';
  include_historical?: boolean;
  limit?: number;
  offset?: number;
}

export interface StrategyAllQueryParams {
  symbol?: string;
  direction?: 'buy' | 'sell';
  status?: StrategyStatus | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface StrategyAllResponse {
  strategies: unknown[];
  total: number;
  limit: number;
  offset: number;
}

export interface StrategyFilters {
  search: string;
  symbol: string;
  status: StrategyStatus | 'all';
  direction: StrategyDirection | 'all';
}
