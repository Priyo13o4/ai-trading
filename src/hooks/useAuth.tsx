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
import { isTurnstileEnabled } from '@/config/turnstile';
import { toast } from 'sonner';
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
type SubscriptionTier = 'free' | 'starter' | 'professional' | 'elite';

interface AuthContextType {
  status: AuthStatus;
  isLoading: boolean;
  isRefreshing: boolean;
  isAuthenticated: boolean;
  authResolved: boolean;
  backendAvailable: boolean;
  backendError: { status?: number; message?: string } | null;
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
  signIn: (email: string, password: string, captchaToken?: string, rememberMe?: boolean) => Promise<AuthTokenResponse>;
  signUp: (email: string, password: string, fullName?: string, captchaToken?: string) => Promise<AuthResponse>;
  signOut: (options?: { global?: boolean }) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOGOUT_BROADCAST_KEY = 'pipfactor-device-logout';
const SUPABASE_STORAGE_KEY = 'pipfactor-auth';
const AUTHDBG_ENABLED = ['1', 'true', 'yes', 'on'].includes(
  String(import.meta.env.VITE_AUTHDBG ?? '').toLowerCase()
);

const authdbg = (...args: unknown[]) => {
  if (!AUTHDBG_ENABLED) return;
  console.debug('AUTHDBG', ...args);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<{ status?: number; message?: string } | null>(null);
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
  const backendFailureCountRef = useRef(0);
  const recentInteractiveHydrateRef = useRef<{ accessToken: string; at: number } | null>(null);
  const logoutInProgressRef = useRef(false);
  const unauthorizedHandledAtRef = useRef(0);
  const invalidSessionToastShownRef = useRef(false);
  const invalidSessionModeRef = useRef(false);
  const validateInFlightRef = useRef<Promise<any> | null>(null);
  const validateCacheRef = useRef<{ at: number; result: any | null }>({ at: 0, result: null });
  const turnstileEnabled = useMemo(() => isTurnstileEnabled(), []);

  const normalizePlanToTier = useCallback((rawPlan?: string | null): SubscriptionTier => {
    const p = (rawPlan || '').toLowerCase().trim();
    if (!p || p === 'free') return 'free';
    if (p === 'starter' || p === 'basic') return 'starter';
    if (p === 'professional' || p === 'premium') return 'professional';
    if (p === 'elite' || p === 'enterprise') return 'elite';
    return 'free';
  }, []);

  const createBackendFallbackUser = useCallback((userId: string): User => {
    // Minimal typed user object for backend-cookie-authenticated tabs without Supabase session.
    return {
      id: userId,
      aud: 'authenticated',
      app_metadata: {
        provider: 'backend-cookie',
        providers: [],
      },
      user_metadata: {},
      created_at: new Date(0).toISOString(),
    } as User;
  }, []);

  const broadcastDeviceLogout = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const payload = JSON.stringify({ at: Date.now() });
      window.localStorage.setItem(LOGOUT_BROADCAST_KEY, payload);
    } catch {
      // Ignore storage errors and continue with local logout.
    }
  }, []);

  const clearLocalSupabaseSession = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.sessionStorage.removeItem(SUPABASE_STORAGE_KEY);
    } catch {
      // ignore
    }
    try {
      window.localStorage.removeItem(SUPABASE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

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

  useEffect(() => {
    window.addEventListener('auth:unauthorized', resetAuthData);
    return () => {
      window.removeEventListener('auth:unauthorized', resetAuthData);
      isMountedRef.current = false;
    };
  }, [resetAuthData]);

  useEffect(() => {
    currentAuthRef.current = { status, userId: user?.id ?? null };
  }, [status, user?.id]);

  const updateBackendAvailability = useCallback((statusCode?: number) => {
    if (typeof statusCode !== 'number') return;
    if (statusCode === 0 || statusCode === 408 || statusCode >= 500) {
      backendFailureCountRef.current += 1;
      setBackendAvailable(true);
      setBackendError({ status: statusCode, message: 'Lost connection to server, reconnecting.' });
      return;
    }
    backendFailureCountRef.current = 0;
    setBackendAvailable(true);
    setBackendError(null);
  }, []);

  const handleUnauthorizedSession = useCallback(async () => {
    const now = Date.now();
    if (!invalidSessionToastShownRef.current) {
      toast.error('Session no longer valid, please log in again.');
      invalidSessionToastShownRef.current = true;
    }

    if (now - unauthorizedHandledAtRef.current < 10_000) {
      invalidSessionModeRef.current = true;
      return;
    }
    unauthorizedHandledAtRef.current = now;
    invalidSessionModeRef.current = true;

    sessionRequestIdRef.current += 1;
    clearLocalSupabaseSession();
    resetAuthData();
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }, [clearLocalSupabaseSession, resetAuthData]);

  const isTransientBackendStatus = useCallback((statusCode?: number) => {
    if (typeof statusCode !== 'number') return false;
    return statusCode === 0 || statusCode === 408 || statusCode >= 500;
  }, []);

  const getValidatedBackendSession = useCallback(
    async (forceFresh: boolean = false) => {
      const now = Date.now();
      if (!forceFresh && validateCacheRef.current.result && now - validateCacheRef.current.at < 400) {
        return validateCacheRef.current.result;
      }

      if (validateInFlightRef.current) {
        return validateInFlightRef.current;
      }

      const req = apiService.authValidate().then((result) => {
        authdbg('event=fe.validate.result', {
          forceFresh,
          status: result.status,
          allowed: Boolean(result.data?.allowed),
          userPresent: Boolean(result.data?.user_id),
        });
        validateCacheRef.current = { at: Date.now(), result };
        return result;
      }).finally(() => {
        if (validateInFlightRef.current === req) {
          validateInFlightRef.current = null;
        }
      });

      validateInFlightRef.current = req;
      return req;
    },
    []
  );

  const fetchAuthState = useCallback(async () => {
    const validate = await getValidatedBackendSession();
    updateBackendAvailability(validate.status);

    if (validate.status === 401) {
      throw new Error('AUTH_UNAUTHORIZED');
    }

    if (!validate.data?.allowed) {
      return null;
    }

    if (validate.error) {
      if (isTransientBackendStatus(validate.status)) {
        return null;
      }
      throw new Error(validate.error);
    }

    const response = await apiService.authMe();
    updateBackendAvailability(response.status);

    if (response.status === 401) {
      throw new Error('AUTH_UNAUTHORIZED');
    }

    if (!response.data?.allowed) {
      return null;
    }

    if (response.error) {
      if (isTransientBackendStatus(response.status)) {
        return {
          userId: validate.data?.user_id as string,
          plan: (validate.data?.plan as string) || 'free',
          permissions: Array.isArray(validate.data?.permissions)
            ? (validate.data.permissions as string[])
            : [],
          profile: null,
          subscription: null,
        };
      }
      throw new Error(response.error);
    }

    return {
      userId: response.data?.user_id as string,
      plan: response.data?.plan as string,
      permissions: Array.isArray(response.data?.permissions)
        ? (response.data.permissions as string[])
        : [],
      profile: (response.data?.profile as UserProfile | null) || null,
      subscription: (response.data?.subscription as UserSubscription | null) || null,
    };
  }, [getValidatedBackendSession, isTransientBackendStatus, updateBackendAvailability]);

  const hydrateSession = useCallback(
    async (nextSession: Session | null, captchaToken?: string, rememberMe?: boolean) => {
      const requestId = ++sessionRequestIdRef.current;
      authdbg('event=fe.hydrate.start', {
        requestId,
        hasSupabaseSession: Boolean(nextSession?.user),
        userTail: String(nextSession?.user?.id || '').slice(-6),
      });

      if (!isMountedRef.current) {
        return;
      }

      if (logoutInProgressRef.current) {
          if (isMountedRef.current && requestId === sessionRequestIdRef.current) {
            resetAuthData();
            authdbg('event=fe.auth.transition', {
              requestId,
              action: 'resetAuthData',
              reason: 'logout_in_progress',
            });
          }
        return;
      }

      // No Supabase session in this tab: bootstrap from backend cookie auth first.
      if (!nextSession?.user) {
        try {
          let authState = await fetchAuthState();

          // A brief network hiccup should not force-log-out a valid cookie session.
          if (!authState) {
            const validate = await getValidatedBackendSession(true);
            if (isTransientBackendStatus(validate.status)) {
              await new Promise((resolve) => setTimeout(resolve, 250));
              authState = await fetchAuthState();
            }
          }

          if (!authState) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            authState = await fetchAuthState();
          }

          if (authState?.userId) {
            if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
              return;
            }

            setUser((prev) =>
              prev?.id === authState.userId ? prev : createBackendFallbackUser(authState.userId)
            );
            setSession(null);
            setPlan(authState.plan || 'free');
            setPermissions(authState.permissions);
            setProfile(authState.profile);
            setSubscription(authState.subscription);
            setProfileError(null);
            setSubscriptionError(null);
            setStatus('authenticated');
            setIsRefreshing(false);
            authdbg('event=fe.auth.transition', {
              requestId,
              action: 'set_authenticated',
              reason: 'cookie_bootstrap',
              userTail: String(authState.userId || '').slice(-6),
            });
            return;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'AUTH_UNAUTHORIZED') {
            await handleUnauthorizedSession();
            return;
          }
          // Ignore here and fall back to unauthenticated state below.
        }

        if (isMountedRef.current && requestId === sessionRequestIdRef.current) {
          resetAuthData();
        }
        return;
      }

      const wasAuthedSameUser = currentAuthRef.current.status === 'authenticated' && currentAuthRef.current.userId === nextSession.user.id;

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
      let lastBackendStatus: number | undefined;
      try {
        const validate = await getValidatedBackendSession(true);
        lastBackendStatus = validate.status;
        updateBackendAvailability(validate.status);
        if (validate.error && isTransientBackendStatus(validate.status)) {
          if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
            return;
          }
          setStatus('authenticated');
          setIsRefreshing(false);
          return;
        }
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
            // 🛡️ AI AUDIT SAFEGUARD: SERVER-SIDE TURNSTILE PASS-THROUGH
            // DO NOT pass `captchaToken` to authExchange! Leave it as `undefined`.
            // The Turnstile token is strictly single-use. It has already been consumed
            // by Supabase during `signInWithPassword`. If you send it to our Python backend,
            // Cloudflare will reject the duplicate verification with a 403 error,
            // preventing the user from receiving their session cookie.
            const exchangePromise = apiService.authExchange(nextSession.access_token, undefined, rememberMe);
            exchangeInFlightRef.current = exchangePromise;
            try {
              const exchangeResponse = await exchangePromise;
              lastBackendStatus = exchangeResponse?.status;
              updateBackendAvailability(exchangeResponse?.status);
              if (exchangeResponse?.error && isTransientBackendStatus(exchangeResponse.status)) {
                if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
                  return;
                }
                setStatus('authenticated');
                setIsRefreshing(false);
                return;
              }
              if (exchangeResponse?.error) {
                throw new Error(exchangeResponse.error);
              }
              const capWarning = exchangeResponse?.data?.session_cap_warning;
              if (capWarning?.code === 'session_cap_eviction') {
                const evictedCount = Number(capWarning?.evicted_count || 0);
                toast.warning(
                  evictedCount > 0
                    ? `${evictedCount} old device session${evictedCount > 1 ? 's were' : ' was'} removed due to your session cap.`
                    : 'An older device session was removed due to your session cap.'
                );
              }
              authdbg('event=fe.exchange.response', {
                requestId,
                status: exchangeResponse?.status,
                ok: !exchangeResponse?.error,
              });
            } finally {
              if (exchangeInFlightRef.current === exchangePromise) {
                exchangeInFlightRef.current = null;
                exchangeTokenRef.current = null;
              }
            }
          }

          let exchanged = await getValidatedBackendSession(true);
          lastBackendStatus = exchanged.status;
          updateBackendAvailability(exchanged.status);
          if (exchanged.status === 401) {
            await handleUnauthorizedSession();
            return;
          }
          if (exchanged.error && isTransientBackendStatus(exchanged.status)) {
            if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
              return;
            }
            setStatus('authenticated');
            setIsRefreshing(false);
            return;
          }

          if (!exchanged.data?.allowed) {
            // Mobile browsers can lag a beat before newly-set cookies are visible on follow-up calls.
            const retryDelaysMs = [150, 300];
            for (const delayMs of retryDelaysMs) {
              await new Promise((resolve) => setTimeout(resolve, delayMs));
              exchanged = await getValidatedBackendSession(true);
              lastBackendStatus = exchanged.status;
              updateBackendAvailability(exchanged.status);
              if (exchanged.status === 401) {
                await handleUnauthorizedSession();
                return;
              }

              if (exchanged.error && isTransientBackendStatus(exchanged.status)) {
                if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
                  return;
                }
                setStatus('authenticated');
                setIsRefreshing(false);
                return;
              }

              if (exchanged.data?.allowed) {
                break;
              }
            }
          }

          if (!exchanged.data?.allowed) {
            if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
              return;
            }

            // Do not keep optimistic authenticated UI when backend still rejects session.
            // This avoids post-login 401 storms and immediate auth divergence.
            authdbg('event=fe.auth.transition', {
              requestId,
              action: 'resetAuthData',
              reason: 'validate_not_allowed_after_exchange',
            });
            resetAuthData();
            return;
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
        if (isTransientBackendStatus(lastBackendStatus)) {
          setBackendAvailable(true);
          setBackendError({ status: lastBackendStatus, message: 'Lost connection to server, reconnecting.' });
          if (isMountedRef.current && requestId === sessionRequestIdRef.current) {
            // Preserve Supabase identity on transient backend/auth infra failures.
            setStatus('authenticated');
            setIsRefreshing(false);
          }
        } else {
          setBackendAvailable(true);
          setBackendError(null);
          if (isMountedRef.current && requestId === sessionRequestIdRef.current) {
            resetAuthData();
          }
        }
        return;
      }

      // Fetch profile/subscription from backend in the background.
      try {
        const authState = await fetchAuthState();

        if (!isMountedRef.current || requestId !== sessionRequestIdRef.current) {
          return;
        }

        setProfile(authState?.profile || null);
        setSubscription(authState?.subscription || null);
        if (authState?.plan) {
          setPlan(authState.plan);
        }
        if (authState?.permissions) {
          setPermissions(authState.permissions);
        }
      } catch (error) {
        console.error('Failed to hydrate auth session:', error);
        if (error instanceof Error && error.message === 'AUTH_UNAUTHORIZED') {
          await handleUnauthorizedSession();
          return;
        }
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
    [
      createBackendFallbackUser,
      fetchAuthState,
      getValidatedBackendSession,
      isTransientBackendStatus,
      resetAuthData,
      turnstileEnabled,
      updateBackendAvailability,
    ]
  );

  const refreshProfile = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setProfileError(null);
    setSubscriptionError(null);

    try {
      const authState = await fetchAuthState();

      if (!isMountedRef.current) {
        return;
      }

      if (!authState) {
        resetAuthData();
        return;
      }

      setUser((prev) =>
        prev?.id === authState.userId ? prev : createBackendFallbackUser(authState.userId)
      );
      setPlan(authState.plan || 'free');
      setPermissions(authState.permissions);
      setProfile(authState.profile || null);
      setSubscription(authState.subscription || null);
      setStatus('authenticated');
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_UNAUTHORIZED') {
        await handleUnauthorizedSession();
        return;
      }
      console.error('Failed to refresh profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to refresh profile';
      setProfileError(message);
    }
  }, [createBackendFallbackUser, fetchAuthState, handleUnauthorizedSession, resetAuthData]);

  const signIn = useCallback(
    async (email: string, password: string, captchaToken?: string, rememberMe?: boolean) => {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      const sessionData = response.data.session ?? null;
      if (!response.error && sessionData?.access_token) {
        recentInteractiveHydrateRef.current = {
          accessToken: sessionData.access_token,
          at: Date.now(),
        };
        await hydrateSession(sessionData, captchaToken, rememberMe);
      }

      return response;
    },
    [hydrateSession]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string, captchaToken?: string) => {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken,
          data: fullName ? { full_name: fullName } : undefined,
          // Dynamic redirect URL (works for both localhost and production)
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
        },
      });

      const sessionData = response.data.session ?? null;
      if (!response.error && sessionData?.access_token) {
        recentInteractiveHydrateRef.current = {
          accessToken: sessionData.access_token,
          at: Date.now(),
        };
        await hydrateSession(sessionData, captchaToken);
      }

      return response;
    },
    [hydrateSession]
  );

  const signOut = useCallback(
    async (options?: { global?: boolean }) => {
      const isGlobal = !!options?.global;
      logoutInProgressRef.current = true;
      let backendLogoutError: AuthError | null = null;

      try {
        const logoutResponse = await apiService.authLogout(isGlobal);
        const backendLogoutSucceeded = logoutResponse.status >= 200 && logoutResponse.status < 300;
        if (!backendLogoutSucceeded) {
          backendLogoutError = {
            name: 'BackendLogoutError',
            message: logoutResponse.error || 'Failed to end backend session. Please try again.',
            status: logoutResponse.status,
          } as AuthError;
        }
      } catch (error) {
        backendLogoutError = {
          name: 'BackendLogoutError',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to end backend session. Please try again.',
          status: 0,
        } as AuthError;
      }

      let supabaseError: AuthError | null = null;
      try {
        const supabaseResult = await supabase.auth.signOut({
          scope: isGlobal ? 'global' : 'local',
        });
        supabaseError = supabaseResult.error;
      } catch (error) {
        supabaseError = {
          name: 'SupabaseLogoutError',
          message: error instanceof Error ? error.message : 'Failed to clear local auth state.',
          status: 0,
        } as AuthError;
      }

      clearLocalSupabaseSession();

      sessionRequestIdRef.current += 1;
      resetAuthData();

      if (!isGlobal) {
        broadcastDeviceLogout();
      }

      if (!isGlobal) {
        logoutInProgressRef.current = false;
        if (backendLogoutError) {
          return { error: backendLogoutError };
        }
        return { error: supabaseError };
      }

      if (!backendLogoutError) {
        logoutInProgressRef.current = false;
        return { error: supabaseError };
      }

      if (!supabaseError) {
        logoutInProgressRef.current = false;
        return { error: backendLogoutError };
      }

      logoutInProgressRef.current = false;
      return {
        error: {
          ...supabaseError,
          name: 'SignOutError',
          message: `${backendLogoutError.message} Local sign out also failed: ${supabaseError.message}`,
          status: backendLogoutError.status,
        } as AuthError,
      };
    },
    [broadcastDeviceLogout, clearLocalSupabaseSession, resetAuthData]
  );

  const updateProfile = useCallback(
    async (fullName: string) => {
      try {
        const response = await apiService.authUpdateProfile(fullName);
        if (response.error) throw new Error(response.error);

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
        const response = await apiService.authUpdateEmail(newEmail);
        if (response.error) throw new Error(response.error);

        // Refresh profile to get updated data
        await refreshProfile();
      } catch (error) {
        console.error('Failed to update email:', error);
        throw error;
      }
    },
    [refreshProfile]
  );

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const response = await apiService.authUpdatePassword(newPassword);
      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let active = true;

    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) {
          return;
        }
        await hydrateSession(data.session ?? null);
      } catch (error) {
        console.error('Initial backend auth bootstrap error:', error);
        if (cancelled || !isMountedRef.current) {
          return;
        }

        try {
        const storedRemember = localStorage.getItem('auth_remember_me') === 'true';
        await hydrateSession(null, undefined, storedRemember);
      } catch (fallbackError) {
          console.error('Fallback backend auth bootstrap error:', fallbackError);
          if (isMountedRef.current) {
            resetAuthData();
          }
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Initial session is hydrated explicitly during provider initialization.
      if (!active || event === 'INITIAL_SESSION') {
        return;
      }
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
        return;
      }

      if (event === 'SIGNED_IN' && nextSession?.access_token) {
        const recent = recentInteractiveHydrateRef.current;
        const storedRemember = localStorage.getItem('auth_remember_me') === 'true';
        if (
          recent &&
          recent.accessToken === nextSession.access_token &&
          Date.now() - recent.at < 30000
        ) {
          // This SIGNED_IN event is from the same interactive sign-in we just handled.
          // Extend to 30 s to cover Supabase token refresh delay.
          // DO NOT clear this too early or background refreshes might overwrite the TTL.
          return;
        }
        void hydrateSession(nextSession, undefined, storedRemember);
        return;
      }

      void hydrateSession(nextSession ?? null, undefined, localStorage.getItem('auth_remember_me') === 'true');
    });

    void initializeAuth();

    return () => {
      cancelled = true;
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrateSession, resetAuthData]);

  useEffect(() => {
    if (!invalidSessionModeRef.current) {
      return;
    }

    let active = true;
    const probe = async () => {
      if (!active || !isMountedRef.current) {
        return;
      }
      if (logoutInProgressRef.current) {
        return;
      }

      try {
        const rememberMe = localStorage.getItem('auth_remember_me') === 'true';
        const { data } = await supabase.auth.getSession();
        if (!active || !isMountedRef.current) {
          return;
        }
        await hydrateSession(data.session ?? null, undefined, rememberMe);
      } catch {
        // Keep probing every 10s while invalid session mode is active.
      }
    };

    const intervalId = window.setInterval(() => {
      void probe();
    }, 10_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [hydrateSession, status]);

  useEffect(() => {
    if (status === 'authenticated') {
      invalidSessionModeRef.current = false;
      invalidSessionToastShownRef.current = false;
    }
  }, [status]);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOGOUT_BROADCAST_KEY || !event.newValue) {
        return;
      }
      logoutInProgressRef.current = true;
      sessionRequestIdRef.current += 1;
      clearLocalSupabaseSession();
      resetAuthData();
      void supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      logoutInProgressRef.current = false;
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [clearLocalSupabaseSession, resetAuthData]);

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
      backendError,
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
      updatePassword,
    }),
    [
      status,
      isRefreshing,
      isAuthenticated,
      authResolved,
      backendAvailable,
      backendError,
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
      updatePassword,
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