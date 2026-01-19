/**
 * Server-Sent Events (SSE) Service
 * Handles real-time streaming of candles, news, and strategies
 */

type SSECallback = (data: any) => void;

interface SSEConnection {
  eventSource: EventSource | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
}

class SSEService {
  private connections: Map<string, SSEConnection> = new Map();
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

  /**
   * Subscribe to real-time candle updates for a specific symbol/timeframe
   * Use timeframe='ALL' to receive all timeframes for a symbol
   */
  subscribeToCandleUpdates(
    symbol: string,
    timeframe: string,
    onUpdate: SSECallback,
    onError?: (error: Event) => void
  ): () => void {
    const key = `candles_${symbol}_${timeframe}`;
    
    // If timeframe is ALL, subscribe to all candles and filter on client
    const url = timeframe === 'ALL' 
      ? `${this.baseUrl}/candles`  // All candles
      : `${this.baseUrl}/candles/${symbol}/${timeframe}`;

    return this.createConnection(key, url, (data) => {
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
    onError?: (error: Event) => void
  ): () => void {
    const key = 'candles_all';
    const url = `${this.baseUrl}/candles`;

    return this.createConnection(key, url, onUpdate, onError);
  }

  /**
   * Subscribe to real-time news updates
   */
  subscribeToNews(
    onUpdate: SSECallback,
    onError?: (error: Event) => void
  ): () => void {
    const key = 'news';
    const url = `${this.baseUrl}/news`;

    return this.createConnection(key, url, onUpdate, onError);
  }

  /**
   * Subscribe to real-time strategy updates
   */
  subscribeToStrategies(
    onUpdate: SSECallback,
    onError?: (error: Event) => void
  ): () => void {
    const key = 'strategies';
    const url = `${this.baseUrl}/strategies`;

    return this.createConnection(key, url, onUpdate, onError);
  }

  /**
   * Create and manage an SSE connection
   */
  private createConnection(
    key: string,
    url: string,
    onMessage: SSECallback,
    onError?: (error: Event) => void
  ): () => void {
    // Close existing connection if any
    this.closeConnection(key);

    // Create new connection
    const connection: SSEConnection = {
      eventSource: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
    };

    const connect = () => {
      console.log(`[SSE] Connecting to ${key}...`);

      const eventSource = new EventSource(url, { withCredentials: true });

      eventSource.onopen = () => {
        console.log(`[SSE] Connected to ${key}`);
        connection.reconnectAttempts = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle connection message
          if (data.type === 'connected') {
            console.log(`[SSE] ${key} ready:`, data);
            return;
          }

          // Handle updates
          onMessage(data);
        } catch (error) {
          console.error(`[SSE] Error parsing message for ${key}:`, error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[SSE] Error on ${key}:`, error, `ReadyState: ${eventSource.readyState}`);

        // ReadyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        // Don't reconnect if connection is still open or connecting
        if (eventSource.readyState === EventSource.OPEN || eventSource.readyState === EventSource.CONNECTING) {
          console.log(`[SSE] Connection still active for ${key}, ignoring error`);
          return;
        }

        if (onError) {
          onError(error);
        }

        // Only reconnect if connection is actually closed
        if (eventSource.readyState === EventSource.CLOSED && connection.reconnectAttempts < connection.maxReconnectAttempts) {
          connection.reconnectAttempts++;
          const delay = connection.reconnectDelay * connection.reconnectAttempts;

          console.log(`[SSE] Reconnecting to ${key} in ${delay}ms (attempt ${connection.reconnectAttempts}/${connection.maxReconnectAttempts})...`);

          setTimeout(() => {
            connect();
          }, delay);
        } else if (connection.reconnectAttempts >= connection.maxReconnectAttempts) {
          console.error(`[SSE] Max reconnection attempts reached for ${key}`);
          eventSource.close();
        }
      };

      connection.eventSource = eventSource;
    };

    // Initial connection
    connect();

    // Store connection
    this.connections.set(key, connection);

    // Return cleanup function
    return () => this.closeConnection(key);
  }

  /**
   * Close a specific connection
   */
  closeConnection(key: string): void {
    const connection = this.connections.get(key);
    
    if (connection?.eventSource) {
      console.log(`[SSE] Closing connection: ${key} (ReadyState: ${connection.eventSource.readyState})`);
      connection.eventSource.close();
      this.connections.delete(key);
    } else {
      console.log(`[SSE] No active connection to close: ${key}`);
    }
  }

  /**
   * Close all connections
   */
  closeAllConnections(): void {
    console.log('[SSE] Closing all connections...');
    this.connections.forEach((connection, key) => {
      if (connection.eventSource) {
        connection.eventSource.close();
      }
    });
    this.connections.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(key: string): string {
    const connection = this.connections.get(key);
    
    if (!connection?.eventSource) {
      return 'disconnected';
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
