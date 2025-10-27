import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import React, { useState } from 'react';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { SignUpDialog } from '@/components/auth/SignUpDialog';
import { LoadingScreen } from '@/components/ui/loading-screen';

export const ProtectedRoute = () => {
  const { isAuthenticated, status } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const isLoading = status === 'loading';

  // Open login dialog as soon as not loading and not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <LoadingScreen
        message="Checking your access"
        hint="Verifying your session before opening this area."
      />
    );
  }

  if (!isAuthenticated) {
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