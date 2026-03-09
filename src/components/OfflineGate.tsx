import { Outlet } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import Maintenance from '@/pages/Maintenance';

export const OfflineGate = () => {
  const { backendAvailable, backendError } = useAuth();

  if (!backendAvailable) {
    return <Maintenance errorCode={backendError?.status} />;
  }

  return <Outlet />;
};
