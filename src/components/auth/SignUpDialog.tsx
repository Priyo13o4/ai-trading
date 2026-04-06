import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { TurnstileWidget } from './TurnstileWidget';
import { isTurnstileEnabled } from '@/config/turnstile';
import { normalizeReferralCode, getStoredReferralCode } from '@/lib/referral';
import { toSafeUserErrorMessage } from '@/services/api';

const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'ymail.com', 'rocketmail.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'pm.me', 'tutanota.com',
  'aol.com', 'zoho.com'
];

const isEmailAllowed = (email: string) => {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase().trim();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

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
      confirmPassword: '',
      referralCode: '',
      agreeToTerms: false,
    },
  });
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setCaptchaToken(null);
    setCaptchaError('Captcha expired. Please verify again.');
  }, []);

  const handleCaptchaRenderError = useCallback((message: string) => {
    setCaptchaToken(null);
    setCaptchaError(message);
  }, []);

  const handleSignUp = async (values: { fullName: string; email: string; password: string; confirmPassword: string; referralCode: string; agreeToTerms: boolean }) => {
    if (values.password !== values.confirmPassword) {
      form.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }

    if (!values.agreeToTerms) {
      form.setError('agreeToTerms', { message: 'You must agree to the Privacy Policy and Terms of Service' });
      return;
    }

    if (turnstileEnabled && !captchaToken) {
      setCaptchaError('Please complete the captcha challenge before signing up.');
      toast.error('Captcha is required before creating an account.');
      return;
    }

    if (!isEmailAllowed(values.email)) {
      form.setError('email', { message: 'Please use a supported email provider (e.g., Gmail, Outlook).' });
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
      // Explicit referral code wins over URL-captured code
      const explicitCode = normalizeReferralCode(values.referralCode);
      const urlCode = getStoredReferralCode();
      const finalReferralCode = explicitCode || urlCode;

      const { data, error } = await signUp(
        values.email,
        values.password,
        values.fullName,
        captchaToken ?? undefined,
        finalReferralCode ?? undefined
      );

      if (error) {
        const msg = error.message || 'Signup failed';
        let safeMsg = toSafeUserErrorMessage(msg);
        
        // Normalize annoying Supabase password policy messages
        if (/password.*(character|lower|upper|digit|alphanumeric)/i.test(msg)) {
            safeMsg = 'Password must contain at least one letter and one number.';
        }

        const isCaptchaError = /captcha|turnstile|challenge/i.test(msg);
        const isEmailProviderError = /supported email provider|temporary|disposable|permanent email/i.test(msg);

        if (isEmailProviderError) {
          form.setError('email', { message: 'Please use a supported email provider (e.g., Gmail, Outlook).' });
        }

        if (isCaptchaError) {
          setCaptchaError('Captcha verification failed or expired. Please complete it again.');
          setCaptchaToken(null);
          setCaptchaResetSignal((prev) => prev + 1);
        }

        if (!isEmailProviderError) {
          toast.error(safeMsg);
          form.setError('password', { message: safeMsg });
        }
      } else if (data?.user?.identities && data.user.identities.length === 0) {
        toast.error('An account with this email address already exists.');
        form.setError('email', { message: 'Email already registered. Please log in.' });
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
      <DialogContent className="lumina-card border-t-4 border-[#C8935A] hover:border-[#725433] transition-colors duration-300 text-white p-0 sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50">
        <DialogTitle className="sr-only">Sign Up</DialogTitle>
        <DialogDescription className="sr-only">
          Sign up form to create a new PipFactor account.
        </DialogDescription>
        <Card className="shadow-none border-0 bg-transparent text-white">
          <CardHeader className="pr-10">
            <CardTitle className="text-2xl text-[#E0E0E0]">Create your account</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Try everything free for 7 days — no payment upfront
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
                          placeholder=""
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
                          onChange={(e) => {
                            field.onChange(e);
                            form.clearErrors('email');
                          }}
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
                      <FormLabel className="text-slate-200">Create a password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                            className="bg-[#111315]/50 border-[#C8935A]/20 focus:border-[#C8935A]/50 text-[#E0E0E0] placeholder:text-[#9CA3AF] pr-10"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (form.getValues('confirmPassword') && form.getValues('confirmPassword') !== e.target.value) {
                                form.setError('confirmPassword', { message: 'Passwords do not match' });
                              } else {
                                form.clearErrors('confirmPassword');
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  rules={{ required: 'Please confirm your password' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Confirm your password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder=""
                            autoComplete="new-password"
                            className="bg-[#111315]/50 border-[#C8935A]/20 focus:border-[#C8935A]/50 text-[#E0E0E0] placeholder:text-[#9CA3AF] pr-10"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (form.getValues('password') !== e.target.value) {
                                form.setError('confirmPassword', { message: 'Passwords do not match' });
                              } else {
                                form.clearErrors('confirmPassword');
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => {
                    const normalizedValue = field.value ? normalizeReferralCode(field.value) || field.value.toUpperCase() : '';
                    const isValid = !normalizedValue || /^[A-Z0-9]{6,20}$/.test(normalizedValue);
                    
                    return (
                      <FormItem>
                        <FormLabel className="text-slate-200">Referral code (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Referral code (optional)"
                            autoComplete="off"
                            maxLength={20}
                            className={`bg-[#111315]/50 border-[#C8935A]/20 focus:border-[#C8935A]/50 text-[#E0E0E0] placeholder:text-[#9CA3AF] uppercase ${
                              !isValid ? 'border-rose-500/50 focus:border-rose-500/50' : ''
                            }`}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        {!isValid && (
                          <p className="text-xs text-rose-400">Must be 6-20 alphanumeric characters</p>
                        )}
                        {field.value && isValid && (
                          <p className="text-xs text-emerald-400">✓ Valid referral code</p>
                        )}
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  rules={{ required: 'You must agree to the Privacy Policy and Terms of Service' }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center justify-center space-y-3 rounded-md py-4">
                      <div className="flex items-center space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-[#C8935A]/50 data-[state=checked]:bg-[#C8935A] data-[state=checked]:text-[#111315]"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-slate-300">
                          I agree to the <a href="#" className="underline hover:text-[#C8935A] transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="#" className="underline hover:text-[#C8935A] transition-colors" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                        </FormLabel>
                      </div>
                      <FormMessage className="text-xs text-center" />
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
                    {loading ? 'Creating Account...' : 'Create account'}
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
                  Log in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
