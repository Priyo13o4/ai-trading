/**
 * Server-Sent Events (SSE) Service
 * Handles real-time streaming of candles, news, and strategies
 */

type SSECallback = (data: unknown) => void;
type SSEErrorCallback = (error: Event) => void;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

interface SSESubscriber {
  id: number;
  onUpdate: SSECallback;
  onError?: SSEErrorCallback;
}

interface SSEConnection {
  key: string;
  url: string;
  pendingUrl: string | null;
  urlRetargetTimer: number | null;
  eventSource: EventSource | null;
  subscribers: Map<number, SSESubscriber>;
  reconnectTimer: number | null;
  isConnecting: boolean;
  reconnectAttempts: number;
  baseReconnectDelay: number;
  maxReconnectDelay: number;
  lastErrorLogAt: number;
  lastErrorNotifyAt: number;
}

class SSEService {
  private readonly errorLogCooldownMs = 10_000;
  private readonly signalMuxKeyPrefix = 'signals_mux';
  private connections: Map<string, SSEConnection> = new Map();
  private subscriberId = 0;
  private globallyPaused = false;
  private backgroundPauseTimer: number | null = null;
  private readonly backgroundPauseDelayMs = Math.max(
    0,
    Number.parseInt(String(import.meta.env.VITE_SSE_BACKGROUND_PAUSE_DELAY_MS ?? '30000'), 10) || 30_000
  );
  private readonly enablePauseResume = (import.meta.env.VITE_ENABLE_SSE_PAUSE_RESUME as string | undefined) !== 'false';
  private readonly sseObsEnabled = ['1', 'true', 'yes', 'on'].includes(
    String(import.meta.env.VITE_SSE_OBS ?? import.meta.env.VITE_AUTHDBG ?? '').toLowerCase()
  );
  private readonly sseObsSampleEvery = Math.max(
    1,
    Number.parseInt(String(import.meta.env.VITE_SSE_OBS_SAMPLE_EVERY ?? '100'), 10) || 100
  );
  private readonly baseUrl = `${this.resolveSSEBaseUrl()}/api/stream`;
  // Phase-3 observation mode counters for mux SSE rollout telemetry.
  private readonly muxObsCounters: {
    opens: number;
    closes: number;
    reconnectAttempts: number;
    messageByType: Record<string, number>;
    messageWindowCount: number;
  } = {
    opens: 0,
    closes: 0,
    reconnectAttempts: 0,
    messageByType: {},
    messageWindowCount: 0,
  };

  private logMuxObs(event: string, details: Record<string, unknown> = {}): void {
    if (!this.sseObsEnabled) return;
    console.debug('[SSE][OBS]', event, details);
  }

  private trackMuxMessageType(type: unknown): void {
    if (!this.sseObsEnabled) return;

    const eventType = typeof type === 'string' && type.trim().length > 0 ? type : 'unknown';
    this.muxObsCounters.messageByType[eventType] = (this.muxObsCounters.messageByType[eventType] ?? 0) + 1;
    this.muxObsCounters.messageWindowCount += 1;

    if (this.muxObsCounters.messageWindowCount < this.sseObsSampleEvery) return;

    this.logMuxObs('mux_message_sample', {
      sampleEvery: this.sseObsSampleEvery,
      countsByType: { ...this.muxObsCounters.messageByType },
      opens: this.muxObsCounters.opens,
      closes: this.muxObsCounters.closes,
      reconnectAttempts: this.muxObsCounters.reconnectAttempts,
    });

    this.muxObsCounters.messageByType = {};
    this.muxObsCounters.messageWindowCount = 0;
  }

  private buildSignalMuxConnectionKey(pair: string, symbol: string, timeframe: string): string {
    return `${this.signalMuxKeyPrefix}:${pair}:${symbol}:${timeframe}`;
  }

  private isSignalMuxKey(key: string): boolean {
    return key.startsWith(`${this.signalMuxKeyPrefix}:`);
  }

