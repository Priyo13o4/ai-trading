/**
 * Delete Account Dialog Component
 * Handles account deletion with OTP verification
 * User must verify via email OTP before permanent deletion
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DeleteAccountDialogProps {
  userEmail: string;
}

export function DeleteAccountDialog({ userEmail }: DeleteAccountDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'warning' | 'otp'>('warning');
  const [otp, setOtp] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleRequestDeletion = async () => {
    setIsRequesting(true);
    
    try {
      const { data, error } = await supabase
        .rpc('request_account_deletion');

      if (error) throw error;

      if (data.success) {
        toast.success('OTP Sent!', {
          description: `We've sent a verification code to ${userEmail}. Check your inbox.`,
          duration: 5000
        });
        setOtpSent(true);
        setStep('otp');
      } else {
        toast.error('Failed to send OTP', {
          description: data.error || 'Please try again later.'
        });
      }
    } catch (error: any) {
      console.error('Error requesting account deletion:', error);
      toast.error('Something went wrong', {
        description: error.message || 'Could not request account deletion.'
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerifyAndDelete = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Invalid OTP', {
        description: 'Please enter the 6-digit code sent to your email.'
      });
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase
        .rpc('verify_and_delete_account', {
          p_otp_code: otp
        });

      if (error) throw error;

      if (data.success) {
        // Account data deleted from database
        // Now delete the auth user
        const { error: authError } = await supabase.auth.admin.deleteUser(
          (await supabase.auth.getUser()).data.user?.id || ''
        );

        if (authError) {
          console.error('Auth user deletion failed:', authError);
          // Database data is already deleted, just sign out
        }

        // Sign out user
        await supabase.auth.signOut();

        toast.success('Account Deleted', {
          description: 'Your account and all associated data have been permanently deleted.',
          duration: 5000
        });

        // Redirect to homepage after delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      } else {
        toast.error('Verification Failed', {
          description: data.error || 'Invalid or expired OTP. Please try again.'
        });
      }
    } catch (error: any) {
      console.error('Error verifying deletion:', error);
      toast.error('Deletion Failed', {
        description: error.message || 'Could not verify OTP. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep('warning');
    setOtp('');
    setOtpSent(false);
    setDeleteConfirmation('');
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-800/95 border-slate-600 text-white backdrop-blur-lg shadow-2xl shadow-black/50 max-w-md">
        {step === 'warning' ? (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-300" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl text-white">Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This action cannot be undone
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            <Alert variant="destructive" className="border-amber-500/25 bg-amber-950/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-amber-200">Warning: Permanent Data Loss</AlertTitle>
              <AlertDescription className="mt-2 space-y-2 text-sm text-amber-100">
                <p className="font-semibold">The following will be permanently deleted:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your profile and account information</li>
                  <li>All active and past subscriptions</li>
                  <li>Payment history and billing records</li>
                  <li>Trading pair selections and preferences</li>
                  <li>All associated data</li>
                </ul>
                <p className="font-semibold mt-3 text-amber-200">
                  This action is irreversible. You will not be able to recover your account.
                </p>
              </AlertDescription>
            </Alert>

            <div className="bg-slate-900/50 border border-slate-700/60 rounded-lg p-4">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-slate-200">Email Verification Required</p>
                  <p className="text-slate-300 mt-1">
                    We'll send a one-time password (OTP) to <span className="font-medium text-white">{userEmail}</span> to verify this deletion request.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-sm text-slate-300">
                Type <span className="font-mono font-bold text-amber-300">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                autoComplete="off"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose} className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleRequestDeletion}
                disabled={isRequesting || deleteConfirmation !== 'DELETE'}
                className="bg-rose-800/80 hover:bg-rose-800"
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-slate-800/60 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl text-white">Verify Your Email</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Enter the 6-digit code sent to {userEmail}
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <Alert className="border-slate-700/60 bg-slate-900/50">
                <AlertTriangle className="h-4 w-4 text-slate-300" />
                <AlertDescription className="text-slate-300">
                  The OTP is valid for 10 minutes. Check your spam folder if you don't see it.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-300">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono bg-slate-900/50 border-slate-600 text-white"
                  autoFocus
                />
              </div>

              <Button
                variant="link"
                size="sm"
                onClick={handleRequestDeletion}
                disabled={isRequesting}
                className="text-xs text-amber-300 hover:text-amber-200"
              >
                {isRequesting ? 'Resending...' : 'Didn\'t receive the code? Resend'}
              </Button>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose} className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleVerifyAndDelete}
                disabled={isVerifying || otp.length !== 6}
                className="bg-rose-800/80 hover:bg-rose-800"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  'Verify & Delete Account'
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
