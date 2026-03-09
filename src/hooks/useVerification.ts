/**
 * Email Verification Hook
 * Handles verification logic across all platforms
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  extractTokenFromUrl,
  verifyEmailToken,
  cleanUrlAfterVerification,
  hasSensitiveAuthDataInUrl,
  notifyVerificationSuccess,
  onVerificationSuccess,
  isValidTokenFormat,
  type VerificationToken,
  type VerificationResult,
  type VerificationError,
} from '@/utils/verification-utils';
import { supabase } from '@/lib/supabase';

export type VerificationStatus = 
  | 'idle' 
  | 'extracting' 
  | 'verifying' 
  | 'success' 
  | 'error' 
  | 'already_verified';

interface UseVerificationOptions {
  autoVerify?: boolean; // Auto-verify on mount if token present
  redirectOnSuccess?: string; // Where to redirect after success
  onSuccess?: () => void; // Callback after successful verification
  onError?: (error: VerificationError) => void; // Callback on error
}

interface UseVerificationReturn {
  status: VerificationStatus;
  error: VerificationError | null;
  isLoading: boolean;
  tokenData: VerificationToken | null;
  verify: () => Promise<void>;
  resend: () => Promise<void>;
  canResend: boolean;
}

export const useVerification = (
  options: UseVerificationOptions = {}
): UseVerificationReturn => {
  const {
    autoVerify = true,
    redirectOnSuccess = '/signal',
    onSuccess,
    onError,
  } = options;

  const navigate = useNavigate();

  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<VerificationError | null>(null);
  const [tokenData, setTokenData] = useState<VerificationToken | null>(null);
  const [resendCooldown, setResendCooldown] = useState(false);

  /**
   * Extract and validate token from URL
   */
  const extractToken = useCallback(() => {
    setStatus('extracting');

    const token = extractTokenFromUrl();
    const hasSensitiveUrlData = hasSensitiveAuthDataInUrl();

    // Strip token-bearing callback URL data before any async verification path runs.
    if (hasSensitiveUrlData) {
      cleanUrlAfterVerification();
    }
    
    if (!token) {
      setStatus('idle');
      return null;
    }

    // Validate token format
    if (!isValidTokenFormat(token.token)) {
      const invalidError: VerificationError = {
        code: 'invalid_token',
        message: 'Token format is invalid',
        userMessage: 'This verification link appears to be corrupted. Please request a new one.',
        canRetry: true,
      };
      setError(invalidError);
      setStatus('error');
      onError?.(invalidError);
      return null;
    }

    setTokenData(token);
    return token;
  }, [onError]);

  /**
   * Verify the token with Supabase
   */
  const verify = useCallback(async (tokenOverride?: VerificationToken) => {
    const tokenToVerify = tokenOverride ?? tokenData;
    if (!tokenToVerify) {
      return;
    }

    setStatus('verifying');
    setError(null);

    try {
      const result: VerificationResult = await verifyEmailToken(tokenToVerify);

      if (result.success) {
        setStatus('success');

        // Clean URL (remove token from history)
        cleanUrlAfterVerification();

        // Notify other tabs
        notifyVerificationSuccess();

        // For web, navigate after short delay
        setTimeout(() => {
          onSuccess?.();
          navigate(redirectOnSuccess);
        }, 1500);
      } else {
        setError(result.error || null);
        setStatus('error');
        onError?.(result.error!);
      }
    } catch (err) {
      const unexpectedError: VerificationError = {
        code: 'unknown_error',
        message: err instanceof Error ? err.message : 'Unknown error',
        userMessage: 'An unexpected error occurred. Please try again.',
        canRetry: true,
      };
      setError(unexpectedError);
      setStatus('error');
      onError?.(unexpectedError);
    }
  }, [tokenData, navigate, redirectOnSuccess, onSuccess, onError]);

  /**
   * Request new verification email
   */
  const resend = useCallback(async () => {
    if (resendCooldown) {
      return;
    }

    try {
      setResendCooldown(true);

      // Get current user email
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;

      if (!email) {
        throw new Error('No email found. Please log in and try again.');
      }

      // Trigger new verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        throw error;
      }

      // Reset cooldown after 60 seconds
      setTimeout(() => setResendCooldown(false), 60000);
    } catch (err) {
      setResendCooldown(false);
      const resendError: VerificationError = {
        code: 'network_error',
        message: err instanceof Error ? err.message : 'Failed to resend',
        userMessage: 'Failed to send verification email. Please try again.',
        canRetry: true,
      };
      setError(resendError);
      onError?.(resendError);
    }
  }, [resendCooldown, onError]);

  /**
   * Auto-verify on mount if enabled
   */
  useEffect(() => {
    if (!autoVerify) return;

    const token = extractToken();
    if (token) {
      // Small delay to show extracting state
      setTimeout(() => {
        verify(token);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * Listen for verification success from other tabs (cross-tab sync)
   */
  useEffect(() => {
    const cleanup = onVerificationSuccess(() => {
      if (status !== 'success') {
        setStatus('success');
        // Redirect after short delay
        setTimeout(() => {
          navigate(redirectOnSuccess);
        }, 1000);
      }
    });

    return cleanup;
  }, [status, navigate, redirectOnSuccess]);

  /**
   * Check if already verified on mount
   */
  useEffect(() => {
    const checkVerificationStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        setStatus('already_verified');
        
        // If we have a token in URL but email is already verified, clean URL and redirect
        if (tokenData) {
          cleanUrlAfterVerification();
          setTimeout(() => {
            navigate(redirectOnSuccess);
          }, 1500);
        }
      }
    };

    checkVerificationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    status,
    error,
    isLoading: status === 'extracting' || status === 'verifying',
    tokenData,
    verify,
    resend,
    canResend: !resendCooldown && error?.canRetry === true,
  };
};
