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
  Bitcoin,
  CheckCircle2,
  Circle,
  History,
  Download,
  AlertTriangle,
  Camera
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { getPlanTier, normalizePlanName } from '@/components/subscription/planCatalog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const subscriptionStatusLabels: Record<string, string> = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

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
    updatePassword,
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
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'crypto'>('stripe');

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
    return <LoadingScreen message="Getting your profile ready..." hint="Fetching your latest account details from Supabase." />;
  }
  if (!user) {
    return <LoadingScreen message="Redirecting..." meshBackground={false} hint="No active session found. Sending you to the homepage." />;
  }
  if (!profile && !profileError) {
    if (profileLoadTakingLong) {
      return (
        <LoadingScreen message="Loading your profile" hint="This is taking longer than expected.">
          <Button variant="secondary" onClick={refreshProfile} className="sa-btn-neutral">Try again</Button>
        </LoadingScreen>
      );
    }
    return <LoadingScreen message="Loading your profile" hint="This may take a few seconds." />;
  }
  if (!profile && profileError) {
    return (
      <LoadingScreen message="We could not load your profile" hint={profileError}>
        <Button variant="secondary" onClick={refreshProfile} className="sa-btn-neutral">Try again</Button>
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
      await updatePassword(newPassword);
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
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
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingProfile = () => {
    setEditedName(profile?.full_name || '');
    setEditedEmail(profile?.email || user.email || '');
    setIsEditingProfile(true);
  };

  const handleLogoutThisDevice = async () => {
    const { error } = await signOut({ global: false });
    if (error) {
      toast.error(error.message || 'Failed to sign out of this device.');
      return;
    }
    toast.success('Signed out of this device.');
    navigate('/');
  };

  const handleLogoutAllDevices = async () => {
    const { error } = await signOut({ global: true });
    if (error) {
      toast.error(error.message || 'Failed to sign out of all devices.');
      return;
    }
    toast.success('Signed out of all devices.');
    navigate('/');
  };

  const handleCancelSubscription = () => {
    toast.info('Subscription management will be available soon.');
  };

  const handleUpgradePlan = () => {
    navigate('/pricing');
  };

  const handleManageBilling = () => {
    if (!PAYMENTS_ENABLED) {
      toast.info('Billing portal coming soon.');
      return;
    }
    toast.info('Redirecting to Stripe Customer Portal...');
    // TODO: Connect to backend for portal session
  };

  const normalizedTier = normalizePlanName(subscriptionTier);
  const tier = getPlanTier(normalizedTier);
  const displayedPlanName = tier.displayName;
  const createdAtValue = profile?.created_at;
  const parsedCreatedAt = createdAtValue ? new Date(createdAtValue) : null;
  const memberSinceLabel =
    parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
      ? parsedCreatedAt.toLocaleDateString()
      : 'Not available';
  
  // Custom glass classes based on Stitch format
  // Custom glass classes based on Lumina theme
  const glassCard = "lumina-card p-6 shadow-2xl transition-all";
  const inputStyle = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 focus:ring-1 focus:ring-[#E2B485] outline-none";

  return (
    <main className="circuit-bg relative min-h-screen text-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-24 sm:pt-32 relative z-10 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="sa-btn-ghost mb-2 -ml-4 flex items-center text-slate-400 hover:text-[#E2B485] transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-2">Profile Dashboard</h1>
                <p className="text-slate-400">Manage your AI trading configurations and account preferences.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleLogoutThisDevice}
                  className="bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 border-white/10 text-slate-300 font-bold px-4 h-12 transition-all"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out This Device
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogoutAllDevices}
                  className="bg-white/5 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30 border-white/10 text-slate-300 font-bold px-4 h-12 transition-all"
                >
                  <Shield className="mr-2 h-4 w-4" /> Sign Out All Devices
                </Button>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Personal Details Card */}
            <div className={glassCard}>
              <div className="flex items-center justify-between mb-6 border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-[#E2B485]" />
                  <h3 className="text-lg font-bold text-slate-100">Personal Details</h3>
                </div>
                {!isEditingProfile && (
                  <Button variant="outline" size="sm" className="lumina-button-outline px-4" onClick={startEditingProfile}>
                    Edit Profile
                  </Button>
                )}
              </div>

              {!isEditingProfile ? (
                 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</span>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200">
                        {profile?.full_name || 'Not set'}
                      </div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</span>
                       <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200 truncate pr-2">
                         {profile?.email || user.email || ''}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member Since</span>
                       <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-200">
                       {memberSinceLabel}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account ID</span>
                       <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-400 text-sm truncate">
                         {user.id.substring(0, 13)}...
                       </div>
                    </div>
                 </div>
              ) : (
                 <form className="space-y-4" onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</Label>
                        <Input id="edit-name" value={editedName} onChange={e => setEditedName(e.target.value)} placeholder="Full name" className={inputStyle} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</Label>
                        <Input id="edit-email" type="email" value={editedEmail} onChange={e => setEditedEmail(e.target.value)} placeholder="Email" className={inputStyle} />
                        <p className="mt-1 text-[10px] text-amber-500">Changing email requires verification.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button type="button" variant="outline" className="bg-transparent border-slate-700 hover:bg-slate-800 text-white" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                      <Button type="submit" disabled={isLoading} className="lumina-button px-6 font-bold">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                      </Button>
                    </div>
                 </form>
              )}
            </div>

            {/* Payment Methods Section (Sleeper Mode Implementation) */}
            <div className={glassCard}>
              <div className="flex items-center justify-between mb-6 border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-[#E2B485]" />
                  <h3 className="text-lg font-bold text-slate-100">Payment Preferences</h3>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-slate-400 mb-2">Select your preferred payment method for future billing.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stripe Option */}
                  <div 
                    onClick={() => setPaymentMethod('stripe')}
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                      paymentMethod === 'stripe' ? "border-[#E2B485]/40 bg-[#E2B485]/10" : "border-slate-700/50 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#060a11] rounded-lg flex items-center justify-center border border-slate-800">
                        <CreditCard className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-200">Credit Card</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Powered by Stripe</p>
                      </div>
                    </div>
                    {paymentMethod === 'stripe' ? <CheckCircle2 className="h-5 w-5 text-[#E2B485]" /> : <Circle className="h-5 w-5 text-slate-600" />}
                  </div>

                  {/* Crypto Option */}
                  <div 
                    onClick={() => setPaymentMethod('crypto')}
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                      paymentMethod === 'crypto' ? "border-[#E2B485]/40 bg-[#E2B485]/10" : "border-slate-700/50 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#060a11] rounded-lg flex items-center justify-center border border-slate-800">
                        <Bitcoin className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-200">Crypto Wallet</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">BTC, ETH, USDC</p>
                      </div>
                    </div>
                    {paymentMethod === 'crypto' ? <CheckCircle2 className="h-5 w-5 text-amber-500" /> : <Circle className="h-5 w-5 text-slate-600" />}
                  </div>
                </div>
                {!PAYMENTS_ENABLED && (
                  <div className="mt-3 p-3 text-xs bg-slate-800/50 text-slate-300 rounded border border-slate-700/50 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>Payment functionality is currently disabled for your account. Subscriptions cannot be purchased yet.</span>
                  </div>
                )}
              </div>
            </div>
            
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Subscription Status */}
            <div className="relative overflow-hidden lumina-card border-t-4 border-[#E2B485] shadow-2xl">
              {/* Decorative accent */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#E2B485]/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Plan</p>
                    <h2 className="text-3xl font-black text-white capitalize">{displayedPlanName}</h2>
                  </div>
                  {subscription && (
                     <Badge className={cn("px-3 py-1 font-bold border uppercase tracking-tighter", 
                       subscriptionStatus === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : 
                       subscriptionStatus === 'trial' ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                       "bg-amber-500/10 text-amber-400 border-amber-500/30"
                     )}>
                       {subscriptionStatusLabels[subscriptionStatus] || subscriptionStatus}
                     </Badge>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-2 text-sm bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Status</span>
                      <span className="text-slate-100 font-medium capitalize">{subscriptionStatus}</span>
                    </div>
                    {subscription ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Started</span>
                          <span className="text-slate-100 font-medium">{new Date(subscription.started_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 -mx-2 px-2 py-1 rounded">
                          <span className="text-slate-400">Expires</span>
                          <span className="text-[#E2B485] font-medium">{new Date(subscription.expires_at).toLocaleDateString()}</span>
                        </div>
                        {subscription.status === 'trial' && subscription.trial_ends_at && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Trial Ends</span>
                            <span className="text-amber-400 font-medium">{new Date(subscription.trial_ends_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-slate-500 text-center py-2">No active subscription</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   {subscription && normalizedTier !== 'free' ? (
                     <>
                        <Button className="w-full bg-transparent border border-[#E2B485]/30 text-[#E2B485] hover:bg-[#E2B485]/10" onClick={handleManageBilling}>
                          Manage Billing
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="w-full bg-slate-800 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700">Cancel</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#0b121c] border border-slate-700 text-slate-100">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">Access remains active until the current billing period ends.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-800 text-white hover:bg-slate-700 border-none">Keep Subscription</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCancelSubscription} className="bg-rose-600 hover:bg-rose-700 text-white">Cancel Subscription</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                     </>
                   ) : (
                     <Button className="col-span-2 w-full lumina-button font-bold" onClick={handleUpgradePlan}>
                       Upgrade Plan
                     </Button>
                   )}
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className={glassCard}>
               <div className="flex items-center gap-3 mb-4">
                 <Shield className="h-5 w-5 text-[#E2B485]" />
                 <h3 className="text-lg font-bold text-slate-100">Security</h3>
               </div>
               
               {!isChangingPassword ? (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div>
                        <p className="font-medium text-sm text-slate-200">Password</p>
                        <p className="text-slate-500 text-xs mt-0.5">Last changed never</p>
                      </div>
                      <Button variant="outline" size="sm" className="lumina-button-outline px-4" onClick={() => setIsChangingPassword(true)}>
                        Update
                      </Button>
                   </div>
                 </div>
               ) : (
                 <form className="space-y-4" onSubmit={handlePasswordChange}>
                   <div className="space-y-1">
                     <Label className="text-xs text-slate-400">New Password</Label>
                     <Input type="password" minLength={6} required className={inputStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                   </div>
                   <div className="space-y-1">
                     <Label className="text-xs text-slate-400">Confirm Password</Label>
                     <Input type="password" minLength={6} required className={inputStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                   </div>
                   <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="outline" size="sm" className="bg-transparent border-slate-700 text-white hover:bg-slate-800" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                     <Button type="submit" size="sm" className="lumina-button px-6 font-bold" disabled={isLoading}>
                       {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Set Password'}
                     </Button>
                   </div>
                 </form>
               )}
            </div>

            {/* Support/Links Section */}
            <div className={glassCard}>
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-5 w-5 text-[#E2B485]" />
                <h3 className="text-lg font-bold text-slate-100">Preferences</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                   <span className="text-sm text-slate-300">Email Notifications</span>
                   <Badge variant="outline" className="border-[#C8935A]/30 text-[#C8935A]">Enabled</Badge>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                   <span className="text-sm text-slate-300">Trade Alerts</span>
                   <Badge variant="outline" className="border-[#C8935A]/30 text-[#C8935A]">Instant</Badge>
                 </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-6 pb-12">
          
          {/* Payment History */}
          <div className={glassCard}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-100">Billing History</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200" onClick={() => toast.info('No history to download yet.')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-800/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold pb-3">Invoice / Description</th>
                    <th className="px-4 py-3 font-semibold pb-3">Date</th>
                    <th className="px-4 py-3 font-semibold pb-3">Amount</th>
                    <th className="px-4 py-3 font-semibold pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-800/40">
                  {/* Empty State for now as we haven't wired up payment_history to the profile hook yet */}
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 bg-slate-900/10 italic">
                      No payment history available. Records will appear here once you make a transaction.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Discreet Danger Zone */}
          <div className="flex justify-center pt-8 border-t border-slate-800/40">
             <div className="group flex flex-col items-center gap-2 opacity-20 hover:opacity-60 transition-opacity duration-700">
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-500">Advanced Account Termination</span>
                <DeleteAccountDialog userEmail={user.email || ''} />
             </div>
          </div>

        </div>

      </div>
    </main>
  );
}
