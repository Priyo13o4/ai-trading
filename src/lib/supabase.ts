import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const authCallbackUrlLegacy = import.meta.env.VITE_AUTH_CALLBACK_URL;
const authCallbackUrlDev = import.meta.env.VITE_AUTH_CALLBACK_URL_DEV;
const authCallbackUrlProd = import.meta.env.VITE_AUTH_CALLBACK_URL_PROD;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Supabase URL and publishable key (VITE_SUPABASE_PUBLISHABLE_KEY) must be provided in .env file");
}

const getFirstNonEmpty = (...values: Array<string | undefined>) => {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

export const getAuthCallbackUrl = () => {
  const envCallbackUrl = import.meta.env.PROD
    ? getFirstNonEmpty(authCallbackUrlProd, authCallbackUrlLegacy)
    : getFirstNonEmpty(authCallbackUrlDev, authCallbackUrlLegacy);

  if (envCallbackUrl) {
    return envCallbackUrl;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3000/auth/callback';
  }

  return `${window.location.origin}/auth/callback`;
};

// Backward-compatible alias used by existing auth flow imports.
export const getRedirectUrl = getAuthCallbackUrl;

const memoryAuthStore = new Map<string, string>();

const getAuthStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: (key: string) => memoryAuthStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryAuthStore.set(key, value);
      },
      removeItem: (key: string) => {
        memoryAuthStore.delete(key);
      },
    };
  }

  return window.sessionStorage;
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    // Storage key for auth tokens
    storageKey: 'pipfactor-auth',
    
    // Auto refresh tokens
    autoRefreshToken: true,
    
    // Persist within a single tab session only.
    persistSession: true,

    // Use tab-scoped storage to reduce token-at-rest exposure.
    storage: getAuthStorage(),
    
    // Detect session in URL (for email verification)
    detectSessionInUrl: true,
  },
})