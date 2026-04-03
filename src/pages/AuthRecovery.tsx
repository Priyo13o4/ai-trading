import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { cleanUrlAfterVerification } from '@/utils/verification-utils';
import { useAuth } from '@/hooks/useAuth';
import { toSafeUserErrorMessage } from '@/services/api';

type RecoveryStatus = 'checking' | 'ready' | 'invalid' | 'success';

export default function AuthRecovery() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<number | null>(null);
  const { signOut } = useAuth();

  const [status, setStatus] = useState<RecoveryStatus>('checking');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    // Supabase emits an event when it successfully exchanges the URL hash tokens
    // for a recovery session. This is the safest way to guarantee we are actually
    // in it, instead of just checking getSession() which might trigger too early
    // or trigger on an already logged in user.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready');
        cleanUrlAfterVerification();
      } else if (!session && event === 'INITIAL_SESSION') {
        // If we load and there is no session, and no recovery token was parsed
        setStatus('invalid');
        cleanUrlAfterVerification();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(toSafeUserErrorMessage(error.message, undefined, 'Unable to update your password.'));
        return;
      }

      setStatus('success');
      toast.success('Password updated successfully. Please log in again.');

      await signOut({ global: true });

      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/', { replace: true });
      }, 1200);
    } catch (error) {
      console.error('Failed to update recovery password:', error);
      toast.error('Unable to update your password right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full mesh-gradient-seamless flex items-center justify-center p-4">
      <Card className="w-full max-w-md lumina-card border-[#C8935A]/20 text-[#E0E0E0] shadow-2xl shadow-black/50">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl text-white">Password Recovery</CardTitle>
          <CardDescription className="text-slate-400">
            Securely set a new password for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          {status === 'checking' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-slate-300">Validating your recovery link...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-400" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Invalid or Expired Link</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    This password recovery link is not valid anymore. Please request a new reset email.
                  </p>
                </div>
              </div>

              <Alert className="border-amber-500/50 bg-amber-900/20">
                <AlertDescription className="text-amber-200">
                  Go back to login, enter your email, and use Forgot password? to get a fresh recovery link.
                </AlertDescription>
              </Alert>

              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={() => navigate('/', { replace: true })}
              >
                Return to Home
              </Button>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-200">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter your new password"
                  className="bg-[#111315]/50 border-[#C8935A]/20 focus:border-[#C8935A]/50 text-[#E0E0E0] placeholder:text-[#9CA3AF]"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-200">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your new password"
                  className="bg-[#111315]/50 border-[#C8935A]/20 focus:border-[#C8935A]/50 text-[#E0E0E0] placeholder:text-[#9CA3AF]"
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" className="lumina-button w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <div>
                <h2 className="text-lg font-semibold text-white">Password Updated</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Your password has been reset successfully. Redirecting to login...
                </p>
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
