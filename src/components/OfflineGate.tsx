import { Outlet } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import Maintenance from '@/pages/Maintenance';

export const OfflineGate = () => {
  const { backendAvailable } = useAuth();

  if (!backendAvailable) {
    return <Maintenance />;
  }

  return <Outlet />;
};
