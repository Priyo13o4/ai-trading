import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  Clock,
  Download,
  History,
  Laptop,
  Loader2,
  LogOut,
  MapPin,
  RefreshCw,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { getPlanTier, normalizePlanName } from '@/components/subscription/planCatalog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { apiService, type AuthActiveSession } from '@/services/api';

type BillingHistoryRecord = {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  provider?: string;
  payment_type?: string;
  external_payment_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

const subscriptionStatusLabels: Record<string, string> = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
  expired: 'Expired',
  cancelling: 'Cancelling',
};

const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

const isSafeCheckoutRedirect = (rawUrl: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const host = parsed.hostname.toLowerCase();

    if (parsed.origin === window.location.origin) return true;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (parsed.protocol !== 'https:') return false;

    return host === 'checkout.razorpay.com' || host.endsWith('.razorpay.com');
  } catch {
    return false;
  }
};

const parsePaymentHistoryPayload = (payload: unknown): BillingHistoryRecord[] => {
  if (!payload) return [];

  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { history?: unknown[] }).history)
      ? (payload as { history: unknown[] }).history
      : Array.isArray((payload as { payments?: unknown[] }).payments)
        ? (payload as { payments: unknown[] }).payments
        : Array.isArray((payload as { items?: unknown[] }).items)
          ? (payload as { items: unknown[] }).items
          : Array.isArray((payload as { transactions?: unknown[] }).transactions)
            ? (payload as { transactions: unknown[] }).transactions
          : [];

  return list
    .map((entry, index): BillingHistoryRecord | null => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;

      const amountRaw = row.amount;
      const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw ?? 0);
      const createdAt =
        typeof row.created_at === 'string'
          ? row.created_at
          : typeof row.createdAt === 'string'
            ? row.createdAt
            : new Date().toISOString();

      return {
        id: String(row.id ?? row.external_payment_id ?? `payment-${index}`),
        created_at: createdAt,
        amount: Number.isFinite(amount) ? amount : 0,
        currency: String(row.currency ?? 'INR').toUpperCase(),
        status: String(row.status ?? 'unknown'),
        provider: typeof row.provider === 'string' ? row.provider : undefined,
        payment_type: typeof row.payment_type === 'string' ? row.payment_type : undefined,
        external_payment_id:
          typeof row.external_payment_id === 'string'
            ? row.external_payment_id
            : typeof row.external_id === 'string'
              ? row.external_id
              : undefined,
        description: typeof row.description === 'string' ? row.description : undefined,
        metadata:
          row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : undefined,
      };
    })
    .filter((row): row is BillingHistoryRecord => Boolean(row));
};

const csvEscape = (value: string | number): string => {
  const str = String(value);
  const csvSafeValue = /^\s*[=+\-@]/.test(str) ? `'${str}` : str;

  if (csvSafeValue.includes(',') || csvSafeValue.includes('"') || csvSafeValue.includes('\n')) {
    return `"${csvSafeValue.replace(/"/g, '""')}"`;
  }
  return csvSafeValue;
};

const toSafeIsoDate = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
};

