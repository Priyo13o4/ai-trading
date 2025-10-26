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
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

interface AuthContextType {
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  profile: UserProfile | null;
  subscription: UserSubscription | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  canAccessSignals: boolean;
  signIn: (email: string, password: string) => Promise<AuthTokenResponse>;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthResponse>;
  signOut: (options?: { global?: boolean }) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const isMountedRef = useRef(true);
  const sessionRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }, []);

  const fetchSubscription = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_active_subscription', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      if (Array.isArray(data) && data.length > 0) {
        return data[0] as UserSubscription;
      }

      return null;
    } catch (error) {
      console.error('Subscription fetch error:', error);
      return null;
    }
  }, []);

  const hydrateSession = useCallback(
    async (nextSession: Session | null) => {
      const requestId = ++sessionRequestIdRef.current;

      if (!isMountedRef.current) {
        return;
      }

      if (!nextSession?.user) {
        if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
          return;
        }
        setStatus('unauthenticated');
        setUser(null);
        setSession(null);
        setAccessToken(null);
        setProfile(null);
        setSubscription(null);
        return;
      }

      setStatus('loading');
      setUser(nextSession.user);
      setSession(nextSession);
      setAccessToken(nextSession.access_token);

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
          setStatus('authenticated');
        }
      }
    },
    [fetchProfile, fetchSubscription]
  );

  const refreshProfile = useCallback(async () => {
    if (!session?.user || !isMountedRef.current) {
      return;
    }

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
          setStatus('unauthenticated');
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      hydrateSession(nextSession ?? null);
    });

    return () => {
      isSubscribed = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateSession]);

  const subscriptionTier: SubscriptionTier = useMemo(() => {
    const plan = subscription?.plan_name?.toLowerCase();
    if (plan === 'premium' || plan === 'enterprise' || plan === 'basic') {
      return plan as SubscriptionTier;
    }
    return 'free';
  }, [subscription]);

  const subscriptionStatus = subscription?.status || 'expired';
  const isAuthenticated = status === 'authenticated' && !!user;
  const qualifiesForSignals = !subscription || ['active', 'trial'].includes(subscription.status);
  const canAccessSignals = isAuthenticated && !!accessToken && qualifiesForSignals;

  const value = useMemo<AuthContextType>(
    () => ({
      status,
      isLoading: status === 'loading',
      isAuthenticated,
      user,
      session,
      accessToken,
      profile,
      subscription,
      subscriptionTier,
      subscriptionStatus,
      canAccessSignals,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [
      status,
      isAuthenticated,
      user,
      session,
      accessToken,
      profile,
      subscription,
      subscriptionTier,
      subscriptionStatus,
      canAccessSignals,
      signIn,
      signUp,
      signOut,
      refreshProfile,
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