import { useSyncStatus } from '@/contexts/SyncContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTransparency } from '@/contexts/TransparencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SyncStatusIndicator() {
  const { syncStatus } = useSyncStatus();
  const { currentUser } = useAuth();
  const { autoSyncEnabled } = useTransparency();
  const [, setRefreshTrigger] = useState(0);

  // 动态刷新时间显示
  useEffect(() => {
    // 根据上次同步时间确定刷新频率
    const getRefreshInterval = () => {
      if (!syncStatus.lastSyncTime) return 60000; // 1分钟

      const now = new Date();
      const diff = Math.floor((now.getTime() - syncStatus.lastSyncTime.getTime()) / 1000);

      if (diff < 60) return 1000; // 小于1分钟时每秒刷新
      if (diff < 3600) return 60000; // 小于1小时时每分钟刷新
      return 300000; // 大于1小时时每5分钟刷新
    };

    let timeoutId: NodeJS.Timeout;

    const scheduleRefresh = () => {
      const interval = getRefreshInterval();
      timeoutId = setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
        scheduleRefresh();
      }, interval);
    };

    scheduleRefresh();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [syncStatus.lastSyncTime]);

  // 如果用户未登录，不显示同步状态
  if (!currentUser) return null;

  const formatLastSyncTime = (time: Date | null) => {
    if (!time) return '从未同步';

    const now = new Date();
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  const getStatusIcon = () => {
    if (syncStatus.syncInProgress) {
      return <i className="fa-solid fa-sync fa-spin text-blue-500"></i>;
    }
    if (syncStatus.syncError) {
      return <i className="fa-solid fa-exclamation-triangle text-red-500"></i>;
    }
    if (!syncStatus.isOnline) {
      return <i className="fa-solid fa-wifi-slash text-gray-500"></i>;
    }
    if (syncStatus.pendingChanges > 0) {
      return <i className="fa-solid fa-clock text-orange-500"></i>;
    }
    return <i className="fa-solid fa-check-circle text-green-500"></i>;
  };

  const getStatusText = () => {
    if (syncStatus.syncInProgress) return '同步中...';
    if (syncStatus.syncError) return '同步失败';
    if (!syncStatus.isOnline) return '离线模式';
    if (!autoSyncEnabled) return '手动同步';
    if (syncStatus.pendingChanges > 0) return `${syncStatus.pendingChanges} 个更改待同步`;
    return '自动同步';
  };

  const getStatusDetail = () => {
    if (syncStatus.syncError) return syncStatus.syncError;
    return `上次同步: ${formatLastSyncTime(syncStatus.lastSyncTime)}`;
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{getStatusText()}</span>
          </div>

          {/* 网络状态指示器 */}
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}
            ></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{syncStatus.isOnline ? '在线' : '离线'}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">{getStatusDetail()}</p>

        {/* 错误详情展示 */}
        <AnimatePresence>
          {syncStatus.syncError && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-2"
            >
              <p className="text-xs text-red-600 dark:text-red-400">
                <i className="fa-solid fa-info-circle mr-1"></i>
                {syncStatus.syncError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 同步进度条 */}
        <AnimatePresence>
          {syncStatus.syncInProgress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1"
            >
              <motion.div
                className="bg-blue-500 h-1 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
