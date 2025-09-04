import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
  pendingChanges: 0,
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

  const updateSyncStatus = useCallback((status: Partial<SyncStatus>) => {
    setSyncStatus((prev) => ({ ...prev, ...status }));
  }, []);

  const resetSyncStatus = useCallback(() => {
    setSyncStatus(defaultSyncStatus);
  }, []);

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      updateSyncStatus({ isOnline: true, syncError: null });
      console.log('🌐 网络已连接，同步功能恢复');
    };

    const handleOffline = () => {
      updateSyncStatus({
        isOnline: false,
        syncError: '网络连接断开，同步功能暂停',
        syncInProgress: false,
      });
      console.log('📴 网络连接断开，同步功能暂停');
    };

    // 添加网络监听器
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始化网络状态
    updateSyncStatus({ isOnline: navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value: SyncContextType = {
    syncStatus,
    updateSyncStatus,
    resetSyncStatus,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
