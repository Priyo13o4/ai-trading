import { useState } from 'react';
import { SignUpDialog } from './SignUpDialog';
import { LoginDialog } from './LoginDialog';
import { Button } from '@/components/ui/button';

interface AuthDialogManagerProps {
  trigger?: React.ReactNode;
  reason?: 'pair_access' | 'rate_limit' | 'general';
  restrictedPair?: string;
}

export function AuthDialogManager({ trigger, reason, restrictedPair }: AuthDialogManagerProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const getReasonMessage = () => {
    switch (reason) {
      case 'pair_access':
        return `Access to ${restrictedPair} requires an account. XAUUSD is always free!`;
      case 'rate_limit':
        return 'You\'ve reached your free signal limit. Sign up for unlimited access!';
      default:
        return 'Sign in to access premium trading pairs and features.';
    }
  };

  const defaultTrigger = (
    <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
      Sign In
    </Button>
  );

  return (
    <>
      <LoginDialog
        open={showLogin}
        setOpen={setShowLogin}
        onSignupClick={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
        onSuccess={() => {
          setShowLogin(false);
          // Optionally refresh the page or trigger a data refresh
          window.location.reload();
        }}
      >
        {trigger || defaultTrigger}
      </LoginDialog>

      <SignUpDialog
        open={showSignup}
        setOpen={setShowSignup}
        onLoginClick={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
        onSuccess={() => {
          setShowSignup(false);
          // Optionally refresh the page or trigger a data refresh
          window.location.reload();
        }}
      >
        <div /> {/* This won't be rendered since we control open/setOpen */}
      </SignUpDialog>

      {reason && (
        <div className="text-sm text-slate-400 mt-2 text-center">
          {getReasonMessage()}
        </div>
      )}
    </>
  );
}
