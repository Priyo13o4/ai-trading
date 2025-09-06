import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password, fullName);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created! Please check your email to confirm your account.');
        }
      } else {
        const { data, error } = await signIn(email, password);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Signed in successfully!');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-slate-400 mt-2">
          {mode === 'login' 
            ? 'Welcome back to PipFactor' 
            : 'Get access to premium trading signals'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <Label htmlFor="fullName" className="text-slate-200">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>
        )}

        <div>
          <Label htmlFor="email" className="text-slate-200">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="bg-slate-800 border-slate-700 text-white"
            required
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-slate-200">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="bg-slate-800 border-slate-700 text-white"
            minLength={6}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading 
            ? (mode === 'login' ? 'Signing In...' : 'Creating Account...') 
            : (mode === 'login' ? 'Sign In' : 'Create Account')
          }
        </Button>
      </form>

      <div className="text-center">
        <p className="text-slate-400">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {mode === 'login' && (
        <div className="text-center">
          <p className="text-xs text-slate-500">
            XAUUSD signals are free • Premium pairs require an account
          </p>
        </div>
      )}
    </div>
  );
}
