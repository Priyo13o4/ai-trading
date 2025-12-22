/**
 * Verification Pending Screen
 * Shown after user signs up, waiting for email verification
 * Can be used as a standalone page or dialog
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceType } from '@/hooks/useDeviceType';
import { Mail, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface VerificationPendingProps {
  email?: string;
  onContinue?: () => void;
  onResend?: () => void;
}

export function VerificationPending({ 
  email: propEmail, 
  onContinue,
  onResend: onResendCallback 
}: VerificationPendingProps) {
  const { user } = useAuth();
  const deviceInfo = useDeviceType();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const email = propEmail || user?.email || 'your email';

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-check verification status every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        toast.success('Email verified! Redirecting...');
        if (onContinue) {
          onContinue();
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [onContinue]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || email,
      });

      if (error) throw error;

      toast.success('Verification email sent! Check your inbox.');
      setResendCooldown(60); // 60 second cooldown
      
      if (onResendCallback) {
        onResendCallback();
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckNow = async () => {
    setIsChecking(true);
    try {
      // Refresh session to get latest verification status
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) throw error;

      if (session?.user?.email_confirmed_at) {
        toast.success('Email verified! ✓');
        if (onContinue) {
          setTimeout(() => onContinue(), 1000);
        }
      } else {
        toast.info('Email not verified yet. Please check your inbox.');
      }
    } catch (error) {
      console.error('Check error:', error);
      toast.error('Failed to check verification status.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full mesh-gradient-seamless flex items-center justify-center p-4">
      <Card 
        className={`
          w-full
          ${deviceInfo.isMobile ? 'max-w-sm' : 'max-w-md'}
          bg-slate-800/95 
          border-slate-700 
          backdrop-blur-lg 
          shadow-2xl
        `}
      >
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative bg-blue-500/10 p-4 rounded-full inline-block">
              <Mail className="h-12 w-12 text-blue-400" />
            </div>
          </div>
          
          <CardTitle className="text-2xl text-white">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-slate-400 text-base">
            We've sent a verification link to
          </CardDescription>
          <p className="text-blue-400 font-medium mt-1">
            {email}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <Alert className="border-blue-500/30 bg-blue-500/10">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              <strong className="font-semibold">Next steps:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Open your email inbox</li>
                <li>Look for an email from PipFactor</li>
                <li>Click the "Verify Email" button</li>
                <li>You'll be redirected back here</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckNow}
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  I've Verified - Continue
                </>
              )}
            </Button>

            <Button
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-700"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-500">
              Didn't receive the email? Check your spam folder.
            </p>
            <p className="text-xs text-slate-500">
              Email sent to the wrong address?{' '}
              <button 
                className="text-blue-400 hover:text-blue-300 underline"
                onClick={() => window.location.href = '/'}
              >
                Sign up again
              </button>
            </p>
          </div>

          {/* Platform indicator */}
          {import.meta.env.DEV && (
            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-600 text-center">
                Platform: {deviceInfo.type}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
