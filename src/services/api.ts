/**
 * API Service Layer for Trading Bot Frontend
 * Manages all API calls to the FastAPI backend with cookie-session auth.
 */

import type { StrategyAllQueryParams, StrategyQueryParams } from '@/types/strategy';

interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  retryAfter?: number;
}

const SAFE_NETWORK_ERROR = 'Unable to reach the server. Please check your connection and try again.';
const SAFE_TIMEOUT_ERROR = 'Request timed out. Please try again.';
const SAFE_SERVER_ERROR = 'Something went wrong on our side. Please try again shortly.';
const SAFE_CLIENT_ERROR = 'Request could not be completed. Please check your input and try again.';
const MAX_PUBLIC_ERROR_LENGTH = 220;
const ERROR_ID_PATTERN = /^[a-zA-Z0-9_-]{6,80}$/;
const SENSITIVE_ERROR_PATTERN =
  /(traceback|stack trace|exception:|psycopg|postgres|sqlstate|constraint|schema|internal error|file\s+".+\.py"|line\s+\d+|select\s+.+\s+from\s+|insert\s+into\s+)/i;

const extractSafeBackendErrorContract = (
  data: unknown,
): { message?: string; errorId?: string } => {
  if (typeof data !== 'object' || !data) {
    return {};
  }

  const obj = data as Record<string, unknown>;
  const message = typeof obj.message === 'string' ? obj.message.trim() : '';
  const rawErrorId = typeof obj.error_id === 'string' ? obj.error_id.trim() : '';
  const errorId = ERROR_ID_PATTERN.test(rawErrorId) ? rawErrorId : undefined;

  return {
    message: message || undefined,
    errorId,
  };
};

export const toSafeUserErrorMessage = (
  rawMessage: string | undefined,
  status?: number,
  fallback: string = SAFE_CLIENT_ERROR,
): string => {
  const normalized = (rawMessage || '').trim();

  if (status === 0) {
    return SAFE_NETWORK_ERROR;
  }
  if (status === 408) {
    return SAFE_TIMEOUT_ERROR;
  }
  if (typeof status === 'number' && status >= 500) {
    return SAFE_SERVER_ERROR;
  }
  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403) {
    if (/csrf|token|challenge/i.test(normalized)) {
      return 'Security verification failed. Please refresh and try again.';
    }
    return 'You are not allowed to perform this action.';
  }

  if (!normalized) {
    return fallback;
  }

  if (SENSITIVE_ERROR_PATTERN.test(normalized)) {
    return fallback;
  }

  if (normalized.length > MAX_PUBLIC_ERROR_LENGTH) {
    return `${normalized.slice(0, MAX_PUBLIC_ERROR_LENGTH - 1)}...`;
  }

  return normalized;
};

export interface AuthActiveSession {
  sid: string;
  current: boolean;
  created_at: number | null;
  last_activity: number | null;
  expires_at: number | null;
  remember_me: boolean;
  user_agent?: { summary?: string };
  ip?: string | null;
  country?: string | null;
}

const AUTHDBG_ENABLED = ['1', 'true', 'yes', 'on'].includes(
  String(import.meta.env.VITE_AUTHDBG ?? '').toLowerCase()
);

const authdbg = (...args: unknown[]) => {
  if (!AUTHDBG_ENABLED) return;
  console.debug('AUTHDBG', ...args);
};

class ApiService {
  private config: ApiConfig;
  private readonly csrfExemptPaths = new Set(['/auth/exchange', '/auth/logout', '/auth/logout-all']);
  private readonly csrfCookieName = (import.meta.env.VITE_CSRF_COOKIE_NAME as string | undefined)?.trim() || 'csrf_token';

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
    const rid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    
    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const method = (options.method || 'GET').toUpperCase();
      const isMutatingMethod = !['GET', 'HEAD', 'OPTIONS'].includes(method);
      const isCsrfExempt = this.isCsrfExemptEndpoint(endpoint);
      const csrfTokenFromHeader = this.getCsrfTokenFromHeaders(options.headers);
      const csrfTokenFromCookie = isMutatingMethod ? this.getCsrfTokenFromCookie() : null;
      const csrfToken = csrfTokenFromHeader || csrfTokenFromCookie;

      if (isMutatingMethod && !isCsrfExempt && !csrfToken) {
        authdbg('event=fe.api.request.blocked', { rid, endpoint, method, reason: 'missing_csrf' });
        clearTimeout(timeoutId);
        return {
          error: 'CSRF token is required for state-changing requests',
          status: 403,
        };
      }

      authdbg('event=fe.api.request', {
        rid,
        endpoint,
        method,
        credentials: 'include',
        csrfExempt: isCsrfExempt,
        csrfHeaderPresent: Boolean(csrfTokenFromHeader),
        csrfCookiePresent: Boolean(csrfTokenFromCookie),
      });

