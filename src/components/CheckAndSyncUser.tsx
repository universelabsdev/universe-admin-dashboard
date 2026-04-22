import React from 'react';
import { useUser } from '@/hooks/useUser';

export function CheckAndSyncUser({ children }: { children: React.ReactNode }) {
  // useUser hook handles the Check & Sync logic on app load
  useUser();

  return <>{children}</>;
}
