/**
 * Server-Sent Events (SSE) Service
 * Handles real-time streaming of candles, news, and strategies
 */

type SSECallback = (data: any) => void;
type SSEErrorCallback = (error: Event) => void;

interface SSESubscriber {
  id: number;
  onUpdate: SSECallback;
  onError?: SSEErrorCallback;
}

interface SSEConnection {
  key: string;
  url: string;
  eventSource: EventSource | null;
  subscribers: Map<number, SSESubscriber>;
  reconnectTimer: number | null;
  isConnecting: boolean;
  reconnectAttempts: number;
  baseReconnectDelay: number;
  maxReconnectDelay: number;
}

class SSEService {
  private connections: Map<string, SSEConnection> = new Map();
  private subscriberId = 0;
  private globallyPaused = false;
  private readonly enablePauseResume = (import.meta.env.VITE_ENABLE_SSE_PAUSE_RESUME as string | undefined) !== 'false';
  private readonly baseUrl = `${this.resolveApiBaseUrl()}/api/stream`;

  private resolveApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

    if (typeof window !== 'undefined') {
      const host = window.location.hostname.toLowerCase();
      const isPipfactorHost = host === 'pipfactor.com' || host.endsWith('.pipfactor.com');

      if (isPipfactorHost && envUrl && /localhost|127\.0\.0\.1/.test(envUrl)) {
        return 'https://api.pipfactor.com';
      }

      if (isPipfactorHost && !envUrl) {
        return 'https://api.pipfactor.com';
      }
    }

    return envUrl || 'http://localhost:8080';
  }

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.resumeAllConnections();
    });

    if (this.enablePauseResume && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseAllConnections();
          return;
        }
        this.resumeAllConnections();
      });
    }
  }

  /**
   * Subscribe to real-time candle updates for a specific symbol/timeframe
   * Use timeframe='ALL' to receive all timeframes for a symbol
   */
  subscribeToCandleUpdates(
    symbol: string,
    timeframe: string,
    onUpdate: SSECallback,
    onError?: SSEErrorCallback
  ): () => void {
    const key = `candles_${symbol}_${timeframe}`;
    
    // If timeframe is ALL, subscribe to all candles and filter on client
    const url = timeframe === 'ALL' 
      ? `${this.baseUrl}/candles`  // All candles
      : `${this.baseUrl}/candles/${symbol}/${timeframe}`;

    return this.subscribe(key, url, (data) => {
      // Filter for this symbol if subscribed to ALL
      if (timeframe === 'ALL' && data.symbol && data.symbol !== symbol) {
        return; // Skip updates for other symbols
      }
      onUpdate(data);
    }, onError);
  }

  /**
   * Subscribe to all candle updates (all symbols/timeframes)
   */
  subscribeToAllCandles(
    onUpdate: SSECallback,
    onError?: SSEErrorCallback
  ): () => void {
    const key = 'candles_all';
    const url = `${this.baseUrl}/candles`;

    return this.subscribe(key, url, onUpdate, onError);
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
    const key = 'strategies';
    const url = pair
      ? `${this.baseUrl}/strategies?pair=${encodeURIComponent(pair)}`
      : `${this.baseUrl}/strategies`;

    return this.subscribe(key, url, onUpdate, onError);
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
        eventSource: null,
        subscribers: new Map(),
        reconnectTimer: null,
        isConnecting: false,
        reconnectAttempts: 0,
        baseReconnectDelay: 1000,
        maxReconnectDelay: 30_000,
      };
      this.connections.set(key, connection);
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
      console.log(`[SSE] Connected to ${connection.key}`);
      connection.isConnecting = false;
      connection.reconnectAttempts = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'connected' || data?.type === 'heartbeat') return;

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
      console.error(`[SSE] Error on ${connection.key}:`, error, `ReadyState: ${eventSource.readyState}`);
      connection.isConnecting = false;

      connection.subscribers.forEach((subscriber) => {
        if (subscriber.onError) {
          try {
            subscriber.onError(error);
          } catch (callbackError) {
            console.error(`[SSE] Subscriber error callback failed for ${connection.key}:`, callbackError);
          }
        }
      });

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

    connection.reconnectAttempts += 1;
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

    if (connection.eventSource) {
      console.log(`[SSE] Closing connection: ${key} (ReadyState: ${connection.eventSource.readyState})`);
      connection.eventSource.close();
      connection.eventSource = null;
    }

    connection.subscribers.clear();
    connection.isConnecting = false;
    this.connections.delete(key);
  }

  /**
   * Close all connections
   */
  closeAllConnections(): void {
    console.log('[SSE] Closing all connections...');
    this.connections.forEach((connection, key) => {
      if (connection.reconnectTimer) {
        window.clearTimeout(connection.reconnectTimer);
        connection.reconnectTimer = null;
      }
      if (connection.eventSource) {
        connection.eventSource.close();
      }
      connection.eventSource = null;
      connection.subscribers.clear();
      connection.isConnecting = false;
    });
    this.connections.clear();
  }

  pauseAllConnections(): void {
    this.globallyPaused = true;
    this.connections.forEach((connection) => {
      if (connection.reconnectTimer) {
        window.clearTimeout(connection.reconnectTimer);
        connection.reconnectTimer = null;
      }
      if (connection.eventSource) {
        connection.eventSource.close();
        connection.eventSource = null;
      }
      connection.isConnecting = false;
    });
  }

  resumeAllConnections(): void {
    this.globallyPaused = false;
    this.connections.forEach((connection) => {
      this.ensureConnected(connection);
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(key: string): string {
    const connection = this.connections.get(key);

    if (!connection) {
      return 'disconnected';
    }

    if (this.globallyPaused) {
      return 'paused';
    }

    if (!connection.eventSource) {
      return connection.subscribers.size > 0 ? 'connecting' : 'disconnected';
    }

    switch (connection.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'connecting';
      case EventSource.OPEN:
        return 'connected';
      case EventSource.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Singleton instance
export const sseService = new SSEService();
export default sseService;
