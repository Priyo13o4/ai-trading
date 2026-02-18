import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/api';
import type {
  AuthError,
  AuthResponse,
  AuthTokenResponse,
  Session,
  User,
} from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  plan_name?: string;
  plan_display_name?: string;
  is_current?: boolean; // Added: true if subscription is still valid
  days_remaining?: number; // Added: can be negative if expired
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type SubscriptionTier = 'free' | 'starter' | 'professional' | 'elite' | 'beta';

interface AuthContextType {
  status: AuthStatus;
  isLoading: boolean;
  isRefreshing: boolean;
  isAuthenticated: boolean;
  authResolved: boolean;
  backendAvailable: boolean;
  user: User | null;
  session: Session | null;
  plan: string;
  permissions: string[];
  profile: UserProfile | null;
  subscription: UserSubscription | null;
  profileError: string | null;
  subscriptionError: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  canAccessSignals: boolean;
  signIn: (email: string, password: string) => Promise<AuthTokenResponse>;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthResponse>;
  signOut: (options?: { global?: boolean }) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<string>('free');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const currentAuthRef = useRef<{ status: AuthStatus; userId: string | null }>({
    status: 'loading',
    userId: null,
  });
  const isMountedRef = useRef(true);
  const sessionRequestIdRef = useRef(0);
  const exchangeInFlightRef = useRef<Promise<any> | null>(null);
  const exchangeTokenRef = useRef<string | null>(null);

