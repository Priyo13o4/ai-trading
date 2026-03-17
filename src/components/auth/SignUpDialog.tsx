import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { TurnstileWidget } from './TurnstileWidget';
import { isTurnstileEnabled } from '@/config/turnstile';

interface SignUpDialogProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onLoginClick?: () => void;
  onSuccess?: () => void;
}

export function SignUpDialog({ children, open: controlledOpen, setOpen: setControlledOpen, onLoginClick, onSuccess }: SignUpDialogProps) {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const form = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const longWaitTimerRef = useRef<number | null>(null);
  const longWaitToastRef = useRef<string | number | null>(null);
  const turnstileEnabled = isTurnstileEnabled();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setCaptchaToken(null);
      setCaptchaError(null);
      setCaptchaResetSignal((prev) => prev + 1);
    }
  }, [open, form]);

  const clearLongWait = () => {
    if (longWaitTimerRef.current !== null) {
      window.clearTimeout(longWaitTimerRef.current);
      longWaitTimerRef.current = null;
    }
    if (longWaitToastRef.current !== null) {
      toast.dismiss(longWaitToastRef.current);
      longWaitToastRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearLongWait();
    };
  }, []);

  const handleCaptchaTokenChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      setCaptchaError(null);
    }
  }, []);

  const handleCaptchaExpired = useCallback(() => {
    setCaptchaError('Captcha expired. Please verify again.');
  }, []);

  const handleCaptchaRenderError = useCallback((message: string) => {
    setCaptchaError(message);
  }, []);

  const handleSignUp = async (values: { fullName: string; email: string; password: string }) => {
    if (turnstileEnabled && !captchaToken) {
      setCaptchaError('Please complete the captcha challenge before signing up.');
      toast.error('Captcha is required before creating an account.');
      return;
    }

    setLoading(true);
    clearLongWait();
    setCaptchaError(null);
    if (typeof window !== 'undefined') {
      longWaitTimerRef.current = window.setTimeout(() => {
        longWaitToastRef.current = toast.info('Still creating your account... almost there!');
      }, 5000);
    }
    try {
      const { data, error } = await signUp(
        values.email,
        values.password,
        values.fullName,
        captchaToken ?? undefined
      );

      if (error) {
        const msg = error.message || 'Signup failed';
        const isCaptchaError = /captcha|turnstile|challenge/i.test(msg);
        if (isCaptchaError) {
          setCaptchaError('Captcha verification failed or expired. Please complete it again.');
          setCaptchaToken(null);
          setCaptchaResetSignal((prev) => prev + 1);
        }
        toast.error(error.message);
        form.setError('password', { message: error.message });
      } else {
        // Check if email confirmation is required
        const needsEmailConfirmation = !data?.session || !data.user?.email_confirmed_at;

        if (needsEmailConfirmation) {
          toast.success('Account created! Please check your email to verify.', {
            description: `We sent a verification link to ${values.email}`,
            duration: 6000,
          });
          setOpen(false);
        } else {
          // Email already verified (e.g., auto-confirm in development)
          toast.success('Account created! Welcome to PipFactor.');
          setOpen(false);
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/signal');
          }
        }
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      toast.error('Unable to sign up right now. Please try again.');
    } finally {
      clearLongWait();
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="lumina-card border-[#C8935A]/20 text-white p-0 sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50">
        <DialogTitle className="sr-only">Sign Up</DialogTitle>
        <Card className="shadow-none border-0 bg-transparent text-white">
          <CardHeader className="pr-10">
            <CardTitle className="text-2xl text-[#E0E0E0]">Sign Up - it's free!</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Beta access includes every feature at no cost while we build together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignUp)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  rules={{ required: 'Full name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          autoComplete="name"
                          className="bg-[#111315]/50 border-[#C8935A]/20 focus:border-[#C8935A]/50 text-[#E0E0E0] placeholder:text-[#9CA3AF]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  rules={{ required: 'Email is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          autoComplete="email"
                          className="bg-[#111315]/50 border-[#C8935A]/20 focus:border-[#C8935A]/50 text-[#E0E0E0] placeholder:text-[#9CA3AF]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  rules={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Minimum 6 characters"
                          autoComplete="new-password"
                          className="bg-[#111315]/50 border-[#C8935A]/20 focus:border-[#C8935A]/50 text-[#E0E0E0] placeholder:text-[#9CA3AF]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-center">
                  <TurnstileWidget
                    enabled={open && turnstileEnabled}
                    action="signup"
                    onTokenChange={handleCaptchaTokenChange}
                    onExpired={handleCaptchaExpired}
                    onRenderError={handleCaptchaRenderError}
                    resetSignal={captchaResetSignal}
                  />
                </div>
                {captchaError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription>{captchaError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className={`lumina-button w-full ${turnstileEnabled && !captchaToken ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={loading || (turnstileEnabled && !captchaToken)}
                  >
                    {loading ? 'Creating Account...' : 'Create a free account'}
                  </Button>
                </div>
              </form>
            </Form>
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-200">
                Already have an account?{' '}
                <button
                  type="button"
                  className="underline text-[#E2B485] hover:text-[#C8935A] font-medium transition-colors"
                  onClick={() => {
                    if (onLoginClick) {
                      setOpen(false);
                      setTimeout(() => onLoginClick(), 100);
                    }
                  }}
                >
                  Login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