      const headers = new Headers(options.headers || undefined);
      const hasJsonBody = typeof options.body === 'string';
      if (hasJsonBody && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      if (csrfToken) {
        headers.set('x-csrf-token', csrfToken);
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include',
        headers,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      authdbg('event=fe.api.response', {
        rid,
        endpoint,
        status: response.status,
        ok: response.ok,
        contentType,
        acao: response.headers.get('access-control-allow-origin') || '',
        acc: response.headers.get('access-control-allow-credentials') || '',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          authdbg('event=fe.api.auth_failure', {
            rid,
            endpoint,
            status: response.status,
          });
        }
        if (response.status === 503) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
          return {
            error: 'Service temporarily unavailable. Please try again shortly.',
            status: response.status,
            retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
          };
        }
        // Do not globally force logout on arbitrary 401s from feature APIs.
        // Auth state is managed centrally by useAuth via /auth/validate and /auth/me.
        const safeContract = extractSafeBackendErrorContract(data);
        const rawError = safeContract.message || `HTTP ${response.status}: ${response.statusText}`;
        const rawErrorWithId = safeContract.errorId ? `${rawError} (ref: ${safeContract.errorId})` : rawError;
        return {
          error: toSafeUserErrorMessage(rawErrorWithId, response.status),
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      authdbg('event=fe.api.error', {
        rid,
        endpoint,
        message: error instanceof Error ? error.message : 'unknown',
      });
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            error: SAFE_TIMEOUT_ERROR,
            status: 408,
          };
        }
        return {
          error: toSafeUserErrorMessage(error.message, 0, SAFE_NETWORK_ERROR),
          status: 0,
        };
      }
      
