/**
 * Delete Account Dialog Component
 * Handles account deletion with OTP verification
 * User must verify via email OTP before permanent deletion
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Mail, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DeleteAccountDialogProps {
  userEmail: string;
}

export function DeleteAccountDialog({ userEmail }: DeleteAccountDialogProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'warning' | 'otp'>('warning');
  const [otp, setOtp] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [resendCooldownUntil, setResendCooldownUntil] = useState<number>(0);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const cooldownSecondsRemaining = useMemo(() => {
    if (resendCooldownUntil <= nowMs) {
      return 0;
    }
    return Math.ceil((resendCooldownUntil - nowMs) / 1000);
  }, [resendCooldownUntil, nowMs]);

  useEffect(() => {
    if (resendCooldownUntil <= Date.now()) {
      return;
    }

    const timer = window.setInterval(() => {
      const currentNow = Date.now();
      setNowMs(currentNow);

      if (currentNow >= resendCooldownUntil) {
        setResendCooldownUntil(0);
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldownUntil]);

  const handleRequestDeletion = async () => {
    if (cooldownSecondsRemaining > 0) {
      toast.error('Please wait before requesting again', {
        description: `You can request a new code in ${cooldownSecondsRemaining}s.`
      });
      return;
    }

    setIsRequesting(true);
    
    try {
      const { data, error } = await supabase
        .rpc('request_account_deletion');

      if (error) throw error;

      const isValidResponse = data && typeof data === 'object' && 'success' in data;
      if (!isValidResponse) {
        throw new Error('Invalid response from account deletion service.');
      }

      if (data.success) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(`OTP was generated, but auth session lookup failed: ${sessionError.message}`);
        }

        if (!session?.access_token) {
          throw new Error('OTP was generated, but your login session is missing. Please sign in again and retry.');
        }

        const { data: mailResponse, error: mailError } = await supabase.functions.invoke('account-deletion-mailer', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            event_type: 'account_deletion_otp',
          },
        });

        if (mailError) {
          let detailedMessage = mailError.message || 'unknown function error';
          const contextResponse = (mailError as { context?: Response }).context;
          if (contextResponse) {
            try {
              const contextBody = await contextResponse.clone().json();
              if (contextBody && typeof contextBody === 'object') {
                const stage =
                  'stage' in contextBody && typeof contextBody.stage === 'string'
                    ? contextBody.stage
                    : null;
                const errorText =
                  'error' in contextBody && typeof contextBody.error === 'string'
                    ? contextBody.error
                    : null;

                if (stage && errorText) {
                  detailedMessage = `[${stage}] ${errorText}`;
                } else if (errorText) {
                  detailedMessage = errorText;
                }
              }
            } catch {
              // Keep original mailError message when response body is unavailable.
            }
          }

          throw new Error(
            `OTP was generated, but email delivery failed: ${detailedMessage}`
          );
        }

        const isMailResponseValid =
          mailResponse && typeof mailResponse === 'object' && 'success' in mailResponse;
        if (!isMailResponseValid || !mailResponse.success) {
          const responseError =
            isMailResponseValid && 'error' in mailResponse && typeof mailResponse.error === 'string'
              ? mailResponse.error
              : 'unknown mailer response error';
          const responseStage =
            isMailResponseValid && 'stage' in mailResponse && typeof mailResponse.stage === 'string'
              ? mailResponse.stage
              : 'unknown_stage';
          throw new Error(`OTP was generated, but email delivery failed [${responseStage}]: ${responseError}`);
        }

        const cooldownMs = 60_000;
        const nextAllowedAt = Date.now() + cooldownMs;
        setResendCooldownUntil(nextAllowedAt);
        setNowMs(Date.now());

        toast.success('OTP Sent!', {
          description: `We've sent a verification code to ${userEmail}. Check your inbox.`,
          duration: 5000
        });
        setOtpSent(true);
        setStep('otp');
      } else {
        toast.error('Failed to send OTP', {
          description: data.error || 'Please try again later.'
        });
      }
    } catch (error: any) {
      console.error('Error requesting account deletion:', error);
      toast.error('Something went wrong', {
        description: error.message || 'Could not request account deletion.'
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const getSafeDeletionErrorMessage = (rawError?: string): string => {
    const normalized = (rawError || '').toLowerCase();

    if (normalized.includes('invalid or expired otp')) {
      return 'Invalid or expired OTP. Please request a new code.';
    }

    return 'Could not complete account deletion right now. Please try again shortly.';
  };

  const handleVerifyAndDelete = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Invalid OTP', {
        description: 'Please enter the 6-digit code sent to your email.'
      });
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase
        .rpc('verify_and_delete_account', {
          p_otp_code: otp
        });

      if (error) throw error;

      const isValidResponse = data && typeof data === 'object' && 'success' in data;

      if (!isValidResponse) {
        throw new Error('Invalid response from account deletion service.');
      }

      if (data.success) {
        // Clear local browser session + hit python backend logout endpoint
        await signOut({ global: true });

        toast.success('Account Deleted', {
          description: 'Your account and all associated data have been permanently deleted.',
          duration: 5000
        });

        // Redirect to homepage after delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      } else {
        const rawError = typeof data.error === 'string' ? data.error : '';
        console.error('Account deletion RPC failure:', rawError);
        toast.error('Verification Failed', {
          description: getSafeDeletionErrorMessage(rawError)
        });
      }
    } catch (error: any) {
      console.error('Error verifying deletion:', error);
      toast.error('Deletion Failed', {
        description: getSafeDeletionErrorMessage(error?.message)
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep('warning');
    setOtp('');
    setOtpSent(false);
    setDeleteConfirmation('');
    setResendCooldownUntil(0);
    setNowMs(Date.now());
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="lumina-card max-w-md border border-white/10 p-0 text-slate-100 shadow-2xl">
        <div className="p-6">
        {step === 'warning' ? (
          <>
            <AlertDialogHeader>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl font-bold text-white">Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This action is permanent and irreversible
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            <Alert variant="destructive" className="border-rose-500/20 bg-rose-500/5">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <AlertTitle className="text-rose-200">Warning: Permanent Data Loss</AlertTitle>
              <AlertDescription className="mt-2 space-y-2 text-sm text-rose-100/80">
                <p className="font-semibold text-rose-200">The following will be permanently erased:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your profile and account information</li>
                  <li>All active and past subscriptions</li>
                  <li>Payment history and billing records</li>
                  <li>Trading pair selections and preferences</li>
                  <li>All associated meta-data</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="flex gap-4">
                <Mail className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-slate-200">Verification Required</p>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    A code will be sent to <span className="font-medium text-white">{userEmail}</span> to authorize this deletion request.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="delete-confirm" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Type <span className="font-bold text-rose-500">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 focus:ring-1 focus:ring-rose-500 outline-none placeholder:text-slate-600"
                autoComplete="off"
              />
            </div>

            <AlertDialogFooter className="mt-6 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRequestDeletion}
                disabled={isRequesting || deleteConfirmation !== 'DELETE' || cooldownSecondsRemaining > 0}
                className="bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 min-w-[200px]"
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : cooldownSecondsRemaining > 0 ? (
                  `Wait ${cooldownSecondsRemaining}s`
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                  <Mail className="h-6 w-6 text-[#E2B485]" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl font-bold text-white">Verify Your Email</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    A security code was sent to {userEmail}
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <Alert className="border-white/5 bg-white/5">
                <Shield className="h-4 w-4 text-[#E2B485]" />
                <AlertDescription className="text-slate-400">
                  Code expires in 10 minutes. If you don&apos;t see it, please check your spam folder.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-3xl tracking-[0.5em] font-mono text-[#E2B485] focus:ring-1 focus:ring-[#E2B485] outline-none"
                  autoFocus
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestDeletion}
                disabled={isRequesting || cooldownSecondsRemaining > 0}
                className="text-xs text-[#E2B485] hover:text-[#E2B485]/80 hover:bg-transparent p-0 h-auto font-normal"
              >
                {isRequesting
                  ? 'Requesting new code...'
                  : cooldownSecondsRemaining > 0
                    ? `Resend code in ${cooldownSecondsRemaining}s`
                    : 'Haven&apos;t received a code? Resend'}
              </Button>
            </div>
            <AlertDialogFooter className="mt-6 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleVerifyAndDelete}
                disabled={isVerifying || otp.length !== 6}
                className="bg-rose-600 text-white hover:bg-rose-700 min-w-[200px]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizing Deletion...
                  </>
                ) : (
                  'Confirm Account Deletion'
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
