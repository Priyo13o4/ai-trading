import { Outlet } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import Maintenance from '@/pages/Maintenance';

export const OfflineGate = () => {
  const { backendAvailable, backendError } = useAuth();

  if (!backendAvailable) {
    return <Maintenance errorCode={503} />;
  }

  return <Outlet />;
};
