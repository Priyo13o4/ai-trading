/**
 * Auth Callback Page
 * Handles email verification for web (desktop + mobile browsers)
 * 
 * User clicks email link → Lands here → Auto-verifies → Redirects to /signal
 */

import type { CSSProperties } from 'react';
import { useVerification } from '@/hooks/useVerification';
import { Loader2, CheckCircle2, XCircle, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const plusPatternStyle: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Ctext x='12' y='40' font-size='26' fill='rgba(227,179,122,0.44)' font-family='monospace'%3E%2B%2B%2B%3C/text%3E%3Ctext x='68' y='96' font-size='22' fill='rgba(158,183,255,0.32)' font-family='monospace'%3E%2B%2B%2B%3C/text%3E%3C/svg%3E\")",
  backgroundSize: '140px 140px',
  backgroundPosition: '0 0',
};

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

  const tone = (() => {
    if (status === 'error') {
      if (error?.code === 'expired_token') {
        return {
          card: 'border-orange-400/45 shadow-orange-900/25',
          badge: 'border-orange-400/50 bg-orange-500/15 text-orange-200',
          glow: 'from-orange-500/30 via-orange-300/10 to-transparent',
          label: 'Link Issue',
        };
      }

      return {
        card: 'border-rose-400/45 shadow-rose-900/30',
        badge: 'border-rose-400/50 bg-rose-500/15 text-rose-200',
        glow: 'from-rose-500/30 via-rose-300/10 to-transparent',
        label: 'Verification Error',
      };
    }

    if (status === 'success' || status === 'already_verified') {
      return {
        card: 'border-[#C8935A]/50 shadow-[#C8935A]/25',
        badge: 'border-[#C8935A]/40 bg-[#C8935A]/10 text-[#E2B485]',
        glow: 'from-[#C8935A]/20 via-[#C8935A]/5 to-transparent',
        label: 'Verified',
      };
    }

    if (status === 'idle') {
      return {
        card: 'border-[#C8935A]/50 shadow-[#C8935A]/20',
        badge: 'border-[#C8935A]/40 bg-[#C8935A]/10 text-[#E2B485]',
        glow: 'from-[#C8935A]/20 via-[#C8935A]/5 to-transparent',
        label: 'Action Needed',
      };
    }

    return {
      card: 'border-[#C8935A]/40 shadow-[#C8935A]/15',
      badge: 'border-[#C8935A]/40 bg-[#C8935A]/10 text-[#E2B485]',
      glow: 'from-[#C8935A]/20 via-[#C8935A]/5 to-transparent',
      label: 'Processing',
    };
  })();

  /**
   * Render loading state (extracting or verifying)
   */
  const renderLoading = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-[#C8935A]/20 blur-2xl rounded-full" />
        <Loader2 className="h-16 w-16 animate-spin text-[#E2B485] relative" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-50 mb-2">
          {status === 'extracting' ? 'Reading verification link...' : 'Verifying your email...'}
        </h2>
        <p className="text-slate-300/80">
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
        <div className="absolute inset-0 bg-[#C8935A]/20 blur-2xl rounded-full animate-pulse" />
        <CheckCircle2 className="h-16 w-16 text-[#E2B485] relative" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-50 mb-2">
          Email Verified! 🎉
        </h2>
        <p className="text-slate-300/80">
          Redirecting you to your dashboard...
        </p>
      </div>
      <div className="flex gap-2 text-sm text-[#E2B485]/70">
        <Loader2 className="h-4 w-4 animate-spin text-[#E2B485]" />
        <span className="font-bold uppercase tracking-widest text-[10px]">Redirecting in a moment...</span>
      </div>
    </div>
  );

  /**
   * Render already verified state
   */
  const renderAlreadyVerified = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-[#C8935A]/20 blur-2xl rounded-full" />
        <CheckCircle2 className="h-16 w-16 text-[#E2B485] relative" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-50 mb-2">
          Already Verified <span className="text-[#E2B485]">✓</span>
        </h2>
        <p className="text-slate-300/80">
          Your email is already verified. You're all set!
        </p>
      </div>
      <div className="flex items-center gap-3 py-2 px-5 rounded-full bg-[#C8935A]/5 border border-[#C8935A]/20">
        <Loader2 className="h-4 w-4 animate-spin text-[#E2B485]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2B485]/80">Taking you to your dashboard...</span>
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
          <XCircle className="h-16 w-16 text-rose-400 relative" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-rose-100 mb-2">
            {isExpired && '⏰ Link Expired'}
            {isInvalid && '❌ Invalid Link'}
            {!isExpired && !isInvalid && 'Verification Failed'}
          </h2>
          <p className="text-rose-100/80 mb-4">
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
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              {canResend ? 'Send New Verification Email' : 'Email Sent - Check Your Inbox'}
            </Button>
            
            <p className="text-xs text-rose-100/60">
              {canResend 
                ? 'We\'ll send a fresh verification link to your email'
                : 'Wait 60 seconds before requesting another email'}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => window.location.href = '/'}
          className="w-full border-slate-500/70 hover:bg-slate-800/80"
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
        <div className="absolute inset-0 bg-[#C8935A]/20 blur-2xl rounded-full" />
        <AlertCircle className="h-16 w-16 text-[#E2B485] relative" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-slate-50 mb-2">
          Verification Link Needed
        </h2>
        <p className="text-slate-300/80 mb-4 text-sm leading-relaxed">
          It looks like you accessed this page directly. Please click the verification link from your email.
        </p>
      </div>
 
      <Alert className="border-[#C8935A]/30 bg-[#C8935A]/5 text-left">
        <Mail className="h-4 w-4 text-[#E2B485]" />
        <AlertDescription className="text-slate-300">
          <strong className="font-semibold text-[#E2B485]">Check your email:</strong> Look for a message from PipFactor with your verification link.
        </AlertDescription>
      </Alert>
 
      <div className="w-full space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E2B485]">Didn't receive an email?</p>
        <ul className="text-xs text-slate-400 text-left space-y-2 pl-2 border-l border-[#C8935A]/20">
          <li>• Check your spam/junk folder</li>
          <li>• Make sure you entered the correct email</li>
          <li>• Wait a few minutes for delivery</li>
        </ul>
      </div>
 
      <Button
        variant="outline"
        onClick={() => window.location.href = '/'}
        className="w-full border-[#C8935A]/30 text-[#E2B485] hover:bg-[#C8935A]/10 mt-4 h-12 font-bold"
      >
        Return to Home
      </Button>
    </div>
  );

  /**
   * Main render with responsive container
   */
  return (
    <div className="circuit-bg sa-scope relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Background patterns and noise */}
      <div className="sa-noise-overlay absolute inset-0 pointer-events-none" />
      
      {/* Dynamic glow effect based on status */}
      <div 
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 blur-[120px] pointer-events-none transition-colors duration-700",
          status === 'error' ? 'bg-rose-600/15' : 'bg-[#C8935A]/10'
        )} 
      />

      <Card 
        className={cn(
          'lumina-card mesh-card-bg relative z-10 w-full max-w-md flex flex-col border-t-4 shadow-2xl transition-all duration-300',
          status === 'error' ? 'border-rose-500/50 hover:shadow-rose-900/10' : 'border-[#C8935A]/50 hover:shadow-[#C8935A]/10'
        )}
      >
        <CardHeader className="text-center pb-2 px-5 sm:px-7">
          <div className="mb-4 flex justify-center">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors duration-300",
                status === 'error' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-[#C8935A]/40 bg-[#C8935A]/10 text-[#E2B485]'
              )}
            >
              {tone.label}
            </span>
          </div>

          <CardTitle className="text-3xl font-black tracking-tight text-slate-50">
            Email Verification
          </CardTitle>
          <CardDescription className="text-slate-300/80 mt-2">
            Professional access via secure protocols
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-10 px-5 sm:px-7 pt-4">
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
