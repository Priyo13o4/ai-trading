import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Maintenance from '@/pages/Maintenance';

export const ProtectedRoute = () => {
  const { isAuthenticated, authResolved, isRefreshing, backendAvailable, backendError, subscriptionStatus } = useAuth();
  const location = useLocation();

  const isTransientStatus = (status?: number) =>
    typeof status === 'number' && (status === 0 || status === 408 || status >= 500);

  if (!backendAvailable && !isTransientStatus(backendError?.status)) {
    return <Maintenance errorCode={backendError?.status} />;
  }

  if (isAuthenticated) {
    if (
      subscriptionStatus === 'expired' &&
      location.pathname !== '/news' &&
      location.pathname !== '/profile' &&
      location.pathname !== '/signal' &&
      location.pathname !== '/strategy'
    ) {
      return <Navigate to="/pricing?trial_expired=true" replace />;
    }

    return <Outlet />;
  }

  if (!authResolved || isRefreshing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return null;
};