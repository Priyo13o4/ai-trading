import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { SignUpDialog } from './SignUpDialog';
import { TurnstileWidget } from './TurnstileWidget';

interface LoginDialogProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onSignupClick?: () => void;
  onSuccess?: () => void;
}

export function LoginDialog({ children, open: controlledOpen, setOpen: setControlledOpen, onSignupClick, onSuccess }: LoginDialogProps) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [fallbackSignupOpen, setFallbackSignupOpen] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const longWaitTimerRef = useRef<number | null>(null);
  const longWaitToastRef = useRef<string | number | null>(null);
  const turnstileEnabled = Boolean((import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim());

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

  const handleLogin = async (values: { email: string; password: string }) => {
    if (turnstileEnabled && !captchaToken) {
      setCaptchaError('Please complete the captcha challenge before logging in.');
      toast.error('Captcha is required before logging in.');
      return;
    }

    setLoading(true);
    clearLongWait();
    setCaptchaError(null);
    if (typeof window !== 'undefined') {
      longWaitTimerRef.current = window.setTimeout(() => {
        longWaitToastRef.current = toast.info('Still signing you in... thanks for your patience.');
      }, 5000);
    }
    try {
      const { error } = await signIn(values.email, values.password, captchaToken ?? undefined);

      if (error) {
        const msg = error.message || 'Login failed';
        const isCaptchaError = /captcha|turnstile|challenge/i.test(msg);
        if (isCaptchaError) {
          setCaptchaError('Captcha verification failed or expired. Please complete it again.');
          setCaptchaToken(null);
          setCaptchaResetSignal((prev) => prev + 1);
        }
        toast.error(error.message);
        form.setError('password', { message: error.message });
      } else {
        toast.success('Logged in successfully!');
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/signal');
        }
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast.error('Unable to log in right now. Please try again.');
    } finally {
      clearLongWait();
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-800/95 border-slate-600 text-white p-0 sm:rounded-xl overflow-hidden backdrop-blur-lg shadow-2xl shadow-black/50">
        <DialogTitle className="sr-only">Login</DialogTitle>
        <Card className="shadow-none border-0 bg-transparent text-white">
          <CardHeader className="pr-10">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="grid gap-4">
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
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
                    action="login"
                    onTokenChange={handleCaptchaTokenChange}
                    onExpired={handleCaptchaExpired}
                    onRenderError={handleCaptchaRenderError}
                    resetSignal={captchaResetSignal}
                  />
                </div>
                {captchaError && (
                  <p className="text-sm text-red-400" role="alert">
                    {captchaError}
                  </p>
                )}
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    variant={turnstileEnabled && !captchaToken ? 'outline' : 'hero'}
                    className={turnstileEnabled && !captchaToken ? 'opacity-70 cursor-not-allowed' : undefined}
                    disabled={loading || (turnstileEnabled && !captchaToken)}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </form>
            </Form>
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-200">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="underline text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  onClick={() => {
                    setOpen(false);
                    if (onSignupClick) {
                      setTimeout(() => onSignupClick(), 100);
                    } else {
                      setTimeout(() => setFallbackSignupOpen(true), 100);
                    }
                  }}
                >
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
      {!onSignupClick && (
        <SignUpDialog
          open={fallbackSignupOpen}
          setOpen={setFallbackSignupOpen}
          onLoginClick={() => {
            setFallbackSignupOpen(false);
            setTimeout(() => setOpen(true), 100);
          }}
        >
          <div />
        </SignUpDialog>
      )}
    </Dialog>
  );
}
