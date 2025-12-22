import { useState, useEffect, useRef } from 'react';
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
  const longWaitTimerRef = useRef<number | null>(null);
  const longWaitToastRef = useRef<string | number | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset();
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

  const handleSignUp = async (values: { fullName: string; email: string; password: string }) => {
    setLoading(true);
    clearLongWait();
    if (typeof window !== 'undefined') {
      longWaitTimerRef.current = window.setTimeout(() => {
        longWaitToastRef.current = toast.info('Still creating your account... almost there!');
      }, 5000);
    }
    try {
      const { data, error } = await signUp(values.email, values.password, values.fullName);

      if (error) {
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
      <DialogContent className="bg-slate-800/95 border-slate-600 text-white p-0 sm:rounded-xl overflow-hidden backdrop-blur-lg shadow-2xl shadow-black/50">
        <DialogTitle className="sr-only">Sign Up</DialogTitle>
        <Card className="shadow-none border-0 bg-transparent text-white">
          <CardHeader className="pr-10">
            <CardTitle className="text-2xl">Sign Up - it's free!</CardTitle>
            <CardDescription className="text-slate-400">
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
                          placeholder="Minimum 6 characters"
                          autoComplete="new-password"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create a free account'}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-200">
                Already have an account?{' '}
                <button
                  type="button"
                  className="underline text-blue-400 hover:text-blue-300 font-medium transition-colors"
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
