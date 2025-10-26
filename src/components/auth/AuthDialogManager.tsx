import { useState } from 'react';
import { SignUpDialog } from './SignUpDialog';
import { LoginDialog } from './LoginDialog';
import { Button } from '@/components/ui/button';

interface AuthDialogManagerProps {
  trigger?: React.ReactNode;
  reason?: 'signals_access' | 'general';
  message?: string;
}

export function AuthDialogManager({ trigger, reason, message }: AuthDialogManagerProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const getReasonMessage = () => {
    if (message) return message;
    
    switch (reason) {
      case 'signals_access':
        return 'Login to access current trading signals for all pairs. XAUUSD, EURUSD, GBPUSD, AUDUSD - all free after login!';
      default:
        return 'Sign in to access live trading signals and market analysis.';
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
