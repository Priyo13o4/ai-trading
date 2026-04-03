/**
 * Email Verification Utilities
 * Shared utilities for token validation, error handling, and verification flow
 */

import { supabase } from '@/lib/supabase';
import type { AuthError, Session } from '@supabase/supabase-js';

const VERIFICATION_SYNC_KEY = 'pipfactor_verification_success';
const VERIFICATION_SYNC_TTL_MS = 5 * 60 * 1000;
const EXPLICIT_VERIFY_RETRY_ATTEMPTS = 2;
const EXPLICIT_VERIFY_RETRY_DELAY_MS = 350;
const SESSION_RETRY_ATTEMPTS = 7;
const SESSION_RETRY_DELAY_MS = 450;

export interface VerificationToken {
  token: string;
  type: 'signup' | 'recovery' | 'invite' | 'email_change' | 'magiclink';
  error?: string;
  tokenHash?: string;
  code?: string;
}

export interface VerificationResult {
  success: boolean;
  error?: VerificationError;
  needsRedirect?: boolean;
  redirectUrl?: string;
}

export interface VerificationError {
  code: 'expired_token' | 'invalid_token' | 'network_error' | 'already_verified' | 'unknown_error';
  message: string;
  userMessage: string;
  canRetry: boolean;
}

const isTerminalVerificationError = (error: VerificationError): boolean => {
  return error.code === 'expired_token' || error.code === 'invalid_token' || error.code === 'already_verified';
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const firstNonEmpty = (...values: Array<string | null>): string | null => {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const mapUrlError = (errorMessage: string): VerificationError => {
  const message = errorMessage.toLowerCase();

  if (message.includes('expired') || message.includes('otp_expired')) {
    return {
      code: 'expired_token',
      message: errorMessage,
      userMessage: 'This verification link has expired. Please request a new one.',
      canRetry: true,
    };
  }

  if (message.includes('already') || message.includes('verified')) {
    return {
      code: 'already_verified',
      message: errorMessage,
      userMessage: 'Your email is already verified. You can log in now.',
      canRetry: false,
    };
  }

  return {
    code: 'invalid_token',
    message: errorMessage,
    userMessage: 'The verification link is invalid or has expired.',
    canRetry: true,
  };
};

const waitForSession = async (): Promise<{ session: Session | null; lastError: AuthError | null }> => {
  let lastError: AuthError | null = null;

  for (let attempt = 1; attempt <= SESSION_RETRY_ATTEMPTS; attempt += 1) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (session) {
      return { session, lastError: null };
    }

    if (error) {
      lastError = error;
    }

    if (attempt < SESSION_RETRY_ATTEMPTS) {
      await sleep(SESSION_RETRY_DELAY_MS);
    }
  }

  return { session: null, lastError };
};

/**
 * Extract verification token from URL
 * Supports multiple URL formats:
 * - Supabase default: ?token=xxx&type=signup
 * - Hash format: #access_token=xxx&type=signup
 * - Deep link: pipfactor://auth/callback?token=xxx
 */
export const extractTokenFromUrl = (): VerificationToken | null => {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const params = url.searchParams;
  const hash = url.hash;

  const queryToken = firstNonEmpty(params.get('token'), params.get('access_token'));
  const queryTokenHash = firstNonEmpty(params.get('token_hash'));
  const queryCode = firstNonEmpty(params.get('code'));
  const queryType = params.get('type');
  const queryError = firstNonEmpty(params.get('error'), params.get('error_description'));

  let hashToken: string | null = null;
  let hashTokenHash: string | null = null;
  let hashCode: string | null = null;
  let hashType: string | null = null;
  let hashError: string | null = null;

  if (hash) {
    const hashParams = new URLSearchParams(hash.substring(1));
    hashToken = firstNonEmpty(hashParams.get('token'), hashParams.get('access_token'));
    hashTokenHash = firstNonEmpty(hashParams.get('token_hash'));
    hashCode = firstNonEmpty(hashParams.get('code'));
    hashType = hashParams.get('type');
    hashError = firstNonEmpty(hashParams.get('error'), hashParams.get('error_description'));
  }

  const token = firstNonEmpty(queryToken, hashToken, queryTokenHash, hashTokenHash, queryCode, hashCode);
  const tokenHash = firstNonEmpty(queryTokenHash, hashTokenHash);
  const code = firstNonEmpty(queryCode, hashCode);
  const type = firstNonEmpty(queryType, hashType) as VerificationToken['type'] | null;
  const error = firstNonEmpty(queryError, hashError);

  if (!token) {
    console.log('[Verification] No token found in URL');
    return null;
  }

  console.log('[Verification] Token extracted:', {
    type,
    hasError: !!error,
    hasTokenHash: !!tokenHash,
    hasCode: !!code,
  });

  return {
    token,
    type: type || 'signup',
    error: error || undefined,
    tokenHash: tokenHash || undefined,
    code: code || undefined,
  };
};

/**
 * Check whether the current URL carries auth-sensitive callback fields.
 */
export const hasSensitiveAuthDataInUrl = (): boolean => {
  if (typeof window === 'undefined') return false;

  const url = new URL(window.location.href);
  const sensitiveParams = ['token', 'access_token', 'token_hash', 'code', 'refresh_token', 'type', 'error', 'error_description'];
  const hasSensitiveParam = sensitiveParams.some((param) => url.searchParams.has(param));
  const hasSensitiveHash = Boolean(
    url.hash &&
      (url.hash.includes('token') ||
        url.hash.includes('access_token') ||
        url.hash.includes('token_hash') ||
        url.hash.includes('code') ||
        url.hash.includes('refresh_token'))
  );

  return hasSensitiveParam || hasSensitiveHash;
};

/**
 * Verify email token with Supabase
 * Simplified for web-only (no mobile app complexity)
 */
export const verifyEmailToken = async (
  tokenData: VerificationToken
): Promise<VerificationResult> => {
  try {
    console.log('[Verification] Verifying token...');

    // If there's an error in the URL, return it immediately
    if (tokenData.error) {
      return {
        success: false,
        error: mapUrlError(tokenData.error),
      };
    }

    let explicitAttemptError: VerificationError | null = null;

    if (tokenData.tokenHash) {
      for (let attempt = 1; attempt <= EXPLICIT_VERIFY_RETRY_ATTEMPTS; attempt += 1) {
        const { error } = await supabase.auth.verifyOtp({
          type: tokenData.type,
          token_hash: tokenData.tokenHash,
        });

        if (!error) {
          explicitAttemptError = null;
          break;
        }

        const mappedError = mapAuthError(error);
        explicitAttemptError = mappedError;

        if (isTerminalVerificationError(mappedError)) {
          return {
            success: false,
            error: mappedError,
          };
        }

        if (attempt < EXPLICIT_VERIFY_RETRY_ATTEMPTS) {
          await sleep(EXPLICIT_VERIFY_RETRY_DELAY_MS);
        }
      }
    }

    if (tokenData.code) {
      for (let attempt = 1; attempt <= EXPLICIT_VERIFY_RETRY_ATTEMPTS; attempt += 1) {
        const { error } = await supabase.auth.exchangeCodeForSession(tokenData.code);

        if (!error) {
          explicitAttemptError = null;
          break;
        }

        const mappedError = mapAuthError(error);
        explicitAttemptError = mappedError;

        if (isTerminalVerificationError(mappedError)) {
          return {
            success: false,
            error: mappedError,
          };
        }

        if (attempt < EXPLICIT_VERIFY_RETRY_ATTEMPTS) {
          await sleep(EXPLICIT_VERIFY_RETRY_DELAY_MS);
        }
      }
    }

    // Fallback to bounded session polling for detectSessionInUrl and async auth state writes.
    const { session, lastError } = await waitForSession();

    if (session) {
      console.log('[Verification] Success! Session found:', session.user.id);
      return {
        success: true,
        needsRedirect: true,
        redirectUrl: '/signal',
      };
    }

    if (lastError) {
      const mappedSessionError = mapAuthError(lastError);
      console.error('[Verification] Session error after retry:', lastError);
      return {
        success: false,
        error: isTerminalVerificationError(mappedSessionError)
          ? mappedSessionError
          : explicitAttemptError || mappedSessionError,
      };
    }

    if (explicitAttemptError) {
      return {
        success: false,
        error: explicitAttemptError,
      };
    }

    return {
      success: false,
      error: {
        code: 'invalid_token',
        message: 'No session found after verification retries',
        userMessage: 'Verification link is invalid or has expired. Please request a new one.',
        canRetry: true,
      },
    };
  } catch (error) {
    console.error('[Verification] Unexpected error:', error);
    return {
      success: false,
      error: {
        code: 'network_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        userMessage: 'Network error. Please check your connection and try again.',
        canRetry: true,
      },
    };
  }
};

/**
 * Map Supabase auth errors to user-friendly messages
 */
const mapAuthError = (error: AuthError): VerificationError => {
  const message = error.message.toLowerCase();

  // Token expired
  if (
    message.includes('expired') ||
    message.includes('token has expired') ||
    error.status === 401
  ) {
    return {
      code: 'expired_token',
      message: error.message,
      userMessage: 'This verification link has expired. Please request a new one.',
      canRetry: true,
    };
  }

  // Invalid token
  if (
    message.includes('invalid') ||
    message.includes('malformed') ||
    message.includes('not found') ||
    error.status === 400
  ) {
    return {
      code: 'invalid_token',
      message: error.message,
      userMessage: 'This verification link is invalid. Please request a new one.',
      canRetry: true,
    };
  }

  // Already verified
  if (message.includes('already') || message.includes('verified')) {
    return {
      code: 'already_verified',
      message: error.message,
      userMessage: 'Your email is already verified. You can log in now.',
      canRetry: false,
    };
  }

  // Network/server error
  if (error.status && error.status >= 500) {
    return {
      code: 'network_error',
      message: error.message,
      userMessage: 'Server error. Please try again in a few moments.',
      canRetry: true,
    };
  }

  // Unknown error
  return {
    code: 'unknown_error',
    message: error.message,
    userMessage: 'Something went wrong. Please try again or contact support.',
    canRetry: true,
  };
};

/**
 * Request new verification email
 */
export const resendVerificationEmail = async (email: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // First check if user exists and is already verified
    const { data: session } = await supabase.auth.getSession();
    
    if (session?.session?.user?.email_confirmed_at) {
      return {
        success: false,
        error: 'Your email is already verified',
      };
    }

    // Resend verification email
    // Note: Supabase doesn't have a direct "resend verification" endpoint
    // We need to trigger a new signup or use magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Don't create new user
      },
    });

    if (error) {
      console.error('[Verification] Resend error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[Verification] Unexpected resend error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend email',
    };
  }
};

