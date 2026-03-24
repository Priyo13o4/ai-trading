import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
import { subscriptionService } from '@/services/subscriptionService';
import type { SubscriptionPlan } from '@/types/subscription';

type BillingHistoryRecord = {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  provider?: string;
  payment_type?: string;
  external_payment_id?: string;
  provider_subscription_id?: string;
  checkout_url?: string;
  management_url?: string;
  invoice_url?: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

const PROFILE_CACHE_KEY_SESSIONS = 'profile-active-sessions-v1';
const PROFILE_CACHE_KEY_BILLING = 'profile-billing-history-v1';
const ALLOW_LOCALHOST_REDIRECTS = Boolean(import.meta.env.DEV);

const getScopedCacheKey = (baseKey: string, userId?: string): string | null => {
  if (!userId) return null;
  return `${baseKey}:${userId}`;
};

const readCachedArray = <T,>(cacheKey: string): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(cacheKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const writeCachedArray = <T,>(cacheKey: string, value: T[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(value));
  } catch {
    // Ignore sessionStorage write errors.
  }
};

const subscriptionStatusLabels: Record<string, string> = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
  expired: 'Expired',
  cancelling: 'Cancelling',
};

const isSafeCheckoutRedirect = (rawUrl: string, provider: 'razorpay' | 'plisio'): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const host = parsed.hostname.toLowerCase();

    if (parsed.origin === window.location.origin) return true;
    if ((host === 'localhost' || host === '127.0.0.1') && ALLOW_LOCALHOST_REDIRECTS) return true;
    if (parsed.protocol !== 'https:') return false;

    if (provider === 'razorpay') {
      return (
        host === 'checkout.razorpay.com' ||
        host.endsWith('.razorpay.com') ||
        host === 'rzp.io' ||
        host.endsWith('.rzp.io')
      );
    }

    return host === 'plisio.net' || host.endsWith('.plisio.net');
  } catch {
    return false;
  }
};

const firstValidString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
};

const extractRecordUrls = (
  row: Record<string, unknown>,
  metadata: Record<string, unknown> | undefined
): {
  invoiceUrl?: string;
  checkoutUrl?: string;
  managementUrl?: string;
} => {
  const invoiceUrl = firstValidString(
    row.invoice_url,
    row.receipt_url,
    row.hosted_invoice_url,
    metadata?.invoice_url,
    metadata?.hosted_invoice_url,
    metadata?.receipt_url,
    metadata?.provider_invoice_url
  );

  const checkoutUrl = firstValidString(
    row.checkout_url,
    row.redirect_url,
    row.payment_url,
    metadata?.checkout_url,
    metadata?.redirect_url,
    metadata?.payment_url,
    metadata?.short_url,
    metadata?.hosted_url,
    metadata?.provider_checkout_url
  );

  const managementUrl = firstValidString(
    row.management_url,
    row.manage_url,
    row.portal_url,
    metadata?.management_url,
    metadata?.manage_url,
    metadata?.portal_url,
    metadata?.subscription_management_url
  );

  return { invoiceUrl, checkoutUrl, managementUrl };
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
      const metadata =
        row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : undefined;
      const urls = extractRecordUrls(row, metadata);

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
            : typeof row.provider_payment_id === 'string'
              ? row.provider_payment_id
            : typeof row.external_id === 'string'
              ? row.external_id
              : undefined,
        provider_subscription_id:
          typeof row.provider_subscription_id === 'string' ? row.provider_subscription_id : undefined,
        invoice_url: urls.invoiceUrl,
        checkout_url: urls.checkoutUrl,
        management_url: urls.managementUrl,
        description: typeof row.description === 'string' ? row.description : undefined,
        metadata,
      };
    })
    .filter((row): row is BillingHistoryRecord => Boolean(row))
    .sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });
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

const getDisplayAmount = (record: BillingHistoryRecord): number => {
  const raw = Number(record.amount);
  if (!Number.isFinite(raw)) return 0;

  if (isRazorpayRecord(record)) {
    // Razorpay data should be in minor units; keep backward compatibility for legacy major-unit rows.
    if (record.currency.toUpperCase() === 'INR') {
      return raw >= 1000 ? raw / 100 : raw;
    }
    return raw / 100;
  }

  return raw;
};

const formatDisplayAmount = (record: BillingHistoryRecord): string => `${getDisplayAmount(record).toFixed(2)} ${record.currency}`;

