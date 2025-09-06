import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

interface LoginDialogProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onSignupClick?: () => void;
  onSuccess?: () => void;
}

export function LoginDialog({ children, open: controlledOpen, setOpen: setControlledOpen, onSignupClick, onSuccess }: LoginDialogProps) {
  const navigate = useNavigate();
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

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) {
      toast.error(error.message);
      form.setError('password', { message: error.message });
    } else {
      toast.success('Logged in successfully!');
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/signals');
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-800/95 border-slate-600 text-white p-0 sm:rounded-xl overflow-hidden backdrop-blur-lg shadow-2xl shadow-black/50">
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          autoComplete="email"
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
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
                    onSignupClick && onSignupClick();
                  }}
                >
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
        <DialogClose
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors"
          aria-label="Close login dialog"
        >
          ×
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
