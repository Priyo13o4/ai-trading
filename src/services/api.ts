/**
 * API Service Layer for Trading Bot Frontend
 * Manages all API calls to the FastAPI backend with cookie-session auth.
 */

interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 10000, // 10 seconds default
      ...config,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    
    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const method = (options.method || 'GET').toUpperCase();
      const csrfToken = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
        ? null
        : this.getCsrfTokenFromCookie();

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        return {
          error:
            (typeof data === 'object' && data && 'detail' in data
              ? (data as any).detail
              : undefined) || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            error: 'Request timeout',
            status: 408,
          };
        }
        return {
          error: error.message,
          status: 0,
        };
      }
      
      return {
        error: 'Unknown error occurred',
        status: 0,
      };
    }
  }

  /**
   * Read CSRF token from cookie (double-submit)
   */
  private getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('csrf_token='));

    if (!match) return null;
    const value = match.split('=')[1] || '';
    return decodeURIComponent(value) || null;
  }

  // Auth endpoints
  async authExchange(accessToken: string): Promise<ApiResponse<any>> {
    return this.request('/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    });
  }

  async authValidate(): Promise<ApiResponse<any>> {
    return this.request('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async authLogout(allSessions: boolean = false): Promise<ApiResponse<any>> {
    return this.request(allSessions ? '/auth/logout-all' : '/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Health check endpoint
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request('/api/health');
  }

  // Get signal for a specific trading pair
  async getSignal(pair: string): Promise<ApiResponse<any>> {
    return this.request(`/api/signals/${pair}`);
  }

  // Get latest regime data
  async getRegime(): Promise<ApiResponse<any>> {
    return this.request('/api/regime');
  }

  // Get current news with pagination
  async getCurrentNews(limit: number = 20, offset: number = 0): Promise<ApiResponse<any>> {
    return this.request(`/api/news/current?limit=${limit}&offset=${offset}`);
  }

  // Get upcoming news
  async getUpcomingNews(): Promise<ApiResponse<any[]>> {
    return this.request('/api/news/upcoming');
  }

  // Get historical candlestick data
  async getHistoricalData(
    symbol: string,
    timeframe: string,
    limit: number = 200,
    before?: number  // Unix timestamp for lazy loading
  ): Promise<ApiResponse<{ candles: any[] }>> {
    const beforeParam = before ? `&before=${before}` : '';
    return this.request(`/api/historical/${symbol}/${timeframe}?limit=${limit}${beforeParam}`);
  }

  // Get comprehensive market data with indicators
  async getComprehensiveData(symbol: string): Promise<ApiResponse<any>> {
    return this.request(`/api/market-data/comprehensive/${symbol}`);
  }

  // Get strategy for a specific pair
  async getStrategy(pair: string): Promise<ApiResponse<any>> {
    return this.request(`/api/signal/strategy/${pair}`);
  }

  // Get news markers for charting
  async getNewsMarkers(
    symbol: string,
    hours: number = 8760,
    minImportance: number = 3
  ): Promise<ApiResponse<any[]>> {
    return this.request(`/api/news/markers/${symbol}?hours=${hours}&min_importance=${minImportance}`);
  }

  // Get generic request method
  async get(endpoint: string, options?: RequestInit): Promise<any> {
    const response = await this.request(endpoint, options);
    return response.data || response.error;
  }
}

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    const isPipfactorHost = host === 'pipfactor.com' || host.endsWith('.pipfactor.com');

    // If we're served from pipfactor.com but the env still points to localhost (common during tunnel testing),
    // prefer the API subdomain so the browser doesn't try to call its own localhost.
    if (isPipfactorHost && envUrl && /localhost|127\.0\.0\.1/.test(envUrl)) {
      return 'https://api.pipfactor.com';
    }

    if (isPipfactorHost && !envUrl) {
      return 'https://api.pipfactor.com';
    }
  }

  return envUrl || 'http://localhost:8080';
}

// Create API instance with environment-based configuration
const apiConfig: ApiConfig = {
  baseUrl: resolveApiBaseUrl(),
  timeout: 10000,
};

export const apiService = new ApiService(apiConfig);
export default apiService;