  /**
   * Resolve the SSE service base URL.
   * Preference order:
   * 1) VITE_API_SSE_URL (explicit)
   * 2) Derived from VITE_API_BASE_URL (backward compatible)
   * 3) Localhost-safe fallback for development
   */
  private resolveSSEBaseUrl(): string {
    const sseEnvUrl = (import.meta.env.VITE_API_SSE_URL as string | undefined)?.replace(/\/+$/, '');
    if (sseEnvUrl) {
      return sseEnvUrl;
    }

    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '');
    if (apiBaseUrl) {
      try {
        const parsed = new URL(apiBaseUrl);
        parsed.pathname = parsed.pathname.replace(/\/api\/?$/, '');
        if (!parsed.pathname) parsed.pathname = '/';

        const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
        if (isLocalhost && (parsed.port === '' || parsed.port === '8080')) {
          parsed.port = '8081';
        }

        const derived = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
        console.warn('[SSEService] VITE_API_SSE_URL is not set. Falling back to derived URL:', derived);
        return derived;
      } catch {
        console.warn('[SSEService] VITE_API_SSE_URL is not set. Falling back to VITE_API_BASE_URL as-is.');
        return apiBaseUrl;
      }
    }

    const localFallback = 'http://localhost:8081';
    console.warn('[SSEService] VITE_API_SSE_URL and VITE_API_BASE_URL are not set. Falling back to localhost SSE URL.');
    return localFallback;
  }


  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.resumeAllConnections();
    });

    if (this.enablePauseResume && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.scheduleBackgroundPause();
          return;
        }
        this.clearBackgroundPauseTimer();
        this.resumeAllConnections();
      });
    }
  }

  private clearBackgroundPauseTimer(): void {
    if (this.backgroundPauseTimer) {
      window.clearTimeout(this.backgroundPauseTimer);
      this.backgroundPauseTimer = null;
    }
  }

  private scheduleBackgroundPause(): void {
    this.clearBackgroundPauseTimer();

    // Keep streams alive briefly for quick tab switches to avoid reconnect churn.
    this.backgroundPauseTimer = window.setTimeout(() => {
      this.backgroundPauseTimer = null;
      if (typeof document !== 'undefined' && !document.hidden) {
        return;
      }
      this.pauseAllConnections();
    }, this.backgroundPauseDelayMs);
  }

  /**
   * Subscribe to real-time news updates
   */
  subscribeToNews(
    onUpdate: SSECallback,
    onError?: SSEErrorCallback
  ): () => void {
    const key = 'news';
    const url = `${this.baseUrl}/news`;

    return this.subscribe(key, url, onUpdate, onError);
  }

  /**
   * Subscribe to real-time strategy updates
   */
  subscribeToStrategies(
    onUpdate: SSECallback,
    onError?: SSEErrorCallback,
    pair?: string
  ): () => void {
    const key = pair ? `strategies_${pair.toUpperCase()}` : 'strategies_all';
    const url = pair
      ? `${this.baseUrl}/strategies?pair=${encodeURIComponent(pair)}`
      : `${this.baseUrl}/strategies`;

    return this.subscribe(key, url, onUpdate, onError);
  }

  /**
   * Subscribe to multiplexed signal stream.
   * Query includes pair, symbol, timeframe for backend fan-out filtering.
   */
  subscribeToSignalMux(
    params: { pair: string; symbol: string; timeframe: string },
    onUpdate: SSECallback,
    onError?: SSEErrorCallback
  ): () => void {
    const pair = String(params.pair || params.symbol || '').trim().toUpperCase();
    const symbol = String(params.symbol || params.pair || '').trim().toUpperCase();
    const timeframe = String(params.timeframe || 'ALL').trim().toUpperCase();
    const key = this.buildSignalMuxConnectionKey(pair, symbol, timeframe);

    const query = new URLSearchParams({
      pair,
      symbol,
      timeframe,
    });

    const url = `${this.baseUrl}/signals?${query.toString()}`;
    return this.subscribe(key, url, onUpdate, onError);
  }

  /**
   * Subscribe to candle updates from the multiplexed signal stream.
   */
  subscribeToSignalMuxCandleUpdates(
    symbol: string,
    timeframe: string,
    onUpdate: SSECallback,
    onError?: SSEErrorCallback
  ): () => void {
    const normalizedTimeframe = String(timeframe || 'ALL').trim().toUpperCase();
    return this.subscribeToSignalMux(
      {
        pair: symbol,
        symbol,
        timeframe: normalizedTimeframe,
      },
      (data) => {
        const payload = asRecord(data);
        if (!payload) return;
        if (payload.type !== 'candle_update') return;
        onUpdate(payload);
      },
      onError
    );
  }

  /**
   * Subscribe to strategy updates from the multiplexed signal stream.
   */
  subscribeToSignalMuxStrategies(
    pair: string,
    onUpdate: SSECallback,
    onError?: SSEErrorCallback
  ): () => void {
    const normalizedPair = String(pair || '').trim().toUpperCase();

    return this.subscribeToSignalMux(
      {
        pair: normalizedPair,
        symbol: normalizedPair,
        timeframe: 'ALL',
      },
      (data) => {
        const payload = asRecord(data);
        if (!payload) return;

        if (payload.type === 'strategies_snapshot') {
          const strategies = Array.isArray(payload.strategies) ? payload.strategies : [];
          onUpdate({ ...payload, strategies });
          return;
        }

        if (payload.type === 'strategy_update') {
          const strategy = asRecord(payload.strategy);
          if (!strategy) return;
          onUpdate(payload);
        }
      },
      onError
    );
  }

  /**
   * Subscribe to news updates from the multiplexed signal stream.
   */
  subscribeToSignalMuxNews(
    pair: string,
    onUpdate: SSECallback,
    onError?: SSEErrorCallback
  ): () => void {
    const normalizedPair = String(pair || '').trim().toUpperCase();

    return this.subscribeToSignalMux(
      {
        pair: normalizedPair,
        symbol: normalizedPair,
        timeframe: 'ALL',
      },
      (data) => {
        const payload = asRecord(data);
        if (!payload) return;
        if (payload.type !== 'news_snapshot' && payload.type !== 'news_update') return;
        onUpdate(payload);
      },
      onError
    );
  }

  /**
   * Subscribe a callback to a managed connection.
   */
  private subscribe(
    key: string,
    url: string,
    onMessage: SSECallback,
    onError?: SSEErrorCallback
  ): () => void {
    const subscriber: SSESubscriber = {
      id: ++this.subscriberId,
      onUpdate: onMessage,
      onError,
    };

    let connection = this.connections.get(key);
    if (!connection) {
      connection = {
        key,
        url,
        pendingUrl: null,
        urlRetargetTimer: null,
        eventSource: null,
        subscribers: new Map(),
        reconnectTimer: null,
        isConnecting: false,
        reconnectAttempts: 0,
        baseReconnectDelay: 1000,
        maxReconnectDelay: 30_000,
        lastErrorLogAt: 0,
        lastErrorNotifyAt: 0,
      };
      this.connections.set(key, connection);
    } else if (connection.url !== url) {
      if (this.isSignalMuxKey(key)) {
        this.scheduleMuxUrlRetarget(connection, url);
      } else {
        if (connection.reconnectTimer) {
          window.clearTimeout(connection.reconnectTimer);
          connection.reconnectTimer = null;
        }
        if (connection.eventSource) {
          connection.eventSource.close();
          connection.eventSource = null;
        }
        connection.url = url;
        connection.isConnecting = false;
        connection.reconnectAttempts = 0;
      }
    }

    connection.subscribers.set(subscriber.id, subscriber);
    this.ensureConnected(connection);

    // Return cleanup function
    return () => {
      const active = this.connections.get(key);
      if (!active) return;
      active.subscribers.delete(subscriber.id);
      if (active.subscribers.size === 0) {
        this.closeConnection(key);
      }
    };
  }

  private scheduleMuxUrlRetarget(connection: SSEConnection, nextUrl: string): void {
    connection.pendingUrl = nextUrl;

    // Debounce URL switches to avoid close/reopen churn during rapid symbol transitions.
    if (connection.urlRetargetTimer) {
      window.clearTimeout(connection.urlRetargetTimer);
      connection.urlRetargetTimer = null;
    }

    connection.urlRetargetTimer = window.setTimeout(() => {
      connection.urlRetargetTimer = null;
      const targetUrl = connection.pendingUrl;
      connection.pendingUrl = null;
      if (!targetUrl || targetUrl === connection.url) return;

      if (connection.reconnectTimer) {
        window.clearTimeout(connection.reconnectTimer);
        connection.reconnectTimer = null;
      }

      if (connection.eventSource) {
        connection.eventSource.close();
        connection.eventSource = null;
      }

      connection.url = targetUrl;
      connection.isConnecting = false;
      connection.reconnectAttempts = 0;
      this.ensureConnected(connection);
    }, 150);
  }

  private ensureConnected(connection: SSEConnection): void {
    if (this.globallyPaused) return;
    if (connection.isConnecting) return;
    if (connection.eventSource && connection.eventSource.readyState !== EventSource.CLOSED) return;
    this.connect(connection);
  }

  private connect(connection: SSEConnection): void {
    if (this.globallyPaused || connection.subscribers.size === 0) return;
    if (connection.isConnecting) return;

    connection.isConnecting = true;
    console.log(`[SSE] Connecting to ${connection.key}...`);

    const eventSource = new EventSource(connection.url, { withCredentials: true });
    connection.eventSource = eventSource;

    eventSource.onopen = () => {
      if (connection.eventSource !== eventSource) return;
      console.log(`[SSE] Connected to ${connection.key}`);
      if (this.isSignalMuxKey(connection.key)) {
        this.muxObsCounters.opens += 1;
        this.logMuxObs('mux_open', {
          key: connection.key,
          url: connection.url,
          opens: this.muxObsCounters.opens,
        });
      }
      connection.isConnecting = false;
      connection.reconnectAttempts = 0;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:connection-restored', { detail: { source: 'sse', key: connection.key } }));
      }
    };

    eventSource.onmessage = (event) => {
      if (connection.eventSource !== eventSource) return;
      try {
        const parsed = JSON.parse(event.data) as unknown;
        const data = asRecord(parsed);
        if (!data) return;
        if (data.type === 'connected' || data.type === 'heartbeat') return;
        if (this.isSignalMuxKey(connection.key)) {
          this.trackMuxMessageType(data.type);
        }

        connection.subscribers.forEach((subscriber) => {
          try {
            subscriber.onUpdate(data);
          } catch (callbackError) {
            console.error(`[SSE] Subscriber callback error for ${connection.key}:`, callbackError);
          }
        });
      } catch (parseError) {
        console.error(`[SSE] Error parsing message for ${connection.key}:`, parseError, 'Raw data:', event.data);
      }
    };

    eventSource.onerror = (error) => {
      // Guard against stale onerror callbacks firing after pauseAllConnections() has
      // already closed this eventSource and resumeAllConnections() created a new one.
      if (connection.eventSource !== eventSource) return;

      const now = Date.now();
      if (now - connection.lastErrorLogAt >= this.errorLogCooldownMs) {
        console.error(`[SSE] Error on ${connection.key}:`, error, `ReadyState: ${eventSource.readyState}`);
        connection.lastErrorLogAt = now;
      }
      connection.isConnecting = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:connection-lost', { detail: { source: 'sse', key: connection.key } }));
      }

      if (now - connection.lastErrorNotifyAt >= this.errorLogCooldownMs) {
        connection.lastErrorNotifyAt = now;
        connection.subscribers.forEach((subscriber) => {
          if (subscriber.onError) {
            try {
              subscriber.onError(error);
            } catch (callbackError) {
              console.error(`[SSE] Subscriber error callback failed for ${connection.key}:`, callbackError);
            }
          }
        });
      }

      if (this.globallyPaused || connection.subscribers.size === 0) return;

      if (eventSource.readyState === EventSource.OPEN || eventSource.readyState === EventSource.CONNECTING) {
        return;
      }

      this.scheduleReconnect(connection);
    };
  }

  private scheduleReconnect(connection: SSEConnection): void {
    if (this.globallyPaused || connection.subscribers.size === 0) return;
    if (connection.reconnectTimer) {
      window.clearTimeout(connection.reconnectTimer);
      connection.reconnectTimer = null;
    }

    if (connection.urlRetargetTimer) {
      window.clearTimeout(connection.urlRetargetTimer);
      connection.urlRetargetTimer = null;
    }

    connection.pendingUrl = null;

    connection.reconnectAttempts += 1;
    if (this.isSignalMuxKey(connection.key)) {
      this.muxObsCounters.reconnectAttempts += 1;
      this.logMuxObs('mux_reconnect_scheduled', {
        key: connection.key,
        attempt: connection.reconnectAttempts,
        totalReconnectAttempts: this.muxObsCounters.reconnectAttempts,
      });
    }
    const backoff = Math.min(
      connection.maxReconnectDelay,
      connection.baseReconnectDelay * Math.pow(2, Math.max(0, connection.reconnectAttempts - 1))
    );
    const jitter = Math.floor(Math.random() * Math.max(100, backoff * 0.3));
    const delay = backoff + jitter;

    console.log(
      `[SSE] Reconnecting ${connection.key} in ${delay}ms (attempt ${connection.reconnectAttempts})`
    );

    connection.reconnectTimer = window.setTimeout(() => {
      connection.reconnectTimer = null;
      this.connect(connection);
    }, delay);
  }

  /**
   * Close a specific connection
   */
  closeConnection(key: string): void {
    const connection = this.connections.get(key);

    if (!connection) {
      console.log(`[SSE] No active connection to close: ${key}`);
      return;
    }

    if (connection.reconnectTimer) {
      window.clearTimeout(connection.reconnectTimer);
      connection.reconnectTimer = null;
    }

    if (connection.urlRetargetTimer) {
      window.clearTimeout(connection.urlRetargetTimer);
      connection.urlRetargetTimer = null;
    }

    connection.pendingUrl = null;

    if (connection.eventSource) {
      console.log(`[SSE] Closing connection: ${key} (ReadyState: ${connection.eventSource.readyState})`);
      connection.eventSource.close();
      if (this.isSignalMuxKey(key)) {
        this.muxObsCounters.closes += 1;
        this.logMuxObs('mux_close', {
          key,
          closes: this.muxObsCounters.closes,
        });
      }
      connection.eventSource = null;
    }

    connection.subscribers.clear();
    connection.isConnecting = false;
    this.connections.delete(key);
  }

  pauseAllConnections(): void {
    this.clearBackgroundPauseTimer();
    this.globallyPaused = true;
    this.connections.forEach((connection) => {
      if (connection.reconnectTimer) {
        window.clearTimeout(connection.reconnectTimer);
        connection.reconnectTimer = null;
      }
      if (connection.urlRetargetTimer) {
        window.clearTimeout(connection.urlRetargetTimer);
        connection.urlRetargetTimer = null;
      }
      connection.pendingUrl = null;
      if (connection.eventSource) {
        connection.eventSource.close();
        if (this.isSignalMuxKey(connection.key)) {
          this.muxObsCounters.closes += 1;
          this.logMuxObs('mux_close', {
            key: connection.key,
            closes: this.muxObsCounters.closes,
            reason: 'pause_all',
          });
        }
        connection.eventSource = null;
      }
      connection.isConnecting = false;
    });
  }

  resumeAllConnections(): void {
    this.clearBackgroundPauseTimer();
    this.globallyPaused = false;
    this.connections.forEach((connection) => {
      this.ensureConnected(connection);
    });
  }

  closeProtectedMarketDataConnections(): void {
    const keysToClose: string[] = [];

    this.connections.forEach((_, key) => {
      const isSignalMux = this.isSignalMuxKey(key);
      const isStrategyStream = key === 'strategies_all' || key.startsWith('strategies_');
      if (isSignalMux || isStrategyStream) {
        keysToClose.push(key);
      }
    });

    keysToClose.forEach((key) => this.closeConnection(key));
  }

}

// Singleton instance
export const sseService = new SSEService();
export default sseService;
