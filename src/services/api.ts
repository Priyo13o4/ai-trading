/**
 * API Service Layer for Trading Bot Frontend
 * Manages all API calls to the FastAPI backend with proper auth handling
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
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.detail || `HTTP ${response.status}: ${response.statusText}`,
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
   * Get authentication headers with JWT token
   */
  private getAuthHeaders(token?: string): HeadersInit {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // Health check endpoint
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request('/api/health');
  }

  // Get signal for a specific trading pair
  async getSignal(pair: string, token?: string): Promise<ApiResponse<any>> {
    return this.request(`/api/signals/${pair}`, {
      headers: this.getAuthHeaders(token),
    });
  }

  // Get latest regime data
  async getRegime(token?: string): Promise<ApiResponse<any>> {
    return this.request('/api/regime', {
      headers: this.getAuthHeaders(token),
    });
  }

  // Get current news
  async getCurrentNews(token?: string): Promise<ApiResponse<any[]>> {
    return this.request('/api/news/current', {
      headers: this.getAuthHeaders(token),
    });
  }

  // Get upcoming news
  async getUpcomingNews(token?: string): Promise<ApiResponse<any[]>> {
    return this.request('/api/news/upcoming', {
      headers: this.getAuthHeaders(token),
    });
  }
}

// Create API instance with environment-based configuration
const apiConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
};

export const apiService = new ApiService(apiConfig);
export default apiService;
