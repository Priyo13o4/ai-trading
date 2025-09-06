import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { SignUpDialog } from '@/components/auth/SignUpDialog';

/**
 * Usage: <RequireAuth><Button onClick={...}>Go to Signal</Button></RequireAuth>
 * If not authenticated, shows modal and only navigates after login.
 */
export function RequireAuth({ to, children }: { to: string, children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    if (!user && !isLoading) {
      e.preventDefault();
      setShowLogin(true);
    } else {
      navigate(to);
    }
  };

  // After login, go to intended page
  const handleLoginSuccess = () => {
    setShowLogin(false);
    setShowSignup(false);
    navigate(to);
  };

  return (
    <>
      {React.cloneElement(children as React.ReactElement, { onClick: handleClick })}
      <LoginDialog
        open={showLogin}
        setOpen={setShowLogin}
        onSignupClick={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
        onSuccess={handleLoginSuccess}
      >
        <button style={{ display: 'none' }} />
      </LoginDialog>
      <SignUpDialog
        open={showSignup}
        setOpen={setShowSignup}
        onLoginClick={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
        onSuccess={handleLoginSuccess}
      >
        <button style={{ display: 'none' }} />
      </SignUpDialog>
    </>
  );
}