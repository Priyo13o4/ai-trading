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

interface SignUpDialogProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onLoginClick?: () => void;
  onSuccess?: () => void;
}

export function SignUpDialog({ children, open: controlledOpen, setOpen: setControlledOpen, onLoginClick, onSuccess }: SignUpDialogProps) {
  const navigate = useNavigate();
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

  const handleSignUp = async (values: { fullName: string; email: string; password: string }) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
        },
      },
    });
    if (error) {
      toast.error(error.message);
      form.setError('password', { message: error.message });
    } else {
      toast.success('Account created! Please check your email to verify.');
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
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription className="text-slate-400">
              Create an account to get started
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
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          autoComplete="name"
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
                          placeholder="Minimum 6 characters"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create an account'}
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
                    setOpen(false);
                    onLoginClick && onLoginClick();
                  }}
                >
                  Login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
        <DialogClose
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors"
          aria-label="Close signup dialog"
        >
          ×
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