      return {
        error: SAFE_NETWORK_ERROR,
        status: 0,
      };
    }
  }

  private getCsrfTokenFromHeaders(headers?: HeadersInit): string | null {
    if (!headers) return null;

    if (headers instanceof Headers) {
      return headers.get('x-csrf-token') || headers.get('X-CSRF-Token');
    }

    if (Array.isArray(headers)) {
      const match = headers.find(([key]) => key.toLowerCase() === 'x-csrf-token');
      return match?.[1] || null;
    }

    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'x-csrf-token') {
        return typeof value === 'string' ? value : null;
      }
    }

    return null;
  }

  /**
   * Read CSRF token from cookie (double-submit)
   */
  private getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const cookiePrefix = `${this.csrfCookieName}=`;

    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(cookiePrefix));

    if (!match) return null;
    const value = match.slice(cookiePrefix.length);
    return decodeURIComponent(value) || null;
  }

  private isCsrfExemptEndpoint(endpoint: string): boolean {
    const normalizedPath = endpoint.split('?')[0];
    return this.csrfExemptPaths.has(normalizedPath);
  }

  // Auth endpoints
  async authExchange(
    accessToken: string,
    turnstileToken?: string,
    rememberMe?: boolean,
    deviceId?: string | null,
  ): Promise<ApiResponse<any>> {
    authdbg('event=fe.exchange.request', {
      turnstilePassedToBackend: Boolean(turnstileToken),
      rememberMe: Boolean(rememberMe),
    });
    return this.request('/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({
        access_token: accessToken,
        turnstile_token: turnstileToken,
        remember_me: rememberMe ?? false,
        device_id: deviceId ?? undefined,
      }),
    });
  }

  async authValidate(): Promise<ApiResponse<any>> {
    return this.request('/auth/validate');
  }

  async authMe(): Promise<ApiResponse<any>> {
    return this.request('/auth/me');
  }

  async authUpdateProfile(fullName: string): Promise<ApiResponse<any>> {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ full_name: fullName }),
    });
  }

  async authUpdateEmail(email: string): Promise<ApiResponse<any>> {
    return this.request('/auth/email', {
      method: 'PATCH',
      body: JSON.stringify({ email }),
    });
  }

  async authUpdatePassword(password: string): Promise<ApiResponse<any>> {
    return this.request('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  }

  async authLogout(allSessions: boolean = false): Promise<ApiResponse<any>> {
    return this.request(allSessions ? '/auth/logout-all' : '/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async authListSessions(): Promise<ApiResponse<{ ok: boolean; sessions: AuthActiveSession[]; total: number }>> {
    return this.request('/auth/sessions');
  }

  async authRevokeSession(publicSid: string): Promise<ApiResponse<{ ok: boolean; revoked: boolean; current_revoked: boolean }>> {
    return this.request(`/auth/sessions/${encodeURIComponent(publicSid)}`, {
      method: 'DELETE',
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

  // Get specific news item
  async getNewsById(id: number | string): Promise<ApiResponse<any>> {
    return this.request(`/api/news/${id}`);
  }

  // Get weekly macro playbook
  async getNewsPlaybook(): Promise<ApiResponse<any>> {
    return this.request('/api/news/playbook');
  }

  // Get event analysis
  async getNewsEvents(): Promise<ApiResponse<any>> {
    return this.request('/api/news/events');
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

  // Get strategy for a specific pair
  async getStrategy(pair: string): Promise<ApiResponse<any>> {
    return this.request(`/api/signals/${pair}`);
  }

  // Get strategies with optional filters (backward compatible with pair string)
  async getStrategies(pairOrParams?: string | StrategyQueryParams): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();

    if (typeof pairOrParams === 'string') {
      if (pairOrParams) params.set('pair', pairOrParams);
    } else if (pairOrParams) {
      if (pairOrParams.pair) params.set('pair', pairOrParams.pair);
      if (pairOrParams.status && pairOrParams.status !== 'all') params.set('status', pairOrParams.status);
      if (typeof pairOrParams.include_historical === 'boolean') {
        params.set('include_historical', String(pairOrParams.include_historical));
      }
      if (typeof pairOrParams.limit === 'number') params.set('limit', String(pairOrParams.limit));
      if (typeof pairOrParams.offset === 'number') params.set('offset', String(pairOrParams.offset));
    }

    const query = params.toString();
    return this.request(`/api/strategies${query ? `?${query}` : ''}`);
  }

  // Get all strategies with backend filtering and pagination
  async getStrategiesAll(paramsIn?: StrategyAllQueryParams): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();

    if (paramsIn) {
      if (paramsIn.symbol) params.set('symbol', paramsIn.symbol);
      if (paramsIn.direction) params.set('direction', paramsIn.direction);
      if (paramsIn.status && paramsIn.status !== 'all') params.set('status', paramsIn.status);
      if (paramsIn.search) params.set('search', paramsIn.search);
      if (typeof paramsIn.limit === 'number') params.set('limit', String(paramsIn.limit));
      if (typeof paramsIn.offset === 'number') params.set('offset', String(paramsIn.offset));
    }

    const query = params.toString();
    return this.request(`/api/strategies/all${query ? `?${query}` : ''}`);
  }

  // Get news markers for charting
  async getNewsMarkers(
    symbol: string,
    hours: number = 8760,
    minImportance: number = 3,
    before?: string,
    limit: number = 500
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    params.set('hours', String(hours));
    params.set('min_importance', String(minImportance));
    params.set('limit', String(limit));
    if (before) {
      params.set('before', before);
    }

    return this.request(`/api/news/markers/${symbol}?${params.toString()}`);
  }

  // Payments
  async createCheckout(
    planId: string,
    provider: string,
    billingPeriod: string = 'monthly'
  ): Promise<ApiResponse<any>> {
    return this.request('/api/payments/create-checkout', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        provider,
        billing_period: billingPeriod,
      }),
    });
  }

  async cancelSubscription(): Promise<ApiResponse<any>> {
    return this.request('/api/payments/cancel-subscription', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async cancelCheckoutAttempt(provider: string, providerPaymentId: string): Promise<ApiResponse<any>> {
    return this.request('/api/payments/cancel-checkout-attempt', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        provider_payment_id: providerPaymentId,
      }),
    });
  }

  async resumeSubscription(): Promise<ApiResponse<any>> {
    return this.request('/api/payments/resume-subscription', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getPaymentHistory(): Promise<ApiResponse<any>> {
    return this.request('/api/payments/history', {
      method: 'GET',
    });
  }

  async getReferralProfile(): Promise<ApiResponse<any>> {
    return this.request('/api/referrals/profile', {
      method: 'GET',
    });
  }

  async activateReferralCode(referralCode: string): Promise<ApiResponse<any>> {
    return this.request('/api/referrals/activate-rewards', {
      method: 'POST',
      body: JSON.stringify({ referral_code: referralCode }),
    });
  }

  // Get generic request method
  async get(endpoint: string, options?: RequestInit): Promise<any> {
    const response = await this.request(endpoint, options);
    return response.data || response.error;
  }
}

function resolveApiBaseUrl(): string {
  const envName = ((import.meta.env.VITE_ENV_NAME as string | undefined) || '').trim().toLowerCase();
  const isLocalEnv = envName === '' || envName === 'local' || envName === 'development';

  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '');
  if (envUrl) {
    return envUrl;
  }

  if (isLocalEnv) {
    return 'http://localhost:8080';
  }

  throw new Error(
    '[ApiService] VITE_API_BASE_URL is required when VITE_ENV_NAME is not local/development.'
  );
}

// Create API instance with environment-based configuration
const apiConfig: ApiConfig = {
  baseUrl: resolveApiBaseUrl(),
  timeout: 10000,
};

export const apiService = new ApiService(apiConfig);
export default apiService;
