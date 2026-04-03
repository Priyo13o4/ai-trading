/**
 * Verification Pending Screen
 * Shown after user signs up, waiting for email verification
 * Can be used as a standalone page or dialog
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceType } from '@/hooks/useDeviceType';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    <div className="circuit-bg sa-scope relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Background patterns and noise */}
      <div className="sa-noise-overlay absolute inset-0 pointer-events-none" />
      
      {/* Glow effect matching the cobalt brown theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#C8935A]/10 blur-[120px] pointer-events-none" />

      <Card 
        className={cn(
          'lumina-card mesh-card-bg relative z-10 w-full flex flex-col border-t-4 border-[#C8935A]/50 shadow-2xl transition-all duration-300',
          deviceInfo.isMobile ? 'max-w-sm' : 'max-w-md'
        )}
      >
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-[#C8935A]/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative bg-[#C8935A]/10 p-5 rounded-2xl border border-[#C8935A]/20 inline-block">
              <Mail className="h-10 w-10 text-[#E2B485]" />
            </div>
          </div>
          
          <CardTitle className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-slate-400 text-base mt-2">
            Verification link sent to
          </CardDescription>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#C8935A]/10 px-4 py-1 border border-[#C8935A]/20">
            <span className="text-[#E2B485] font-bold tracking-tight">
              {email}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-4">
          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.03] p-5 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E2B485] mb-2">Next Steps</p>
            <ol className="space-y-3">
              {[
                'Open your email inbox',
                'Look for an email from PipFactor',
                'Click the "Verify Email" button',
                "You'll be redirected back here"
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C8935A]/20 text-[10px] font-bold text-[#E2B485] border border-[#C8935A]/30">
                    {i + 1}
                  </div>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-3">
            <Button
              onClick={handleCheckNow}
              disabled={isChecking}
              className="lumina-button h-12 w-full font-bold text-base tracking-wide flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  I've Verified - Continue
                </>
              )}
            </Button>

            <Button
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              variant="outline"
              className="lumina-button-outline h-12 w-full border-white/10 text-slate-300 hover:bg-white/5 font-bold"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Link
                </>
              )}
            </Button>
          </div>

          <div className="text-center space-y-4 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-500 leading-relaxed">
              Didn't receive the email? Check your spam folder or junk mail.
            </p>
            <button 
              className="text-xs font-bold uppercase tracking-wider text-[#E2B485]/80 hover:text-[#E2B485] transition-colors"
              onClick={() => window.location.href = '/'}
            >
              Sign up with different email
            </button>
          </div>

          {import.meta.env.DEV && (
            <div className="pt-2 opacity-20 text-[10px] text-center text-slate-500 uppercase tracking-widest">
              Endpoint: {deviceInfo.type}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
