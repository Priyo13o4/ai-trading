import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/signals" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <AuthForm
          mode={mode}
          onToggleMode={() => setMode(mode === 'login' ? 'signup' : 'login')}
        />
      </div>
    </main>
  );
}