  const normalizePlanToTier = useCallback((rawPlan?: string | null): SubscriptionTier => {
    const p = (rawPlan || '').toLowerCase().trim();
    if (!p || p === 'free') return 'free';
    if (p === 'beta') return 'beta';
    if (p === 'starter' || p === 'basic') return 'starter';
    if (p === 'professional' || p === 'premium') return 'professional';
    if (p === 'elite' || p === 'enterprise') return 'elite';
    return 'free';
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    currentAuthRef.current = { status, userId: user?.id ?? null };
  }, [status, user?.id]);

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        // Use auth.users data from the session instead of querying profiles table
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!user || user.id !== userId) {
          setProfileError('User not found');
          return null;
        }

        // Map auth.users data to UserProfile structure
        const profile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_active: true, // User is active if they can fetch their session
          email_verified: !!user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
        };

        setProfileError(null);
        return profile;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load profile';
        setProfileError(message);
        console.error('Profile fetch error:', error);
        return null;
      }
    },
    []
  );

  const fetchSubscription = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase.rpc('get_active_subscription', {
          p_user_id: userId,
        });

        // Handle 503 errors gracefully (function might not exist in DB yet)
        if (error) {
          // Don't treat missing function as critical error
          if (error.code === 'PGRST002' || error.message?.includes('schema cache')) {
            console.warn('Subscription function unavailable, using fallback');
            setSubscriptionError(null); // Clear error - this is not critical
            return null; // Return null subscription (free tier)
          }
          throw error;
        }

        if (Array.isArray(data) && data.length > 0) {
          setSubscriptionError(null);
          return data[0] as UserSubscription;
        }

        setSubscriptionError(null);
        return null;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load subscription';
        setSubscriptionError(message);
        console.warn('Subscription fetch error (non-critical):', error);
        return null; // Gracefully degrade to free tier
      }
    },
    []
  );

  const resetAuthData = useCallback(() => {
    setStatus('unauthenticated');
    setIsRefreshing(false);
    setUser(null);
    setSession(null);
    setPlan('free');
    setPermissions([]);
    setProfile(null);
    setSubscription(null);
    setProfileError(null);
    setSubscriptionError(null);
  }, []);

  const updateBackendAvailability = useCallback((statusCode?: number) => {
    if (typeof statusCode !== 'number') return;
    if (statusCode === 0 || statusCode === 408 || statusCode >= 500) {
      setBackendAvailable(false);
      return;
    }
    setBackendAvailable(true);
  }, []);

  const hydrateSession = useCallback(
    async (nextSession: Session | null) => {
      const requestId = ++sessionRequestIdRef.current;

      if (!isMountedRef.current) {
        return;
      }

      // Handle logout/unauthenticated state
      if (!nextSession?.user) {
        // Best-effort: clear backend cookie session too.
        try {
          await apiService.authLogout(false);
        } catch {
          // ignore
        }
        resetAuthData();
        return;
      }

      const wasAuthedSameUser =
        currentAuthRef.current.status === 'authenticated' &&
        currentAuthRef.current.userId === nextSession.user.id;

      // Set user data immediately so UI can show authenticated state
      setUser(nextSession.user);
      setSession(nextSession);
      // Avoid UI flicker on route changes/tab refocus: if we're already authenticated
      // for this same user, keep rendering and revalidate in the background.
      if (wasAuthedSameUser) {
        setIsRefreshing(true);
      } else {
        setStatus('loading');
      }
      setProfileError(null);
      setSubscriptionError(null);

      // Ensure backend cookie session exists (validate first, then exchange if needed)
      try {
        const validate = await apiService.authValidate();
        updateBackendAvailability(validate.status);
        const allowed = !!validate.data?.allowed;
        const validatedUserId = validate.data?.user_id;

        if (allowed && validatedUserId === nextSession.user.id) {
          if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
            return;
          }
          setPlan(validate.data?.plan || 'free');
          setPermissions(Array.isArray(validate.data?.permissions) ? validate.data.permissions : []);
          setStatus('authenticated');
          setIsRefreshing(false);
        } else {
          // De-dupe exchange calls (Supabase can trigger hydration twice on load).
          if (
            exchangeInFlightRef.current &&
            exchangeTokenRef.current === nextSession.access_token
          ) {
            await exchangeInFlightRef.current;
          } else {
            exchangeTokenRef.current = nextSession.access_token;
            exchangeInFlightRef.current = apiService.authExchange(nextSession.access_token);
            const exchangeResponse = await exchangeInFlightRef.current;
            updateBackendAvailability(exchangeResponse?.status);
            exchangeInFlightRef.current = null;
          }

          const exchanged = await apiService.authValidate();
          updateBackendAvailability(exchanged.status);
          if (!exchanged.data?.ok) {
            // authValidate doesn't return ok; treat allowed=false as failure
            if (!exchanged.data?.allowed) {
              throw new Error(exchanged.error || 'Session exchange failed');
            }
          }

          if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
            return;
          }

          setPlan(exchanged.data?.plan || 'free');
          setPermissions(Array.isArray(exchanged.data?.permissions) ? exchanged.data.permissions : []);
          setStatus('authenticated');
          setIsRefreshing(false);
        }
      } catch (error) {
        console.error('Backend session exchange/validate failed:', error);
        setBackendAvailable(false);
        if (isMountedRef.current && requestId === sessionRequestIdRef.current) {
          // Keep the Supabase session in memory, but treat backend auth as failed.
          setPlan('free');
          setPermissions([]);
          setStatus('unauthenticated');
          setIsRefreshing(false);
        }
        return;
      }

      // Fetch profile and subscription in the background (non-blocking)
      try {
        const [profileData, subscriptionData] = await Promise.all([
          fetchProfile(nextSession.user.id),
          fetchSubscription(nextSession.user.id),
        ]);

        if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
          return;
        }

        setProfile(profileData);
        setSubscription(subscriptionData);
      } catch (error) {
        console.error('Failed to hydrate auth session:', error);
        if (isMountedRef.current && requestId === sessionRequestIdRef.current) {
          setProfile(null);
          setSubscription(null);
        }
      } finally {
        if (isMountedRef.current && requestId === sessionRequestIdRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [fetchProfile, fetchSubscription, resetAuthData]
  );

  const refreshProfile = useCallback(async () => {
    if (!session?.user || !isMountedRef.current) {
      return;
    }

    setProfileError(null);
    setSubscriptionError(null);

    try {
      const [profileData, subscriptionData] = await Promise.all([
        fetchProfile(session.user.id),
        fetchSubscription(session.user.id),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setProfile(profileData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, [session, fetchProfile, fetchSubscription]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!response.error) {
        await hydrateSession(response.data.session ?? null);
      }

      return response;
    },
    [hydrateSession]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
          // Dynamic redirect URL (works for both localhost and production)
          emailRedirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/auth/callback`
            : undefined,
        },
      });

      if (!response.error) {
        await hydrateSession(response.data.session ?? null);
      }

      return response;
    },
    [hydrateSession]
  );

  const signOut = useCallback(
    async (options?: { global?: boolean }) => {
      try {
        // Best-effort: clear backend session(s)
        try {
          await apiService.authLogout(!!options?.global);
        } catch {
          // ignore
        }

        const result = await supabase.auth.signOut({
          scope: options?.global ? 'global' : 'local',
        });

        if (!result.error) {
          await hydrateSession(null);
        }

        return result;
      } catch (error) {
        console.error('Sign out error:', error);
        return { error: error as AuthError };
      }
    },
    [hydrateSession]
  );

  const updateProfile = useCallback(
    async (fullName: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        if (error) throw error;

        // Refresh profile to get updated data
        await refreshProfile();
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },
    [refreshProfile]
  );

  const updateEmail = useCallback(
    async (newEmail: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          email: newEmail,
        });

        if (error) throw error;

        // Refresh profile to get updated data
        await refreshProfile();
      } catch (error) {
        console.error('Failed to update email:', error);
        throw error;
      }
    },
    [refreshProfile]
  );

  useEffect(() => {
    let isSubscribed = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        if (isSubscribed) {
          hydrateSession(initialSession ?? null);
        }
      })
      .catch((error) => {
        console.error('Initial session fetch error:', error);
        if (isMountedRef.current) {
          resetAuthData();
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      hydrateSession(nextSession ?? null);
    });

    return () => {
      isSubscribed = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateSession, resetAuthData]);

  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      const response = await apiService.healthCheck();
      if (!active) return;
      updateBackendAvailability(response.status);
    };

    void checkHealth();

    const intervalId = window.setInterval(checkHealth, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [updateBackendAvailability]);

  const subscriptionTier: SubscriptionTier = useMemo(() => {
    // Prefer backend plan (authoritative for what the API will allow)
    const tierFromBackend = normalizePlanToTier(plan);
    if (tierFromBackend !== 'free') return tierFromBackend;
    return normalizePlanToTier(subscription?.plan_name);
  }, [normalizePlanToTier, plan, subscription?.plan_name]);

  const subscriptionStatus = subscription?.status || (permissions.includes('signals') ? 'active' : 'expired');
  const isAuthenticated = status === 'authenticated' && !!user;
  const authResolved = status !== 'loading';
  const canAccessSignals = isAuthenticated && permissions.includes('signals');

  const value = useMemo<AuthContextType>(
    () => ({
      status,
      isLoading: status === 'loading',
      isRefreshing,
      isAuthenticated,
      authResolved,
      backendAvailable,
      user,
      session,
      plan,
      permissions,
      profile,
      subscription,
      profileError,
      subscriptionError,
      subscriptionTier,
      subscriptionStatus,
      canAccessSignals,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      updateEmail,
    }),
    [
      status,
      isRefreshing,
      isAuthenticated,
      authResolved,
      backendAvailable,
      user,
      session,
      plan,
      permissions,
      profile,
      subscription,
      profileError,
      subscriptionError,
      subscriptionTier,
      subscriptionStatus,
      canAccessSignals,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      updateEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};