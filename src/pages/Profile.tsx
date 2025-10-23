import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, User, Mail, Calendar, CreditCard, Shield, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  const handleCancelSubscription = async () => {
    // TODO: Implement Stripe subscription cancellation
    toast.info('Subscription management coming soon! Please contact support.');
  };

  const handleUpgradePlan = () => {
    // TODO: Navigate to pricing/checkout page
    toast.info('Upgrade functionality coming soon!');
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subscriptionTierColors = {
    free: 'bg-slate-500',
    premium: 'bg-blue-500',
    enterprise: 'bg-purple-500'
  };

  const subscriptionTierLabels = {
    free: 'Free',
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  return (
    <main className="relative min-h-screen w-full mesh-gradient-seamless text-slate-200 overflow-x-hidden">
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 sm:pt-32 sm:pb-20 max-w-4xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-slate-400">Manage your account and subscription</p>
        </div>

        <div className="space-y-6">
          {/* User Information Card */}
          <Card className="mesh-gradient-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input 
                    value={profile.full_name || 'Not set'} 
                    disabled 
                    className="bg-slate-800/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input 
                    value={profile.email || user.email || ''} 
                    disabled 
                    className="bg-slate-800/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </Label>
                  <Input 
                    value={new Date(profile.created_at).toLocaleDateString()} 
                    disabled 
                    className="bg-slate-800/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Account Status
                  </Label>
                  <Input 
                    value={profile.subscription_status === 'active' ? 'Active' : profile.subscription_status} 
                    disabled 
                    className="bg-slate-800/50 border-slate-700 text-white mt-1 capitalize"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="mesh-gradient-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="w-5 h-5" />
                Subscription Details
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your current plan and usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300 text-sm">Current Plan</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${subscriptionTierColors[profile.subscription_tier]} text-white`}>
                      {subscriptionTierLabels[profile.subscription_tier]}
                    </Badge>
                  </div>
                </div>
                {profile.subscription_tier === 'free' && (
                  <Button onClick={handleUpgradePlan} className="bg-blue-600 hover:bg-blue-700">
                    Upgrade Plan
                  </Button>
                )}
              </div>

              {profile.subscription_tier === 'free' && (
                <>
                  <Separator className="bg-slate-700" />
                  <div>
                    <Label className="text-slate-300 text-sm">Subscription Expiry</Label>
                    <div className="mt-2 space-y-2">
                      {profile.subscription_expires_at ? (
                        <p className="text-sm text-white">
                          Expires: {new Date(profile.subscription_expires_at).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Free plan - Upgrade to access premium features!
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {profile.subscription_tier !== 'free' && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toast.info('Change plan coming soon!')}>
                    Change Plan
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Cancel Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-800 border-slate-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                          Are you sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          This will cancel your subscription at the end of the current billing period. 
                          You'll still have access until then.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                          Keep Subscription
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancelSubscription}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="mesh-gradient-card border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button 
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="new-password" className="text-slate-300">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-slate-300">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Logout Section */}
          <Card className="mesh-gradient-card border-red-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Sign Out</h3>
                  <p className="text-sm text-slate-400">Sign out of your account on this device</p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
