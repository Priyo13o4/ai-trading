/**
 * Security Configuration for Production Deployment
 * These headers should be configured at the server/CDN level for production
 */

export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Content Security Policy - adjust based on your needs
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "trusted-types default dompurify"
  ].join('; '),
  
  // HTTPS only in production
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Disable some features that could be exploited
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

/**
 * Input validation patterns
 */
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  tradingPair: /^[A-Z]{3,6}\/[A-Z]{3,6}$|^[A-Z]{6}$/,
  numericId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMinutes: 15 },
  api: { maxRequests: 100, windowMinutes: 1 },
  signup: { maxAttempts: 3, windowMinutes: 60 }
};

/**
 * Environment variable validation
 */
export function validateEnvironmentVariables() {
  const missing: string[] = [];
  if (!import.meta.env.VITE_SUPABASE_URL) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate URLs
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('VITE_SUPABASE_URL should use HTTPS in production');
  }
}

/**
 * Secure token validation
 */
export function isValidJWT(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // Basic JWT structure validation (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Validate base64 encoding with proper padding handling
    parts.forEach(part => {
      const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
      const padding = (4 - (normalized.length % 4)) % 4;
      const padded = normalized.concat('='.repeat(padding));
      atob(padded);
    });
    return true;
  } catch {
    return false;
  }
}
