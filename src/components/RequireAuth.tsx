import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { SignUpDialog } from '@/components/auth/SignUpDialog';

/**
 * Usage: <RequireAuth><Button onClick={...}>Go to Signal</Button></RequireAuth>
 * If not authenticated, shows modal and only navigates after login.
 */
export function RequireAuth({ to, children }: { to: string, children: React.ReactNode }) {
  const { isAuthenticated, status, backendAvailable } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();
  const child = children as React.ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;

  const handleClick = (e: React.MouseEvent) => {
    child.props.onClick?.(e);
    if (e.defaultPrevented) return;

    if (!backendAvailable) {
      e.preventDefault();
      navigate('/maintenance');
      return;
    }

    if (!isAuthenticated && status !== 'loading') {
      e.preventDefault();
      setShowLogin(true);
    } else {
      e.preventDefault();
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
      {React.cloneElement(child, { onClick: handleClick })}
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