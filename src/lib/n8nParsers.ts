import {
  N8nStrategyPayload,
  N8nStrategyEntry,
  UIStrategy,
  N8nRegimePayload,
  N8nCurrentNewsPayload,
  N8nUpcomingPayload,
} from "@/types/signal";

const confidenceStringToPercent = (txt?: string): number | undefined => {
  if (!txt) return undefined;
  const t = txt.toLowerCase();
  if (t.includes("high")) return 85;
  if (t.includes("medium")) return 65;
  if (t.includes("low")) return 40;
  return undefined;
};

const computeStatus = (timestamp?: string, expiryMinutes?: number): "Active" | "Expired" => {
  if (!timestamp || !expiryMinutes) return "Active";
  const start = new Date(timestamp).getTime();
  const expires = start + expiryMinutes * 60 * 1000;
  return Date.now() <= expires ? "Active" : "Expired";
};

export function mapStrategyEntryToUI(entry: N8nStrategyEntry): UIStrategy {
  const direction: UIStrategy["direction"] = entry.direction.toLowerCase() === "long" ? "BUY" : "SELL";
  const confidencePercent = confidenceStringToPercent(entry.confidence);
  return {
    strategyName: entry.strategy_name,
    direction,
    entry: entry.entry_signal?.level ?? 0,
    takeProfit: entry.take_profit,
    stopLoss: entry.stop_loss,
    timeframe: entry.entry_signal?.timeframe,
    confidenceText: entry.confidence,
    confidencePercent,
    riskReward: entry.risk_reward_ratio,
    status: computeStatus(entry.timestamp, entry.expiry_minutes),
    timestamp: entry.timestamp,
    expiryMinutes: entry.expiry_minutes,
    symbol: entry.symbol,
  };
}

export function parseStrategiesPayload(json: unknown): UIStrategy[] {
  try {
    const arr = json as N8nStrategyPayload;
    const flattened = arr
      ?.flatMap((item) => item?.output?.strategy_signals ?? [])
      .filter(Boolean) as N8nStrategyEntry[];
    return flattened.map(mapStrategyEntryToUI);
  } catch (e) {
    console.error("Failed to parse strategies payload", e);
    return [];
  }
}

export function parseRegimeText(json: unknown): string | null {
  try {
    const arr = json as N8nRegimePayload;
    return arr?.[0]?.text ?? null;
  } catch (e) {
    console.error("Failed to parse regime payload", e);
    return null;
  }
}

export interface ParsedNewsItem {
  id: string;
  text: string;
}

export function parseCurrentNews(json: unknown): ParsedNewsItem[] {
  try {
    const arr = json as N8nCurrentNewsPayload;
    return (arr || [])
      .map((item, idx) => ({
        id: `news-${idx}`,
        text: item.output?.ai_analysis_summary || "",
      }))
      .filter((n) => n.text);
  } catch (e) {
    console.error("Failed to parse current news payload", e);
    return [];
  }
}

export type ParsedUpcoming = { mode: "text"; text: string } | { mode: "html"; items: { id: string; html: string }[] } | null;

export function parseUpcoming(json: unknown): ParsedUpcoming {
  try {
    if (!json) return null;
    if (Array.isArray(json)) {
      // HTML list variant
      const items = json
        .map((it: any, idx: number) => ({ id: `up-${idx}`, html: String(it?.text ?? "") }))
        .filter((it) => it.html);
      return items.length ? { mode: "html", items } : null;
    }
    // Simple text variant
    const text = (json as any)?.text as string | undefined;
    return text ? { mode: "text", text } : null;
  } catch (e) {
    console.error("Failed to parse upcoming payload", e);
    return null;
  }
}