const resolveRecordAccessUrl = (record: BillingHistoryRecord): string | undefined => {
  const provider = (record.provider || '').toLowerCase();

  if (provider.includes('plisio') || provider.includes('crypto')) {
    return firstValidString(record.invoice_url, record.checkout_url, record.management_url);
  }

  if (provider.includes('razorpay')) {
    return firstValidString(record.management_url, record.checkout_url, record.invoice_url);
  }

  return firstValidString(record.management_url, record.invoice_url, record.checkout_url);
};

const openExternalLink = (rawUrl: string, fallbackProvider: 'razorpay' | 'plisio' = 'razorpay'): boolean => {
  if (typeof window === 'undefined') return false;
  if (!isSafeCheckoutRedirect(rawUrl, fallbackProvider)) return false;
  const safeUrl = new URL(rawUrl, window.location.origin).toString();
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
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
  const [checkoutProvider, setCheckoutProvider] = useState<'razorpay' | 'plisio'>('razorpay');
  const [checkoutBillingPeriod] = useState<'monthly'>('monthly');
  const [checkoutPlanId, setCheckoutPlanId] = useState('starter');
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [planPricing, setPlanPricing] = useState<Record<string, SubscriptionPlan>>({});

  const sessionsRef = useRef<AuthActiveSession[]>([]);
  const billingHistoryRef = useRef<BillingHistoryRecord[]>([]);
  const lastBackgroundRefreshAtRef = useRef<number>(0);

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
  const hasBlockingPaidSubscription = Boolean(
    subscription && subscription.status === 'active' && !subscription.cancel_at_period_end
  );

  const hasPurchasedPaidSubscription = useMemo(() => {
    return billingHistory.some((record) => {
      const status = (record.status || '').toLowerCase();
      if (['failed', 'cancelled', 'expired', 'refunded'].includes(status)) return false;

      const provider = (record.provider || '').toLowerCase();
      const paymentId = String(record.external_payment_id || '').trim();

      if (paymentId.startsWith('sub_')) return true;
      if (provider.includes('plisio') || provider.includes('crypto')) {
        return ['pending', 'processing', 'succeeded'].includes(status);
      }
      return status === 'succeeded';
    });
  }, [billingHistory]);

  const shouldBlockCheckout =
    hasBlockingPaidSubscription ||
    (hasPurchasedPaidSubscription && !isCancellationPending && !isCancelledState);

  const razorpayHistory = useMemo(
    () => billingHistory.filter((record) => isRazorpayRecord(record)),
    [billingHistory]
  );

  const selectedCheckoutPlan = useMemo(() => {
    const normalized = normalizePlanName(checkoutPlanId);
    const candidates = normalized === 'starter'
      ? ['core', 'starter']
      : [normalized];

    for (const candidate of candidates) {
      const plan = planPricing[candidate];
      if (plan) return plan;
    }
    return undefined;
  }, [checkoutPlanId, planPricing]);

  const selectedCheckoutPriceLabel = useMemo(() => {
    if (!selectedCheckoutPlan) return null;
    const amount = Number(selectedCheckoutPlan.price_usd);
    if (!Number.isFinite(amount)) return null;
    return `$${amount.toFixed(2)}/${selectedCheckoutPlan.billing_period}`;
  }, [selectedCheckoutPlan]);

  const latestPayment = useMemo(() => billingHistory[0], [billingHistory]);
  const latestPaymentAmountLabel = useMemo(() => {
    if (!latestPayment) return null;
    return formatDisplayAmount(latestPayment);
  }, [latestPayment]);

  const pendingPaidRazorpayPaymentId = useMemo(() => {
    const pendingAttempt = billingHistory.find((record) => {
      if (!isRazorpayRecord(record)) return false;
      const status = (record.status || '').toLowerCase();
      if (!['pending', 'processing'].includes(status)) return false;
      const paymentId = String(record.external_payment_id || '').trim();
      return paymentId.startsWith('sub_');
    });
    return pendingAttempt?.external_payment_id;
  }, [billingHistory]);

  const hasCancelablePaidAttempt = Boolean(pendingPaidRazorpayPaymentId);

  const subscriptionPaymentProvider = useMemo(() => {
    if (!subscription || typeof subscription !== 'object') return '';
    const provider = (subscription as { payment_provider?: unknown }).payment_provider;
    return typeof provider === 'string' ? provider.toLowerCase() : '';
  }, [subscription]);

  const activePaymentProvider = useMemo(() => {
    const provider = (latestPayment?.provider || subscriptionPaymentProvider || '').toLowerCase();
    return provider;
  }, [latestPayment, subscriptionPaymentProvider]);

  const isCryptoPaymentProvider = ['coinbase', 'plisio', 'crypto'].some((name) =>
    activePaymentProvider.includes(name)
  );

  const paymentMethodLabel = useMemo(() => {
    if (!activePaymentProvider) return 'Not set yet';
    if (isCryptoPaymentProvider) return 'Plisio (Crypto)';
    if (activePaymentProvider.includes('razorpay')) return 'Razorpay';
    if (activePaymentProvider.includes('manual')) return 'Manual';
    return activePaymentProvider.charAt(0).toUpperCase() + activePaymentProvider.slice(1);
  }, [activePaymentProvider, isCryptoPaymentProvider]);

  const paymentMethodHint = useMemo(() => {
    if (!activePaymentProvider) return 'Will update after your first payment';
    if (isCryptoPaymentProvider) return 'Manual renewal required';
    if (activePaymentProvider.includes('manual')) return 'Trial or admin-assigned access';
    return 'Auto-renewal enabled';
  }, [activePaymentProvider, isCryptoPaymentProvider]);

  const latestBillingAccessUrl = useMemo(() => {
    const latestWithUrl = billingHistory.find((record) => Boolean(resolveRecordAccessUrl(record)));
    return latestWithUrl ? resolveRecordAccessUrl(latestWithUrl) : undefined;
  }, [billingHistory]);

  const glassCard = 'lumina-card p-6 shadow-2xl transition-all';
  const inputStyle =
    'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-slate-100 focus:ring-1 focus:ring-[#E2B485] outline-none';

  const formatSessionTime = (value?: number | null) => {
    if (!value) return 'Unknown';
    const d = new Date(value * 1000);
    if (Number.isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleString();
  };

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    billingHistoryRef.current = billingHistory;
  }, [billingHistory]);

  const loadSessions = useCallback(async (opts?: { background?: boolean }) => {
    const hasStaleData = sessionsRef.current.length > 0;
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
      if (!hasStaleData || !opts?.background) {
        setSessions([]);
      }
      setSessionsError(result.status === 0 || result.status === 408 || result.status >= 500 ? 'Lost connection to server, reconnecting.' : result.error);
      setSessionsLoading(false);
      return;
    }
    const nextSessions = Array.isArray(result.data?.sessions) ? result.data.sessions : [];
    setSessions(nextSessions);
    const scopedSessionsKey = getScopedCacheKey(PROFILE_CACHE_KEY_SESSIONS, user?.id);
    if (scopedSessionsKey) {
      writeCachedArray(scopedSessionsKey, nextSessions);
    }
    setSessionsLoading(false);
  }, [navigate, signOut, user?.id]);

  const loadBillingHistory = useCallback(async (opts?: { background?: boolean }) => {
    const hasStaleData = billingHistoryRef.current.length > 0;
    setBillingLoading(true);
    setBillingError(null);
    const response = await apiService.getPaymentHistory();
    if (response.error) {
      if (!hasStaleData || !opts?.background) {
        setBillingHistory([]);
      }
      setBillingError(response.error);
      setBillingLoading(false);
      return;
    }
    const nextHistory = parsePaymentHistoryPayload(response.data);
    setBillingHistory(nextHistory);
    const scopedBillingKey = getScopedCacheKey(PROFILE_CACHE_KEY_BILLING, user?.id);
    if (scopedBillingKey) {
      const cachedHistory = nextHistory.map(({ metadata, ...rest }) => rest);
      writeCachedArray(scopedBillingKey, cachedHistory);
    }
    setBillingLoading(false);
  }, [user?.id]);

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

    const scopedSessionsKey = getScopedCacheKey(PROFILE_CACHE_KEY_SESSIONS, user.id);
    const scopedBillingKey = getScopedCacheKey(PROFILE_CACHE_KEY_BILLING, user.id);
    if (scopedSessionsKey && sessionsRef.current.length === 0) {
      const cachedSessions = readCachedArray<AuthActiveSession>(scopedSessionsKey);
      if (cachedSessions.length > 0) setSessions(cachedSessions);
    }
    if (scopedBillingKey && billingHistoryRef.current.length === 0) {
      const cachedBilling = readCachedArray<BillingHistoryRecord>(scopedBillingKey);
      if (cachedBilling.length > 0) setBillingHistory(cachedBilling);
    }

    void loadSessions();
    void loadBillingHistory();
  }, [authResolved, user, loadSessions, loadBillingHistory]);

  useEffect(() => {
    if (!authResolved || !user || typeof window === 'undefined') return;

    const onFocusOrVisible = () => {
      if (document.visibilityState !== 'hidden') {
        const nowMs = Date.now();
        if (nowMs - lastBackgroundRefreshAtRef.current < 1500) {
          return;
        }
        lastBackgroundRefreshAtRef.current = nowMs;
        void loadSessions({ background: true });
        void loadBillingHistory({ background: true });
      }
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [authResolved, user, loadSessions, loadBillingHistory]);

  useEffect(() => {
    if (!authResolved || !user) return;

    const loadPlanPricing = async () => {
      try {
        const plans = await subscriptionService.getSubscriptionPlans();
        const activePlans = plans.filter((plan) => plan.is_active);
        const mapped = activePlans.reduce<Record<string, SubscriptionPlan>>((acc, plan) => {
          acc[String(plan.name).toLowerCase()] = plan;
          return acc;
        }, {});
        setPlanPricing(mapped);
      } catch {
        // Non-blocking: checkout still works even if price fetch fails.
      }
    };

    void loadPlanPricing();
  }, [authResolved, user]);

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
    setStartingCheckout(true);
    try {
      const selectedPlan = normalizePlanName(checkoutPlanId);
      const response = await apiService.createCheckout(selectedPlan, checkoutProvider, checkoutBillingPeriod);
      if (response.error) {
        toast.error(response.error || 'Failed to start checkout');
        return;
      }

      const data = (response.data ?? {}) as {
        checkout_url?: string;
        redirect_url?: string;
        provider_payment_id?: string;
        provider_checkout_data?: {
          subscription_id?: string;
          key_id?: string;
          amount?: number;
          currency?: string;
        };
      };

      const redirectUrl = data.checkout_url || data.redirect_url;
      if (checkoutProvider === 'plisio' && redirectUrl) {
        if (typeof window === 'undefined') {
          toast.error('Checkout could not be initialized in this environment.');
          return;
        }
        if (!isSafeCheckoutRedirect(redirectUrl, checkoutProvider)) {
          toast.error('Received an invalid checkout redirect URL. Please contact support if this persists.');
          return;
        }

        const safeRedirect = new URL(redirectUrl, window.location.origin).toString();
        window.location.assign(safeRedirect);
        return;
      }

      if (checkoutProvider === 'plisio') {
        toast.error('Plisio checkout URL was not returned. Please try again in a moment.');
        return;
      }

      const subscriptionId = data.provider_checkout_data?.subscription_id;
      if (!subscriptionId || typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
        if (checkoutProvider === 'razorpay' && redirectUrl) {
          const safeRedirect = new URL(redirectUrl, window.location.origin).toString();
          window.location.assign(safeRedirect);
          return;
        }
        toast.error('Checkout could not be initialized. Please try again in a moment.');
        return;
      }

      const providerPaymentId = data.provider_payment_id;

      const razorpayKey = data.provider_checkout_data?.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error('Razorpay key is missing in environment configuration.');
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKey,
        subscription_id: subscriptionId,
        name: 'PipFactor AI',
        description: `${displayedPlanName} subscription`,
        handler: () => {
          toast.success('Payment submitted. We will confirm it after webhook verification.');
          setShowCheckoutModal(false);
          void refreshProfile();
        },
        modal: {
          ondismiss: () => {
            void (async () => {
              toast.info('Checkout closed before completion. Marking it as cancelled...');
              if (!providerPaymentId) return;

              const cancelResult = await apiService.cancelCheckoutAttempt('razorpay', providerPaymentId);
              if (cancelResult.error) {
                toast.error(cancelResult.error || 'Could not update checkout status.');
                return;
              }

              await Promise.all([loadBillingHistory(), refreshProfile()]);
            })();
          },
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

  const handleCancelPendingPaidAttempt = async () => {
    if (!pendingPaidRazorpayPaymentId) return;
    setCancelLoading(true);
    try {
      const cancelResult = await apiService.cancelCheckoutAttempt('razorpay', pendingPaidRazorpayPaymentId);
      if (cancelResult.error) {
        toast.error(cancelResult.error || 'Failed to cancel pending paid subscription attempt');
        return;
      }
      toast.success('Pending paid Razorpay subscription attempt cancelled. Trial remains unchanged.');
      await Promise.all([loadBillingHistory(), refreshProfile()]);
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
      getDisplayAmount(record).toFixed(2),
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

              <div className="group mt-6 border-t border-slate-800/60 pt-4 opacity-20 transition-opacity duration-700 hover:opacity-60">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Account Termination</span>
                  <DeleteAccountDialog userEmail={user.email || ''} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 pb-12">
          <div id="billing-history-section" className={glassCard}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3"><History className="h-5 w-5 text-slate-400" /><h3 className="text-lg font-bold text-slate-100">Billing History</h3></div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:text-slate-600" onClick={handleExportBillingHistory} disabled={razorpayHistory.length === 0} title={razorpayHistory.length === 0 ? 'No Razorpay transactions available for export' : 'Download Razorpay transactions as CSV'}><Download className="h-4 w-4" /></Button>
            </div>

            {billingError && <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{billingError}</div>}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-slate-800/60 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-semibold">Invoice / Description</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Amount</th><th className="px-4 py-3 font-semibold">Provider</th><th className="px-4 py-3 text-right font-semibold">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {billingLoading && billingHistory.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading billing history...</span></td></tr>
                  ) : billingHistory.length === 0 ? (
                    <tr><td colSpan={5} className="bg-slate-900/10 px-4 py-8 text-center italic text-slate-500">No payment history available. Records will appear here once you make a transaction.</td></tr>
                  ) : (
                    billingHistory.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3 text-slate-300">
                          <div className="flex flex-col gap-1">
                            <span>{record.description || record.external_payment_id || 'Subscription payment'}</span>
                            {resolveRecordAccessUrl(record) && (
                              <button
                                type="button"
                                className="w-fit text-xs font-semibold text-[#E2B485] hover:underline"
                                onClick={() => {
                                  const accessUrl = resolveRecordAccessUrl(record);
                                  const providerHint = (record.provider || '').toLowerCase().includes('plisio') ? 'plisio' : 'razorpay';
                                  if (!accessUrl || !openExternalLink(accessUrl, providerHint)) {
                                    toast.error('This invoice/access link is unavailable or invalid.');
                                  }
                                }}
                              >
                                {(record.provider || '').toLowerCase().includes('plisio') ? 'Open invoice' : 'Open billing link'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{new Date(record.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-200">{formatDisplayAmount(record)}</td>
                        <td className="px-4 py-3 text-slate-300">{record.provider || 'unknown'}</td>
                        <td className="px-4 py-3 text-right"><Badge className={cn('border', record.status === 'succeeded' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : record.status === 'pending' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300')}>{record.status}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {billingLoading && billingHistory.length > 0 && (
              <div className="mt-3 text-xs text-slate-500">Refreshing billing history in the background...</div>
            )}
          </div>

        </div>
      </div>

      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="lumina-card max-h-[85vh] overflow-y-auto border border-white/10 text-slate-100">
          <DialogHeader>
              <DialogTitle>Choose your payment method</DialogTitle>
              <DialogDescription className="text-slate-400">Select how you want to pay for your subscription.<br />You&apos;ll be redirected to a secure checkout page.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Selected Plan</p>
              <div className="mt-1 flex items-center justify-between gap-4">
                <p className="text-lg font-semibold text-white">{getPlanTier(normalizePlanName(checkoutPlanId)).displayName}</p>
                {selectedCheckoutPriceLabel && (
                  <p className="text-sm font-semibold text-[#E2B485]">{selectedCheckoutPriceLabel}</p>
                )}
              </div>
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
                  <div className="flex items-center justify-between"><div><p className="font-semibold text-slate-100">💳 Debit/Credit Card, UPI, Netbanking etc.</p><p className="text-xs text-slate-400">Powered by Razorpay</p></div><Badge className="border-[#E2B485]/40 bg-[#E2B485]/10 text-[#E2B485]">Razorpay</Badge></div>
                </button>
                <button type="button" onClick={() => setCheckoutProvider('plisio')} className={cn('w-full rounded-xl border p-3 text-left transition-colors', checkoutProvider === 'plisio' ? 'border-[#E2B485]/50 bg-[#E2B485]/10' : 'border-white/10 bg-white/5 hover:bg-white/10')}>
                  <div className="flex items-center justify-between"><div><p className="font-semibold text-slate-100">🪙 Crypto (USDT and supported chains)</p><p className="text-xs text-slate-400">Powered by Plisio</p></div><Badge className="border-[#C8935A]/40 bg-[#C8935A]/10 text-[#E2B485]">Plisio</Badge></div>
                </button>
              </div>
              {shouldBlockCheckout && (
                <p className="mt-3 text-center text-xs text-amber-300">
                  You already have a paid subscription purchase. Cancel the paid subscription first at Manage Billing.
                </p>
              )}
            </div>

          </div>

          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <Button type="button" variant="outline" className="min-w-[160px] border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" onClick={() => setShowCheckoutModal(false)}>Close</Button>
            <Button type="button" onClick={handleStartCheckout} className="lumina-button min-w-[200px]" disabled={startingCheckout || shouldBlockCheckout}>{startingCheckout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Continue to Checkout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManageBillingModal} onOpenChange={setShowManageBillingModal}>
        <DialogContent className="lumina-card max-h-[85vh] overflow-y-auto border border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle>Manage Billing Control Panel</DialogTitle>
            <DialogDescription className="text-slate-400">Update billing preferences and review payment status.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Plan Info</p>
              <div className="mt-2 flex items-center justify-between"><span className="text-base font-semibold text-slate-100">{displayedPlanName} Plan</span><span className="text-sm font-semibold text-[#E2B485]">{selectedCheckoutPriceLabel || '$0.00/month'}</span></div>
              <div className="mt-3 flex items-center justify-between"><span className="text-slate-400">Status</span><span className="font-semibold capitalize text-slate-100">{subscriptionStatus}</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-slate-400">Next billing</span><span className="font-semibold text-[#E2B485]">{subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'N/A'}</span></div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Payment Method</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">{paymentMethodLabel}</p>
              <p className="text-xs text-slate-400">{paymentMethodHint}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Payment Status</p>
              <p className="mt-2 text-sm text-slate-200">Last Payment</p>
              <p className="text-sm font-semibold text-slate-100">{latestPaymentAmountLabel ? `${latestPaymentAmountLabel} - ${latestPayment?.status || 'unknown'}` : 'No payment recorded yet'}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Billing History</p>
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-[#E2B485] hover:underline"
                onClick={() => {
                  setShowManageBillingModal(false);
                  const historySection = document.getElementById('billing-history-section');
                  historySection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {'View all payments ->'}
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Actions</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="cursor-not-allowed border-white/10 bg-white/5 text-slate-500" disabled>
                  Change Plan
                </Button>
                <Button
                  type="button"
                  className="border border-[#E2B485]/30 bg-transparent text-[#E2B485] hover:bg-[#E2B485]/10 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleResubscribeViaCheckout}
                  disabled={shouldBlockCheckout}
                >
                  Open Checkout
                </Button>
              </div>
              {shouldBlockCheckout && (
                <p className="mt-3 text-center text-xs text-amber-300">
                  You already have a paid subscription purchase. Cancel the paid subscription first, then start a new checkout.
                </p>
              )}
              {latestBillingAccessUrl && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                  onClick={() => {
                    if (!openExternalLink(latestBillingAccessUrl, isCryptoPaymentProvider ? 'plisio' : 'razorpay')) {
                      toast.error('This billing link appears invalid or blocked.');
                    }
                  }}
                >
                  {isCryptoPaymentProvider ? 'Open Latest Invoice' : 'Open Subscription Management'}
                </Button>
              )}
            </div>

            <div className="rounded-xl border border-[#C8935A]/30 bg-[#C8935A]/10 p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-[#E2B485]">Cancel</p>
              <p className="mt-2 text-xs text-slate-200">Access remains until {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'period end'}</p>
              <p className="text-xs text-slate-300">No further charges after cancellation</p>

              {hasCancelablePaidAttempt && (
                <Button type="button" onClick={() => void handleCancelPendingPaidAttempt()} className="mt-3 w-full bg-rose-600 text-white hover:bg-rose-700" disabled={cancelLoading}>{cancelLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Cancel Pending Paid Subscription</Button>
              )}

              {isCancellationPending ? (
                <div className="mt-3 rounded-lg border border-[#C8935A]/40 bg-[#C8935A]/10 p-3 text-xs text-[#E2B485]">Cancellation is already scheduled.</div>
              ) : null}

              {!isCancellationPending && Boolean(subscription && subscription.status === 'active') && (
                <Button type="button" onClick={() => void handleCancelSubscription()} className="mt-3 w-full bg-rose-600 text-white hover:bg-rose-700" disabled={cancelLoading}>{cancelLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Cancel Subscription</Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" onClick={() => setShowManageBillingModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