const isRazorpayRecord = (record: BillingHistoryRecord): boolean => {
  const provider = (record.provider || '').toLowerCase();
  if (provider.includes('razorpay')) return true;

  const extId = record.external_payment_id || '';
  if (extId.startsWith('pay_') || extId.startsWith('order_')) return true;

  const metadata = record.metadata || {};
  return ['razorpay_payment_id', 'razorpay_order_id', 'razorpay_signature'].some((key) => key in metadata);
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
    updatePassword,
    cancelSubscription,
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

  const [sessions, setSessions] = useState<AuthActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionSid, setRevokingSessionSid] = useState<string | null>(null);

  const [billingHistory, setBillingHistory] = useState<BillingHistoryRecord[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showManageBillingModal, setShowManageBillingModal] = useState(false);
  const [checkoutProvider, setCheckoutProvider] = useState<'razorpay' | 'nowpayments'>('razorpay');
  const [checkoutBillingPeriod] = useState<'monthly'>('monthly');
  const [checkoutPlanId, setCheckoutPlanId] = useState('starter');
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const normalizedTier = normalizePlanName(subscriptionTier);
  const tier = getPlanTier(normalizedTier);
  const displayedPlanName = tier.displayName;

  const createdAtValue = profile?.created_at;
  const parsedCreatedAt = createdAtValue ? new Date(createdAtValue) : null;
  const memberSinceLabel =
    parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
      ? parsedCreatedAt.toLocaleDateString()
      : 'Not available';

  const isCancellationPending = Boolean(
    subscription && subscription.status === 'active' && subscription.cancel_at_period_end
  );
  const isCancelledState = subscriptionStatus === 'cancelled' || subscriptionStatus === 'expired';
  const hasPaidTier = normalizedTier !== 'free' && Boolean(subscription);

  const razorpayHistory = useMemo(
    () => billingHistory.filter((record) => isRazorpayRecord(record)),
    [billingHistory]
  );

  const glassCard = 'lumina-card p-6 shadow-2xl transition-all';
  const inputStyle =
    'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 focus:ring-1 focus:ring-[#E2B485] outline-none';

  const formatSessionTime = (value?: number | null) => {
    if (!value) return 'Unknown';
    const d = new Date(value * 1000);
    if (Number.isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleString();
  };

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    const result = await apiService.authListSessions();
    if (result.error) {
      if (result.status === 401) {
        toast.error('Session no longer valid, please log in again.');
        await signOut({ global: false });
        navigate('/');
        setSessionsLoading(false);
        return;
      }
      setSessions([]);
      setSessionsError(result.status === 0 || result.status === 408 || result.status >= 500 ? 'Lost connection to server, reconnecting.' : result.error);
      setSessionsLoading(false);
      return;
    }
    setSessions(Array.isArray(result.data?.sessions) ? result.data.sessions : []);
    setSessionsLoading(false);
  }, [navigate, signOut]);

  const loadBillingHistory = useCallback(async () => {
    setBillingLoading(true);
    setBillingError(null);
    const response = await apiService.getPaymentHistory();
    if (response.error) {
      setBillingHistory([]);
      setBillingError(response.error);
      setBillingLoading(false);
      return;
    }
    setBillingHistory(parsePaymentHistoryPayload(response.data));
    setBillingLoading(false);
  }, []);

  useEffect(() => {
    if (authResolved && !user) navigate('/');
  }, [authResolved, user, navigate]);

  useEffect(() => {
    if (!authResolved || profile || profileError) {
      setProfileLoadTakingLong(false);
      return;
    }
    const timer = setTimeout(() => setProfileLoadTakingLong(true), 8000);
    return () => clearTimeout(timer);
  }, [authResolved, profile, profileError]);

  useEffect(() => {
    if (!authResolved || !user) return;
    void loadSessions();
    void loadBillingHistory();
  }, [authResolved, user, loadSessions, loadBillingHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const checkoutPlan = params.get('checkout');
    if (!checkoutPlan) return;

    setCheckoutPlanId(normalizePlanName(checkoutPlan));
    setShowCheckoutModal(true);
    navigate('/profile', { replace: true });
  }, [navigate]);

  const startEditingProfile = () => {
    setEditedName(profile?.full_name || '');
    setEditedEmail(profile?.email || user?.email || '');
    setIsEditingProfile(true);
  };

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

  const handleLogoutThisDevice = async () => {
    const { error } = await signOut({ global: false });
    if (error) {
      toast.error(error.message || 'Failed to sign out cleanly on backend. Redirecting to landing page.');
    } else {
      toast.success('Signed out of this device.');
    }
    navigate('/');
  };

  const handleLogoutAllDevices = async () => {
    const { error } = await signOut({ global: true });
    if (error) {
      toast.error(error.message || 'Failed to sign out cleanly on backend. Redirecting to landing page.');
    } else {
      toast.success('Signed out of all devices.');
    }
    navigate('/');
  };

  const handleRevokeSession = async (publicSid: string, isCurrent: boolean) => {
    if (isCurrent) {
      await handleLogoutThisDevice();
      return;
    }
    setRevokingSessionSid(publicSid);
    const result = await apiService.authRevokeSession(publicSid);
    setRevokingSessionSid(null);
    if (result.error) {
      toast.error(result.error || 'Failed to remove device session');
      return;
    }
    toast.success('Device session removed');
    await loadSessions();
  };

  const openCheckoutModal = (planId?: string) => {
    setCheckoutPlanId(normalizePlanName(planId || (normalizedTier !== 'free' ? normalizedTier : 'starter')));
    setShowCheckoutModal(true);
  };

  const handleStartCheckout = async () => {
    if (!PAYMENTS_ENABLED) {
      toast.info('Checkout is currently disabled for this environment.');
      return;
    }

    if (checkoutProvider !== 'razorpay') {
      toast.info('Provider switching UI is ready, NOWPayments checkout flow is coming soon.');
      return;
    }

    setStartingCheckout(true);
    try {
      const selectedPlan = normalizePlanName(checkoutPlanId);
      const response = await apiService.createCheckout(selectedPlan, 'razorpay', checkoutBillingPeriod);
      if (response.error) {
        toast.error(response.error || 'Failed to start checkout');
        return;
      }

      const data = (response.data ?? {}) as {
        checkout_url?: string;
        redirect_url?: string;
        provider_checkout_data?: {
          order_id?: string;
          amount?: number;
          currency?: string;
        };
      };

      const redirectUrl = data.checkout_url || data.redirect_url;
      if (redirectUrl) {
        if (typeof window === 'undefined') {
          toast.error('Checkout could not be initialized in this environment.');
          return;
        }
        if (!isSafeCheckoutRedirect(redirectUrl)) {
          toast.error('Received an invalid checkout redirect URL. Please contact support if this persists.');
          return;
        }

        const safeRedirect = new URL(redirectUrl, window.location.origin).toString();
        window.location.assign(safeRedirect);
        return;
      }

      const orderId = data.provider_checkout_data?.order_id;
      if (!orderId || typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
        toast.error('Checkout could not be initialized. Please try again in a moment.');
        return;
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error('Razorpay key is missing in environment configuration.');
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKey,
        order_id: orderId,
        amount: data.provider_checkout_data?.amount,
        currency: data.provider_checkout_data?.currency || 'INR',
        name: 'PipFactor AI',
        description: `${displayedPlanName} subscription`,
        handler: () => {
          toast.success('Payment submitted. We will confirm it after webhook verification.');
          setShowCheckoutModal(false);
          void refreshProfile();
        },
        modal: {
          ondismiss: () => toast.info('Checkout closed before completion.'),
        },
      });

      rzp.open();
    } finally {
      setStartingCheckout(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await cancelSubscription();
      toast.success('Subscription cancellation scheduled. Access remains active until period end.');
      await Promise.all([loadBillingHistory(), refreshProfile()]);
      setShowManageBillingModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleResubscribeViaCheckout = () => {
    setShowManageBillingModal(false);
    setCheckoutProvider('razorpay');
    openCheckoutModal(normalizedTier === 'free' ? 'starter' : normalizedTier);
  };

  const handleExportBillingHistory = () => {
    if (razorpayHistory.length === 0) {
      toast.error('No Razorpay transactions available to export.');
      return;
    }

    const headers = ['Date', 'Amount', 'Currency', 'Status', 'Provider', 'Payment Type', 'External Payment ID', 'Description'];
    const rows = razorpayHistory.map((record) => [
      toSafeIsoDate(record.created_at),
      (record.amount / 100).toFixed(2),
      record.currency,
      record.status,
      record.provider || 'razorpay',
      record.payment_type || 'subscription',
      record.external_payment_id || '',
      record.description || '',
    ]);

    const csvContent = [
      headers.map((h) => csvEscape(h)).join(','),
      ...rows.map((row) => row.map((value) => csvEscape(value)).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `razorpay-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

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

  return (
    <main className="circuit-bg relative min-h-screen overflow-hidden text-slate-100">
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="sa-btn-ghost mb-2 -ml-4 flex items-center text-slate-400 transition-colors hover:text-[#E2B485]">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="mb-2 text-4xl font-black tracking-tight text-white">Profile Dashboard</h1>
            <p className="text-slate-400">Manage your AI trading configurations and account preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className={glassCard}>
              <div className="mb-6 flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-[#E2B485]" />
                  <h3 className="text-lg font-bold text-slate-100">Personal Details</h3>
                </div>
                {!isEditingProfile && (
                  <Button variant="outline" size="sm" className="lumina-button-outline px-4" onClick={startEditingProfile}>Edit Profile</Button>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</span>
                    <div className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-200">{profile?.full_name || 'Not set'}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</span>
                    <div className="w-full truncate rounded-lg border border-white/10 bg-white/5 px-4 py-2 pr-2 text-slate-200">{profile?.email || user.email || ''}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Member Since</span>
                    <div className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-200">{memberSinceLabel}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account ID</span>
                    <div className="w-full truncate rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">{user.id.substring(0, 13)}...</div>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="edit-name" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</Label>
                      <Input id="edit-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} placeholder="Full name" className={inputStyle} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</Label>
                      <Input id="edit-email" type="email" value={editedEmail} onChange={(e) => setEditedEmail(e.target.value)} placeholder="Email" className={inputStyle} />
                      <p className="mt-1 text-[10px] text-amber-500">Changing email requires verification.</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-800" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                    <Button type="submit" disabled={isLoading} className="lumina-button px-6 font-bold">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}</Button>
                  </div>
                </form>
              )}
            </div>

            <div className={glassCard}>
              <div className="mb-6 flex flex-col gap-3 border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <Laptop className="h-5 w-5 text-[#E2B485]" />
                  <h3 className="text-lg font-bold text-slate-100">Active Devices</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="lumina-button-outline inline-flex items-center gap-2 px-4" onClick={() => void loadSessions()} disabled={sessionsLoading} aria-busy={sessionsLoading}>
                    {sessionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}<span>Refresh Devices</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogoutThisDevice} className="border-white/10 bg-white/5 px-4 font-bold text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"><LogOut className="mr-2 h-4 w-4" /> Sign Out This Device</Button>
                  <Button variant="outline" size="sm" onClick={handleLogoutAllDevices} className="border-white/10 bg-white/5 px-4 font-bold text-slate-300 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"><Shield className="mr-2 h-4 w-4" /> Sign Out All Devices</Button>
                </div>
              </div>

              {sessionsError && <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{sessionsError}</div>}

              {sessions.length === 0 && !sessionsLoading ? (
                <p className="text-sm text-slate-400">No active device sessions found.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.sid} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-100">{s.user_agent?.summary || 'Unknown device'}</p>
                            {s.current && <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Current</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Last active: {formatSessionTime(s.last_activity)}</span>
                            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Expires: {formatSessionTime(s.expires_at)}</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.country || 'Unknown country'} {s.ip ? `• ${s.ip}` : ''}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => void handleRevokeSession(s.sid, s.current)} disabled={revokingSessionSid === s.sid}>
                          {revokingSessionSid === s.sid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}<span className="ml-2">{s.current ? 'Sign Out' : 'Remove'}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="lumina-card relative overflow-hidden border-t-4 border-[#E2B485] shadow-2xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#E2B485]/10 blur-2xl" />
              <div className="relative z-10 p-6">
                <div className="mb-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Active Plan</p>
                    <h2 className="text-3xl font-black capitalize text-white">{displayedPlanName}</h2>
                  </div>
                  {subscription && (
                    <Badge className={cn('border px-3 py-1 font-bold uppercase tracking-tighter', subscriptionStatus === 'active' ? 'border-[#E2B485]/40 bg-[#E2B485]/10 text-[#E2B485]' : subscriptionStatus === 'trial' ? 'border-[#C8935A]/40 bg-[#C8935A]/10 text-[#E2B485]' : 'border-slate-600 bg-slate-800/70 text-slate-200')}>
                      {subscriptionStatusLabels[subscriptionStatus] || subscriptionStatus}
                    </Badge>
                  )}
                </div>

                <div className="mb-6 space-y-4">
                  <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-400">Status</span><span className="font-medium capitalize text-slate-100">{subscriptionStatus}</span></div>
                    {subscription ? (
                      <>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Started</span><span className="font-medium text-slate-100">{new Date(subscription.started_at).toLocaleDateString()}</span></div>
                        <div className="-mx-2 flex items-center justify-between rounded bg-white/5 px-2 py-1"><span className="text-slate-400">Expires</span><span className="font-medium text-[#E2B485]">{new Date(subscription.expires_at).toLocaleDateString()}</span></div>
                      </>
                    ) : (
                      <div className="py-2 text-center text-sm text-slate-500">No active subscription</div>
                    )}
                  </div>

                  {isCancellationPending && subscription && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      Cancellation is scheduled. Your access remains active until <span className="font-semibold">{new Date(subscription.expires_at).toLocaleDateString()}</span>. To continue after expiry, use Resubscribe via Checkout.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button className="w-full border border-[#E2B485]/30 bg-transparent text-[#E2B485] hover:bg-[#E2B485]/10" onClick={() => setShowManageBillingModal(true)}>Manage Billing</Button>
                  {hasPaidTier ? (
                    <Button className="w-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-[#E2B485]/20 hover:text-[#E2B485]" onClick={() => (isCancellationPending || isCancelledState ? handleResubscribeViaCheckout() : openCheckoutModal(normalizedTier))}>
                      {isCancellationPending || isCancelledState ? 'Resubscribe' : 'Open Checkout'}
                    </Button>
                  ) : (
                    <Button className="w-full lumina-button font-bold" onClick={() => openCheckoutModal('starter')}>Subscribe via Checkout</Button>
                  )}
                </div>

                {!PAYMENTS_ENABLED && <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 text-xs text-slate-300">Payments are currently disabled for this environment.</div>}
              </div>
            </div>

            <div className={glassCard}>
              <div className="mb-4 flex items-center gap-3"><Shield className="h-5 w-5 text-[#E2B485]" /><h3 className="text-lg font-bold text-slate-100">Security</h3></div>
              {!isChangingPassword ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <p className="text-sm font-medium text-slate-200">Password</p>
                    <Button variant="outline" size="sm" className="lumina-button-outline px-4" onClick={() => setIsChangingPassword(true)}>Update</Button>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handlePasswordChange}>
                  <div className="space-y-1"><Label className="text-xs text-slate-400">New Password</Label><Input type="password" minLength={6} required className={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs text-slate-400">Confirm Password</Label><Input type="password" minLength={6} required className={inputStyle} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" className="border-slate-700 bg-transparent text-white hover:bg-slate-800" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="lumina-button px-6 font-bold" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Set Password'}</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 pb-12">
          <div className={glassCard}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3"><History className="h-5 w-5 text-slate-400" /><h3 className="text-lg font-bold text-slate-100">Billing History</h3></div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:text-slate-600" onClick={handleExportBillingHistory} disabled={razorpayHistory.length === 0} title={razorpayHistory.length === 0 ? 'No Razorpay transactions available for export' : 'Download Razorpay transactions as CSV'}><Download className="h-4 w-4" /></Button>
            </div>

            {billingError && <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{billingError}</div>}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-slate-800/60 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-semibold">Invoice / Description</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Amount</th><th className="px-4 py-3 font-semibold">Provider</th><th className="px-4 py-3 text-right font-semibold">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {billingLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading billing history...</span></td></tr>
                  ) : billingHistory.length === 0 ? (
                    <tr><td colSpan={5} className="bg-slate-900/10 px-4 py-8 text-center italic text-slate-500">No payment history available. Records will appear here once you make a transaction.</td></tr>
                  ) : (
                    billingHistory.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3 text-slate-300">{record.description || record.external_payment_id || 'Subscription payment'}</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(record.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-200">{(record.amount / 100).toFixed(2)} {record.currency}</td>
                        <td className="px-4 py-3 text-slate-300">{record.provider || 'unknown'}</td>
                        <td className="px-4 py-3 text-right"><Badge className={cn('border', record.status === 'succeeded' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : record.status === 'pending' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300')}>{record.status}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center border-t border-slate-800/40 pt-8">
            <div className="group flex flex-col items-center gap-2 opacity-20 transition-opacity duration-700 hover:opacity-60">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500">Advanced Account Termination</span>
              <DeleteAccountDialog userEmail={user.email || ''} />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="lumina-card border border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription className="text-slate-400">Continue through payment gateway checkout. Provider switching UI is scaffolded here.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Selected Plan</p>
              <p className="mt-1 text-lg font-semibold text-white">{getPlanTier(normalizePlanName(checkoutPlanId)).displayName}</p>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Billing Period</p>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className={cn('border-[#E2B485]/50 bg-[#E2B485]/10 text-[#E2B485] hover:bg-[#E2B485]/20')}>
                  Monthly
                </Button>
                <Button type="button" variant="outline" className="cursor-not-allowed border-white/10 bg-white/5 text-slate-500 hover:bg-white/5" disabled>
                  Yearly (Coming Soon)
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Payment Provider</p>
              <div className="space-y-2">
                <button type="button" onClick={() => setCheckoutProvider('razorpay')} className={cn('w-full rounded-xl border p-3 text-left transition-colors', checkoutProvider === 'razorpay' ? 'border-[#E2B485]/50 bg-[#E2B485]/10' : 'border-white/10 bg-white/5 hover:bg-white/10')}>
                  <div className="flex items-center justify-between"><div><p className="font-semibold text-slate-100">Razorpay</p><p className="text-xs text-slate-400">Live and supported today</p></div><Badge className="border-[#E2B485]/40 bg-[#E2B485]/10 text-[#E2B485]">Primary</Badge></div>
                </button>
                <div className="w-full rounded-xl border border-white/10 bg-white/5 p-3 opacity-70"><div className="flex items-center justify-between"><div><p className="font-semibold text-slate-100">NOWPayments</p><p className="text-xs text-slate-400">Coming soon for in-flow provider switching</p></div><Badge className="border-[#C8935A]/40 bg-[#C8935A]/10 text-[#E2B485]">Coming Soon</Badge></div></div>
              </div>
            </div>

            {!PAYMENTS_ENABLED && <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />Checkout is disabled in this environment.</div>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" onClick={() => setShowCheckoutModal(false)}>Close</Button>
            <Button type="button" onClick={handleStartCheckout} className="lumina-button" disabled={startingCheckout || !PAYMENTS_ENABLED}>{startingCheckout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Continue to Razorpay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManageBillingModal} onOpenChange={setShowManageBillingModal}>
        <DialogContent className="lumina-card border border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle>Manage Billing</DialogTitle>
            <DialogDescription className="text-slate-400">Cancel current billing or start a fresh checkout to continue after cancellation.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-400">Plan</span><span className="font-semibold text-slate-100">{displayedPlanName}</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-slate-400">Status</span><span className="font-semibold capitalize text-slate-100">{subscriptionStatus}</span></div>
              {subscription?.expires_at && <div className="mt-2 flex items-center justify-between"><span className="text-slate-400">Current access ends</span><span className="font-semibold text-[#E2B485]">{new Date(subscription.expires_at).toLocaleDateString()}</span></div>}
            </div>

            {isCancellationPending ? (
              <div className="rounded-lg border border-[#C8935A]/40 bg-[#C8935A]/10 p-3 text-xs text-[#E2B485]">Cancellation is already scheduled. To continue after expiry, use Resubscribe via Checkout.</div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">Please cancel your active subscription first.</div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" onClick={() => setShowManageBillingModal(false)}>Close</Button>
            {(isCancellationPending || isCancelledState || !hasPaidTier) && (
              <Button type="button" className="border border-[#E2B485]/30 bg-transparent text-[#E2B485] hover:bg-[#E2B485]/10" onClick={handleResubscribeViaCheckout}>{hasPaidTier ? 'Resubscribe via Checkout' : 'Subscribe via Checkout'}</Button>
            )}
            {!isCancellationPending && hasPaidTier && (
              <Button type="button" onClick={() => void handleCancelSubscription()} className="bg-rose-600 text-white hover:bg-rose-700" disabled={cancelLoading}>{cancelLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Cancel Subscription</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
