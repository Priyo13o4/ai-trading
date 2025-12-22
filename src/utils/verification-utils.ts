/**
 * Email Verification Utilities
 * Shared utilities for token validation, error handling, and verification flow
 */

import { supabase } from '@/lib/supabase';
import type { AuthError } from '@supabase/supabase-js';

export interface VerificationToken {
  token: string;
  type: 'signup' | 'recovery' | 'invite' | 'email_change' | 'magiclink';
  error?: string;
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

  // Check query params first
  let token = params.get('token') || params.get('access_token');
  let type = params.get('type') as VerificationToken['type'] | null;
  let error = params.get('error') || params.get('error_description');

  // If not in query, check hash
  if (!token && hash) {
    const hashParams = new URLSearchParams(hash.substring(1));
    token = hashParams.get('token') || hashParams.get('access_token');
    type = hashParams.get('type') as VerificationToken['type'] | null;
    error = error || hashParams.get('error') || hashParams.get('error_description');
  }

  if (!token) {
    console.log('[Verification] No token found in URL');
    return null;
  }

  console.log('[Verification] Token extracted:', { type, hasError: !!error });

  return {
    token,
    type: type || 'signup',
    error: error || undefined,
  };
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
        error: {
          code: 'invalid_token',
          message: tokenData.error,
          userMessage: 'The verification link is invalid or has expired.',
          canRetry: true,
        },
      };
    }

    // Supabase automatically handles the token when detectSessionInUrl is enabled
    // We just need to wait for the session to be established
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Verification] Session error:', error);
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    if (!session) {
      // No session means verification failed or token expired
      return {
        success: false,
        error: {
          code: 'invalid_token',
          message: 'No session found',
          userMessage: 'Verification link is invalid or has expired. Please request a new one.',
          canRetry: true,
        },
      };
    }

    console.log('[Verification] Success! Session found:', session.user.id);

    return {
      success: true,
      needsRedirect: true,
      redirectUrl: '/signal',
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
  const sensitiveParams = ['token', 'access_token', 'refresh_token', 'type', 'error', 'error_description'];
  let hasChanges = false;

  sensitiveParams.forEach((param) => {
    if (params.has(param)) {
      params.delete(param);
      hasChanges = true;
    }
  });

  // Clean hash if it contains tokens
  if (url.hash && (url.hash.includes('token') || url.hash.includes('access_token'))) {
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
    localStorage.setItem('pipfactor_verification_success', Date.now().toString());
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

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'pipfactor_verification_success' && e.newValue) {
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
