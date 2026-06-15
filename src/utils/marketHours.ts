/**
 * marketHours.ts
 *
 * Hybrid market status utility.
 *
 * Primary:  Schedule-based UTC calculation — never gives false negatives
 *           due to SSE being down or reconnecting.
 * Secondary: SSE freshness signal — used to detect "market open but data stale"
 *            and show a "Data Delayed" sub-state.
 *
 * Symbol classification:
 *   Crypto (BTC, ETH, SOL, etc.) → 24/7, always open
 *   Forex / Metals (XAUUSD, EURUSD, etc.) → Sun 22:00 – Fri 21:00 UTC
 *                                            (1-hour break Fri 21:00–22:00 UTC)
 */

// ---------------------------------------------------------------------------
// Symbol classification
// ---------------------------------------------------------------------------

/** Crypto base currencies that trade 24/7. Add new ones here as needed. */
const CRYPTO_BASES = new Set([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX',
  'MATIC', 'DOT', 'LINK', 'LTC', 'BCH', 'UNI', 'ATOM',
]);

type SymbolClass = 'crypto' | 'forex';

/** Infer whether a symbol trades 24/7 (crypto) or follows forex market hours. */
export const classifySymbol = (symbol: string): SymbolClass => {
  const upper = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  // Check 3-letter prefix against known crypto bases
  const prefix3 = upper.slice(0, 3);
  const prefix4 = upper.slice(0, 4);
  if (CRYPTO_BASES.has(prefix3) || CRYPTO_BASES.has(prefix4)) return 'crypto';
  return 'forex';
};

// ---------------------------------------------------------------------------
// Forex market hours (UTC)
// ---------------------------------------------------------------------------

/**
 * Forex / metals market schedule (UTC):
 *   Open:  Sunday  22:00
 *   Close: Friday  21:00
 *   Break: Friday  21:00 – 22:00 (market closed for 1 hour)
 *
 * Returns true when the forex/metals market is open per UTC clock.
 */
export const isForexMarketOpen = (now: Date = new Date()): boolean => {
  const day = now.getUTCDay();   // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const minuteOfDay = hour * 60 + minute;

  // Saturday: always closed
  if (day === 6) return false;

  // Friday: open 00:00–21:00, closed 21:00–24:00
  if (day === 5) return minuteOfDay < 21 * 60;

  // Sunday: closed 00:00–22:00, open 22:00–24:00
  if (day === 0) return minuteOfDay >= 22 * 60;

  // Monday–Thursday: always open
  return true;
};

// ---------------------------------------------------------------------------
// SSE freshness thresholds (ms)
// ---------------------------------------------------------------------------

/**
 * Maximum acceptable age for SSE candle data before we consider it stale.
 * Forex M1 forms a new bar every 60s, so ≤3 minutes is "live".
 * Crypto M1 is the same rhythm.
 * We use a generous 5-minute threshold to tolerate brief reconnects.
 */
const SSE_FRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type MarketState =
  | 'open'      // Market is open and data is fresh
  | 'delayed'   // Market is open but SSE data is stale (>5 min)
  | 'closed';   // Market is closed per schedule

export interface MarketStatus {
  state: MarketState;
  isOpen: boolean;       // true for both 'open' and 'delayed'
  label: string;
  badgeCls: string;
}

/**
 * Compute the market status for a given symbol.
 *
 * @param symbol       - Trading symbol (e.g. 'XAUUSD', 'BTCUSD')
 * @param lastUpdateAt - Timestamp (ms) of the last SSE candle update, or null
 * @param now          - Optional override for "current time" (useful in tests)
 */
export const getMarketStatus = (
  symbol: string,
  lastUpdateAt: number | null,
  now: Date = new Date()
): MarketStatus => {
  const kind = classifySymbol(symbol);

  // ── Determine schedule-based open/close ──────────────────────────────────
  const scheduleOpen = kind === 'crypto' || isForexMarketOpen(now);

  if (!scheduleOpen) {
    return {
      state: 'closed',
      isOpen: false,
      label: 'Market Closed',
      badgeCls: 'sa-badge-danger',
    };
  }

  // ── Market is open per schedule — check SSE freshness ───────────────────
  const sseFresh =
    lastUpdateAt !== null &&
    now.getTime() - lastUpdateAt <= SSE_FRESH_THRESHOLD_MS;

  if (sseFresh) {
    return {
      state: 'open',
      isOpen: true,
      label: 'Market Open',
      badgeCls: 'sa-badge-success',
    };
  }

  // Market is open per schedule, but we have no fresh SSE data.
  // Could be SSE reconnecting, or first load before the first tick.
  // Show "Market Open" with a subtle "Data Delayed" hint when lastUpdateAt
  // is set but stale (>5 min). When lastUpdateAt is null it's first load,
  // just show open (the chart will update once SSE delivers the first tick).
  const isDefinitelyStale =
    lastUpdateAt !== null &&
    now.getTime() - lastUpdateAt > SSE_FRESH_THRESHOLD_MS;

  return {
    state: isDefinitelyStale ? 'delayed' : 'open',
    isOpen: true,
    label: isDefinitelyStale ? 'Feed Down' : 'Market Open',
    badgeCls: isDefinitelyStale ? 'sa-badge-warning' : 'sa-badge-success',
  };
};
