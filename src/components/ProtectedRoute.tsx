import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { SignUpDialog } from '@/components/auth/SignUpDialog';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Open login dialog as soon as not loading and not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      setShowLogin(true);
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginDialog
          open={showLogin}
          setOpen={setShowLogin}
          onSignupClick={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        >
          {/* Hidden trigger, dialog is controlled */}
          <button style={{ display: 'none' }} />
        </LoginDialog>
        <SignUpDialog
          open={showSignup}
          setOpen={setShowSignup}
          onLoginClick={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        >
          <button style={{ display: 'none' }} />
        </SignUpDialog>
      </>
    );
  }

  return <Outlet />;
};