import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Maintenance from '@/pages/Maintenance';

export const ProtectedRoute = () => {
  const { isAuthenticated, authResolved, isRefreshing, backendAvailable, backendError } = useAuth();
  const [sseDisconnected, setSseDisconnected] = useState(false);

  const isTransientStatus = (status?: number) =>
    typeof status === 'number' && (status === 0 || status === 408 || status >= 500);

  const showReconnectBanner =
    sseDisconnected || isTransientStatus(backendError?.status) || (isAuthenticated && isRefreshing);

  useEffect(() => {
    const onLost = () => setSseDisconnected(true);
    const onRestored = () => setSseDisconnected(false);

    window.addEventListener('app:connection-lost', onLost);
    window.addEventListener('app:connection-restored', onRestored);

    return () => {
      window.removeEventListener('app:connection-lost', onLost);
      window.removeEventListener('app:connection-restored', onRestored);
    };
  }, []);

  if (!backendAvailable && !isTransientStatus(backendError?.status)) {
    return <Maintenance errorCode={backendError?.status} />;
  }

  if (isAuthenticated) {
    return (
      <>
        {showReconnectBanner && (
          <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Lost connection to server, reconnecting.
            </div>
          </div>
        )}
        <Outlet />
      </>
    );
  }

  if (!authResolved || isRefreshing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return null;
};