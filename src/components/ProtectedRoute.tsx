import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Maintenance from '@/pages/Maintenance';
import SubscriptionGate from '@/pages/SubscriptionGate';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const SESSION_CONSISTENCY_TIMEOUT_MS = 3000;
const AUTH_PENDING_TIMEOUT_MS = 8000;

export const ProtectedRoute = () => {
  const { isAuthenticated, authResolved, isRefreshing, backendAvailable, backendError, subscriptionStatus } = useAuth();
  const location = useLocation();
  const [waitingForSessionConsistency, setWaitingForSessionConsistency] = useState(false);
  const [sessionConsistencyTimedOut, setSessionConsistencyTimedOut] = useState(false);
  const [pendingAuthTimedOut, setPendingAuthTimedOut] = useState(false);

  // When useVerification redirects to a protected route, it might happen before useAuth 
  // has finished hydrating the backend session. This useEffect prevents a premature 
  // bounce to the homepage by directly checking Supabase's native session state.
  useEffect(() => {
    let isMounted = true;

    if (authResolved && !isRefreshing && !isAuthenticated) {
      setWaitingForSessionConsistency(true);
      setSessionConsistencyTimedOut(false);

      const timeoutId = window.setTimeout(() => {
        if (!isMounted) {
          return;
        }
        setSessionConsistencyTimedOut(true);
        setWaitingForSessionConsistency(false);
      }, SESSION_CONSISTENCY_TIMEOUT_MS);

      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          if (!isMounted) {
            return;
          }

          const shouldWait = !!session;
          setWaitingForSessionConsistency(shouldWait);
          if (!shouldWait) {
            window.clearTimeout(timeoutId);
          }
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }
          window.clearTimeout(timeoutId);
          setWaitingForSessionConsistency(false);
        });

      return () => {
        isMounted = false;
        window.clearTimeout(timeoutId);
      };
    } else {
      setWaitingForSessionConsistency(false);
      setSessionConsistencyTimedOut(false);
    }

    return () => {
      isMounted = false;
    };
  }, [authResolved, isRefreshing, isAuthenticated]);

  useEffect(() => {
    const hasPendingAuth = !isAuthenticated && (!authResolved || isRefreshing || waitingForSessionConsistency);

    if (!hasPendingAuth) {
      setPendingAuthTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingAuthTimedOut(true);
    }, AUTH_PENDING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authResolved, isAuthenticated, isRefreshing, waitingForSessionConsistency]);

  const isTransientStatus = (status?: number) =>
    typeof status === 'number' && (status === 0 || status === 408 || status >= 500);

  const shouldRouteToMaintenance = !backendAvailable || isTransientStatus(backendError?.status);

  if (!isAuthenticated && (sessionConsistencyTimedOut || pendingAuthTimedOut)) {
    return shouldRouteToMaintenance
      ? <Navigate to="/maintenance" replace state={{ from: location }} />
      : <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!backendAvailable && !isTransientStatus(backendError?.status)) {
    return <Maintenance errorCode={backendError?.status} />;
  }

  if (isAuthenticated) {
    const isExpired = subscriptionStatus === 'expired';
    const isGatedPath = location.pathname === '/signal' || location.pathname === '/strategy';

    if (isExpired && isGatedPath) {
      return <SubscriptionGate />;
    }

    return <Outlet />;
  }

  if (!authResolved || isRefreshing) {
    return null;
  }

  if (!isAuthenticated) {
    if (waitingForSessionConsistency) {
      return null;
    }
    return <Navigate to="/" replace />;
  }

  return null;
};