import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  CreditCard,
  Loader2,
  LogOut,
  Mail,
  Shield,
  User,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Separator } from '@/components/ui/separator';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { getPlanTier, normalizePlanName } from '@/components/subscription/planCatalog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const subscriptionStatusLabels: Record<string, string> = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export default function Profile() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    subscription,
    subscriptionTier,
    subscriptionStatus,
    signOut,
    updateProfile,
    updateEmail,
    authResolved,
    profileError,
    refreshProfile,
  } = useAuth();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [profileLoadTakingLong, setProfileLoadTakingLong] = useState(false);

  useEffect(() => {
    if (authResolved && !user) navigate('/');
  }, [authResolved, user, navigate]);

  useEffect(() => {
    if (!authResolved || profile || profileError) {
      setProfileLoadTakingLong(false);
      return;
    }
    const timer = window.setTimeout(() => setProfileLoadTakingLong(true), 8000);
    return () => window.clearTimeout(timer);
  }, [authResolved, profile, profileError]);

  if (!authResolved) {
    return (
      <LoadingScreen
        message="Getting your profile ready..."
        hint="Fetching your latest account details from Supabase."
      />
    );
  }

  if (!user) {
    return (
      <LoadingScreen
        message="Redirecting..."
        meshBackground={false}
        hint="No active session found. Sending you to the homepage."
      />
    );
  }

  if (!profile && !profileError) {
    return (
      <LoadingScreen
        message="Loading your profile"
        hint={
          profileLoadTakingLong
            ? 'This is taking longer than expected. Please refresh if needed.'
            : 'This may take a few seconds.'
        }
      />
    );
  }

  if (!profile && profileError) {
    return (
      <LoadingScreen message="We could not load your profile" hint={profileError}>
        <Button variant="secondary" onClick={refreshProfile} className="sa-btn-neutral">
          Try again
        </Button>
      </LoadingScreen>
    );
  }

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      if (editedName && editedName !== profile?.full_name) {
        await updateProfile(editedName);
        toast.success('Name updated successfully');
      }
      if (editedEmail && editedEmail !== profile?.email) {
        await updateEmail(editedEmail);
        toast.success('Email update started. Check your inbox to confirm.');
      }
      setIsEditingProfile(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingProfile = () => {
    setEditedName(profile?.full_name || '');
    setEditedEmail(profile?.email || user.email || '');
    setIsEditingProfile(true);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) navigate('/');
  };

  const handleCancelSubscription = () => {
    toast.info('Subscription management will be available soon.');
  };

  const handleUpgradePlan = () => {
    navigate('/pricing');
  };

  const normalizedTier = normalizePlanName(subscriptionTier);
  const tier = getPlanTier(normalizedTier);
  const displayedPlanName = tier.displayName;

  return (
    <main className="sa-scope sa-page">
      <div className="sa-container mx-auto max-w-5xl px-4 pb-16 pt-24 sm:pt-32">
        <Button variant="ghost" onClick={() => navigate(-1)} className="sa-btn-ghost mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <header className="mb-8">
          <h1 className="text-4xl font-display font-bold sa-heading sm:text-5xl">Profile Settings</h1>
          <p className="mt-2 sa-muted">Manage account details, subscription access, and security.</p>
        </header>

        <div className="space-y-6">
          <Card className="sa-card">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <User className="h-5 w-5 sa-accent" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="sa-muted">Core identity and contact details.</CardDescription>
                </div>
                {!isEditingProfile && (
                  <Button variant="outline" size="sm" className="sa-btn-neutral" onClick={startEditingProfile}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isEditingProfile ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 inline-flex items-center gap-2 text-slate-300">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input value={profile?.full_name || 'Not set'} disabled className="sa-input" />
                  </div>
                  <div>
                    <Label className="mb-1 inline-flex items-center gap-2 text-slate-300">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input value={profile?.email || user.email || ''} disabled className="sa-input" />
                  </div>
                  <div>
                    <Label className="mb-1 inline-flex items-center gap-2 text-slate-300">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </Label>
                    <Input
                      value={new Date(profile?.created_at || '').toLocaleDateString()}
                      disabled
                      className="sa-input"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 inline-flex items-center gap-2 text-slate-300">
                      <Shield className="h-4 w-4" />
                      Account Status
                    </Label>
                    <Input
                      value={profile?.is_active ? 'Active' : 'Inactive'}
                      disabled
                      className="sa-input capitalize"
                    />
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleProfileUpdate}>
                  <div>
                    <Label htmlFor="edit-name" className="mb-1 inline-flex items-center gap-2 text-slate-300">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="edit-name"
                      value={editedName}
                      onChange={(event) => setEditedName(event.target.value)}
                      placeholder="Enter your full name"
                      className="sa-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email" className="mb-1 inline-flex items-center gap-2 text-slate-300">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editedEmail}
                      onChange={(event) => setEditedEmail(event.target.value)}
                      placeholder="Enter your email"
                      className="sa-input"
                    />
                    <p className="mt-1 text-xs sa-muted">Changing email requires verification.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" className="sa-btn-accent" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="sa-btn-neutral"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setEditedName('');
                        setEditedEmail('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="sa-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5 sa-accent" />
                Subscription Details
              </CardTitle>
              <CardDescription className="sa-muted">Current tier, status, and lifecycle dates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide sa-muted">Current Plan</Label>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className={`${tier.badgeClass} text-xs`}>{displayedPlanName}</Badge>
                    {subscription && (
                      <Badge className="sa-badge-muted text-xs">
                        {subscriptionStatusLabels[subscriptionStatus] || subscriptionStatus}
                      </Badge>
                    )}
                  </div>
                </div>
                {normalizedTier === 'free' && (
                  <Button onClick={handleUpgradePlan} className="sa-btn-accent">
                    Upgrade Plan
                  </Button>
                )}
              </div>

              {subscription ? (
                <>
                  <Separator className="bg-slate-700/70" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="sa-muted">Started</span>
                      <span className="text-white">
                        {new Date(subscription.started_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="sa-muted">Expires</span>
                      <span className="text-white">
                        {new Date(subscription.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    {subscription.status === 'trial' && subscription.trial_ends_at && (
                      <div className="flex justify-between">
                        <span className="sa-muted">Trial Ends</span>
                        <span className="text-amber-300">
                          {new Date(subscription.trial_ends_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Separator className="bg-slate-700/70" />
                  <p className="text-sm sa-muted">No active subscription yet.</p>
                </>
              )}

              {subscription && normalizedTier !== 'free' && subscriptionStatus !== 'trial' && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="sa-btn-neutral" onClick={() => toast.info('Change plan coming soon.')}>
                    Change Plan
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Cancel Subscription</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sa-card border-slate-700 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                        <AlertDialogDescription className="sa-muted">
                          Access remains active until the current billing period ends.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="sa-btn-neutral">Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelSubscription}>Cancel Subscription</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="sa-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 sa-accent" />
                Security
              </CardTitle>
              <CardDescription className="sa-muted">Password and session controls.</CardDescription>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button variant="outline" className="sa-btn-neutral" onClick={() => setIsChangingPassword(true)}>
                  Change Password
                </Button>
              ) : (
                <form className="space-y-4" onSubmit={handlePasswordChange}>
                  <div>
                    <Label htmlFor="new-password" className="mb-1 text-slate-300">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      minLength={6}
                      required
                      className="sa-input"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="mb-1 text-slate-300">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      minLength={6}
                      required
                      className="sa-input"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" className="sa-btn-accent" disabled={isLoading}>
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
                      className="sa-btn-neutral"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="sa-card border-rose-500/35">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Sign out</h3>
                <p className="text-sm sa-muted">End this session on the current device.</p>
              </div>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card className="sa-card border-slate-700/60 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
              <CardDescription className="sa-muted">Permanent actions that cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/60 p-4">
                <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                <p className="mt-1 text-sm sa-muted">
                  Permanently remove your account and all linked data.
                </p>
                <div className="mt-4">
                  <DeleteAccountDialog userEmail={user.email || ''} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
