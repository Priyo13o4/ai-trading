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
