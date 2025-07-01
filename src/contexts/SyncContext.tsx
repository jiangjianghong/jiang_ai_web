import { createContext, useContext, useState, ReactNode } from 'react';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  syncInProgress: boolean;
  syncError: string | null;
  pendingChanges: number;
}

interface SyncContextType {
  syncStatus: SyncStatus;
  updateSyncStatus: (status: Partial<SyncStatus>) => void;
  resetSyncStatus: () => void;
}

const defaultSyncStatus: SyncStatus = {
  isOnline: navigator.onLine,
  lastSyncTime: null,
  syncInProgress: false,
  syncError: null,
  pendingChanges: 0
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function useSyncStatus() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncStatus must be used within a SyncProvider');
  }
  return context;
}

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);

  const updateSyncStatus = (status: Partial<SyncStatus>) => {
    setSyncStatus(prev => ({ ...prev, ...status }));
  };

  const resetSyncStatus = () => {
    setSyncStatus(defaultSyncStatus);
  };

  // 监听网络状态变化
  window.addEventListener('online', () => {
    updateSyncStatus({ isOnline: true });
  });

  window.addEventListener('offline', () => {
    updateSyncStatus({ isOnline: false });
  });

  const value: SyncContextType = {
    syncStatus,
    updateSyncStatus,
    resetSyncStatus
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}
