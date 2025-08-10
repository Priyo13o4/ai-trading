export type Direction = "BUY" | "SELL";

export interface UIStrategy {
  strategyName: string;
  direction: Direction;
  entry: number;
  takeProfit?: number;
  takeProfit2?: number; // optional if provided later
  stopLoss?: number;
  timeframe?: string;
  confidenceText?: string; // e.g., "Medium"
  confidencePercent?: number; // optional mapped percent
  riskReward?: number;
  status: "Active" | "Expired";
  timestamp?: string;
  expiryMinutes?: number;
  symbol: string;
}

export interface N8nStrategyEntry {
  strategy_name: string;
  direction: "long" | "short";
  entry_signal: {
    condition_type?: string;
    confirmation?: string;
    level: number;
    timeframe?: string;
  };
  take_profit?: number;
  stop_loss?: number;
  confidence?: string;
  symbol: string;
  expiry_minutes?: number;
  risk_reward_ratio?: number;
  timestamp?: string;
}

export interface N8nStrategyPayloadItem {
  output?: {
    strategy_signals?: N8nStrategyEntry[];
    detailed_analysis?: string;
    telegram_summary?: string;
  };
}

export type N8nStrategyPayload = N8nStrategyPayloadItem[];

export interface N8nRegimeTextItem {
  text: string;
}

export type N8nRegimePayload = N8nRegimeTextItem[];

export interface N8nCurrentNewsOutput {
  forex_relevant?: boolean;
  primary_instrument?: string;
  ai_analysis_summary?: string;
  [key: string]: any;
}

export interface N8nCurrentNewsItem {
  output?: N8nCurrentNewsOutput;
}

export type N8nCurrentNewsPayload = N8nCurrentNewsItem[];

export interface N8nUpcomingNewsHtmlItem {
  text: string;
  parse_mode?: string; // e.g., "HTML"
}

export type N8nUpcomingPayload = { text: string } | N8nUpcomingNewsHtmlItem[];
