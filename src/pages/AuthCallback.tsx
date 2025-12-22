/**
 * Auth Callback Page
 * Handles email verification for web (desktop + mobile browsers)
 * 
 * User clicks email link → Lands here → Auto-verifies → Redirects to /signal
 */

import { useEffect } from 'react';
import { useVerification } from '@/hooks/useVerification';
import { Loader2, CheckCircle2, XCircle, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AuthCallback() {
  const {
    status,
    error,
    isLoading,
    resend,
    canResend,
  } = useVerification({
    autoVerify: true,
    redirectOnSuccess: '/signal',
  });

  /**
   * Render loading state (extracting or verifying)
   */
  const renderLoading = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
        <Loader2 className="h-16 w-16 animate-spin text-blue-500 relative" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {status === 'extracting' ? 'Reading verification link...' : 'Verifying your email...'}
        </h2>
        <p className="text-slate-400">
          {status === 'extracting' 
            ? 'Please wait while we process your verification link' 
            : 'This will only take a moment'}
        </p>
      </div>
    </div>
  );

  /**
   * Render success state
   */
  const renderSuccess = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
        <CheckCircle2 className="h-16 w-16 text-green-500 relative" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Email Verified! 🎉
        </h2>
        <p className="text-slate-400">
          Redirecting you to your dashboard...
        </p>
      </div>
      <div className="flex gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Redirecting in a moment...</span>
      </div>
    </div>
  );

  /**
   * Render already verified state
   */
  const renderAlreadyVerified = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
        <CheckCircle2 className="h-16 w-16 text-blue-500 relative" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Already Verified ✓
        </h2>
        <p className="text-slate-400">
          Your email is already verified. You're all set!
        </p>
      </div>
      <div className="flex gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Taking you to your dashboard...</span>
      </div>
    </div>
  );

  /**
   * Render error state
   */
  const renderError = () => {
    const isExpired = error?.code === 'expired_token';
    const isInvalid = error?.code === 'invalid_token';
    
    return (
      <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
          <XCircle className="h-16 w-16 text-red-500 relative" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isExpired && '⏰ Link Expired'}
            {isInvalid && '❌ Invalid Link'}
            {!isExpired && !isInvalid && 'Verification Failed'}
          </h2>
          <p className="text-slate-400 mb-4">
            {error?.userMessage || 'Something went wrong with the verification'}
          </p>
        </div>

        <Alert className={`${
          isExpired ? 'border-orange-500/50 bg-orange-900/20' : 'border-red-500/50 bg-red-900/20'
        } text-left`}>
          <AlertCircle className={`h-4 w-4 ${isExpired ? 'text-orange-400' : 'text-red-400'}`} />
          <AlertDescription className={isExpired ? 'text-orange-200' : 'text-red-200'}>
            <strong className="font-semibold">
              {error?.code === 'expired_token' && 'Link Expired: '}
              {error?.code === 'invalid_token' && 'Invalid Link: '}
              {error?.code === 'network_error' && 'Network Error: '}
              {error?.code === 'unknown_error' && 'Error: '}
            </strong>
            {isExpired && 'This verification link has expired for security. Request a new one below.'}
            {isInvalid && 'This link appears to be corrupted or already used.'}
            {error?.code === 'network_error' && 'Please check your internet connection.'}
            {error?.code === 'unknown_error' && error.message}
          </AlertDescription>
        </Alert>

        {error?.canRetry && (
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={resend}
              disabled={!canResend}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              {canResend ? 'Send New Verification Email' : 'Email Sent - Check Your Inbox'}
            </Button>
            
            <p className="text-xs text-slate-500">
              {canResend 
                ? 'We\'ll send a fresh verification link to your email'
                : 'Wait 60 seconds before requesting another email'}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => window.location.href = '/'}
          className="w-full border-slate-600 hover:bg-slate-800"
        >
          Return to Home
        </Button>
      </div>
    );
  };

  /**
   * Render idle state (no token found)
   */
  const renderIdle = () => (
    <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full" />
        <AlertCircle className="h-16 w-16 text-yellow-500 relative" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ⚠️ No Verification Link Found
        </h2>
        <p className="text-slate-400 mb-4">
          It looks like you accessed this page directly. Please click the verification link from your email.
        </p>
      </div>

      <Alert className="border-yellow-500/50 bg-yellow-900/20 text-left">
        <Mail className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-200">
          <strong className="font-semibold">Check your email:</strong> Look for a message from PipFactor with your verification link.
        </AlertDescription>
      </Alert>

      <div className="w-full space-y-3">
        <p className="text-sm text-slate-400">Didn't receive an email?</p>
        <ul className="text-xs text-slate-500 text-left space-y-2">
          <li>• Check your spam/junk folder</li>
          <li>• Make sure you entered the correct email</li>
          <li>• Wait a few minutes for delivery</li>
        </ul>
      </div>

      <Button
        variant="outline"
        onClick={() => window.location.href = '/'}
        className="w-full border-slate-600 hover:bg-slate-800"
      >
        Return to Home
      </Button>
    </div>
  );

  /**
   * Main render with responsive container
   */
  return (
    <div className="min-h-screen w-full mesh-gradient-seamless flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-md bg-slate-800/95 border-slate-700 backdrop-blur-lg shadow-2xl"
      >
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl text-white">
            Email Verification
          </CardTitle>
          <CardDescription className="text-slate-400">
            Secure verification in progress
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          {isLoading && renderLoading()}
          {status === 'success' && renderSuccess()}
          {status === 'already_verified' && renderAlreadyVerified()}
          {status === 'error' && renderError()}
          {status === 'idle' && renderIdle()}
        </CardContent>
      </Card>
    </div>
  );
}
