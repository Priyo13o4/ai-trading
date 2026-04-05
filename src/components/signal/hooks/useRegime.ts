/**
 * useRegime — fetches AI-generated market regime for a symbol.
 *
 * Auth: uses apiService (cookie-session) so credentials are sent automatically.
 * Live updates: subscribes to the existing signal MUX SSE stream and picks up
 * any `regime_update` events that the backend broadcasts.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import apiService from '@/services/api';
import sseService from '@/services/sseService';
import { useAuth } from '@/hooks/useAuth';

export interface RegimeData {
  symbol: string;
  regime_type: string;
  regime_strength?: number | null;
  expected_duration?: string | null;
  risk_level?: string | null;
  strategy?: string | null;
  confidence?: number | null;
  text?: string | null;
  timestamp: string;
}

export interface UseRegimeResult {
  regime: RegimeData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRegime(symbol: string): UseRegimeResult {
  const { isAuthenticated, status } = useAuth();
  const [regime, setRegime] = useState<RegimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchRegime = useCallback(async (silent = false) => {
    if (!symbol || status === 'loading') return;
    if (!isAuthenticated) {
      setRegime(null);
      setLoading(false);
      return;
    }
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const res = await apiService.get(`/api/regime/${encodeURIComponent(symbol)}`);

      if (!res || typeof res !== 'object') {
        // No data — not an error, just no regime yet
        setRegime(null);
        return;
      }

      // Normalise field names — backend returns `text` for summary
      const raw = res as Record<string, unknown>;
      const mapped: RegimeData = {
        symbol:            String(raw.symbol ?? symbol),
        regime_type:       String(raw.regime_type ?? 'Unknown'),
        regime_strength:   raw.regime_strength != null ? Number(raw.regime_strength) : null,
        expected_duration: raw.expected_duration != null ? String(raw.expected_duration) : null,
        risk_level:        raw.risk_level != null ? String(raw.risk_level) : null,
        strategy:          raw.strategy != null ? String(raw.strategy) : null,
        confidence:        raw.confidence != null ? Number(raw.confidence) : null,
        text:              raw.text != null ? String(raw.text) : null,
        timestamp:         String(raw.timestamp ?? raw.created_at ?? new Date().toISOString()),
      };
      setRegime(mapped);
    } catch (err: unknown) {
      console.warn('[useRegime] Could not load regime:', err);
      // Don't surface errors to the UI — badge simply stays hidden
      setRegime(null);
      setError(err instanceof Error ? err.message : 'Failed to fetch regime');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [symbol, status, isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    void fetchRegime();
  }, [fetchRegime]);

  // Live SSE: reuse the signals-mux connection (which is already open for the chart)
  // and pick up `regime_update` events without opening a new connection.
  useEffect(() => {
    if (!isAuthenticated || status === 'loading') return;

    const unsubscribe = sseService.subscribeToSignalMux(
      { pair: symbol, symbol, timeframe: 'ALL' },
      (data) => {
        if (!data || typeof data !== 'object') return;
        const payload = data as Record<string, unknown>;
        if (payload.type !== 'regime_update') return;

        const raw = (payload.regime ?? payload) as Record<string, unknown>;
        if (!raw || typeof raw !== 'object') return;

        setRegime((prev) => ({
          symbol:            String(raw.symbol ?? symbol),
          regime_type:       String(raw.regime_type ?? prev?.regime_type ?? 'Unknown'),
          regime_strength:   raw.regime_strength != null ? Number(raw.regime_strength) : prev?.regime_strength ?? null,
          expected_duration: raw.expected_duration != null ? String(raw.expected_duration) : prev?.expected_duration ?? null,
          risk_level:        raw.risk_level != null ? String(raw.risk_level) : prev?.risk_level ?? null,
          strategy:          raw.strategy != null ? String(raw.strategy) : prev?.strategy ?? null,
          confidence:        raw.confidence != null ? Number(raw.confidence) : prev?.confidence ?? null,
          text:              raw.text != null ? String(raw.text) : prev?.text ?? null,
          timestamp:         String(raw.timestamp ?? raw.analysis_timestamp ?? new Date().toISOString()),
        }));
      }
    );

    return unsubscribe;
  }, [symbol, isAuthenticated, status]);

  return {
    regime,
    loading,
    error,
    refresh: () => void fetchRegime(),
  };
}
