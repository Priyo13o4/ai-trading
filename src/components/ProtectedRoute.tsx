import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { SignUpDialog } from '@/components/auth/SignUpDialog';
import { LoadingScreen } from '@/components/ui/loading-screen';
import Maintenance from '@/pages/Maintenance';

export const ProtectedRoute = () => {
  const { isAuthenticated, authResolved, backendAvailable, backendError } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Open login dialog as soon as not loading and not authenticated
  useEffect(() => {
    if (!backendAvailable) {
      setShowLogin(false);
      setShowSignup(false);
      return;
    }

    if (authResolved && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [authResolved, backendAvailable, isAuthenticated]);

  if (!authResolved) {
    return (
      <LoadingScreen
        message="Checking your access"
        hint="Verifying your session before opening this area."
      />
    );
  }

  if (!backendAvailable) {
    return <Maintenance errorCode={backendError?.status} />;
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