/**
 * Clean URL after verification (remove tokens from URL bar)
 * Security best practice: don't leave tokens in browser history
 */
export const cleanUrlAfterVerification = () => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Remove sensitive params
  const sensitiveParams = ['token', 'access_token', 'token_hash', 'code', 'refresh_token', 'type', 'error', 'error_description'];
  let hasChanges = false;

  sensitiveParams.forEach((param) => {
    if (params.has(param)) {
      params.delete(param);
      hasChanges = true;
    }
  });

  // Clean hash if it contains tokens
  if (
    url.hash &&
    (url.hash.includes('token') ||
      url.hash.includes('access_token') ||
      url.hash.includes('token_hash') ||
      url.hash.includes('code'))
  ) {
    url.hash = '';
    hasChanges = true;
  }

  // Update URL without reloading if changes were made
  if (hasChanges) {
    window.history.replaceState({}, document.title, url.pathname + (params.toString() ? '?' + params.toString() : ''));
  }
};

/**
 * Cross-tab verification sync
 * Notify other tabs when verification completes
 */
export const notifyVerificationSuccess = () => {
  if (typeof window === 'undefined') return;

  try {
    const payload = JSON.stringify({
      ts: Date.now(),
      expiresAt: Date.now() + VERIFICATION_SYNC_TTL_MS,
    });
    localStorage.setItem(VERIFICATION_SYNC_KEY, payload);
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent('verification-success'));
  } catch (e) {
    console.error('[Verification] Failed to notify other tabs:', e);
  }
};

/**
 * Listen for verification success from other tabs
 */
export const onVerificationSuccess = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};

  const parsePayload = (value: string | null): { ts: number; expiresAt: number } | null => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as { ts?: number; expiresAt?: number };
      if (!parsed.ts || !parsed.expiresAt) return null;
      if (parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(VERIFICATION_SYNC_KEY);
        return null;
      }
      return { ts: parsed.ts, expiresAt: parsed.expiresAt };
    } catch {
      localStorage.removeItem(VERIFICATION_SYNC_KEY);
      return null;
    }
  };

  // Opportunistic cleanup for stale/invalid markers.
  parsePayload(localStorage.getItem(VERIFICATION_SYNC_KEY));

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === VERIFICATION_SYNC_KEY && parsePayload(e.newValue)) {
      callback();
    }
  };

  const handleCustomEvent = () => {
    callback();
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('verification-success', handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('verification-success', handleCustomEvent);
  };
};

/**
 * Validate token format (basic security check before API call)
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // Supabase tokens are typically JWT format (xxx.yyy.zzz) or base64 strings
  // Should be at least 20 characters and contain valid characters
  const validPattern = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/;
  
  return token.length >= 20 && validPattern.test(token);
};
