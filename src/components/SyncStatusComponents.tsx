import { motion, AnimatePresence } from 'framer-motion';
import { useIncrementalSync } from '@/hooks/useIncrementalSync';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ProgressBar, LoadingSpinner } from '@/components/MicroInteractions';

interface SyncStatusDisplayProps {
  websites: any[];
  settings: any;
  className?: string;
}

export function SyncStatusDisplay({ websites, settings, className = '' }: SyncStatusDisplayProps) {
  const { currentUser } = useAuth();
  const { syncState, performSync, canSync, resetSync } = useIncrementalSync(websites, settings);

  if (!currentUser?.email_confirmed_at) {
    return null;
  }

  const getStatusIcon = () => {
    switch (syncState.status) {
      case 'syncing': return <LoadingSpinner size="sm" color="text-blue-500" />;
      case 'success': return <i className="fa-solid fa-check text-green-500"></i>;
      case 'error': return <i className="fa-solid fa-exclamation-triangle text-red-500"></i>;
      case 'conflict': return <i className="fa-solid fa-code-merge text-yellow-500"></i>;
      default: return <i className="fa-solid fa-cloud text-gray-400"></i>;
    }
  };

  const getStatusColor = () => {
    switch (syncState.status) {
      case 'syncing': return 'border-blue-500/30 bg-blue-500/10';
      case 'success': return 'border-green-500/30 bg-green-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      case 'conflict': return 'border-yellow-500/30 bg-yellow-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <motion.div
      className={`${className} ${getStatusColor()} backdrop-blur-sm rounded-lg border p-3`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div className="text-sm">
            <div className="font-medium text-white/90">
              数据同步
              {syncState.pendingChanges > 0 && (
                <span className="ml-1 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                  {syncState.pendingChanges}
                </span>
              )}
            </div>
            <div className="text-xs text-white/60">
              {syncState.message || '数据已同步'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {syncState.lastSyncTime && (
            <span className="text-xs text-white/50">
              {new Date(syncState.lastSyncTime).toLocaleTimeString()}
            </span>
          )}
          
          {canSync && syncState.pendingChanges > 0 && (
            <button
              onClick={performSync}
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
            >
              同步
            </button>
          )}
          
          {syncState.status === 'error' && (
            <button
              onClick={resetSync}
              className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* 同步进度条 */}
      <AnimatePresence>
        {syncState.isActive && (
          <motion.div
            className="mt-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProgressBar
              progress={syncState.progress}
              height={2}
              color="bg-blue-500"
              backgroundColor="bg-white/20"
              animated={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 冲突解决界面 */}
      <AnimatePresence>
        {syncState.status === 'conflict' && syncState.conflictData && (
          <motion.div
            className="mt-3 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-sm">
              <div className="font-medium text-yellow-200 mb-2">数据冲突</div>
              <div className="text-xs text-yellow-100 mb-3">
                检测到本地和云端数据不一致，请选择保留哪个版本：
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded">
                  保留本地
                </button>
                <button className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded">
                  使用云端
                </button>
                <button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-xs py-1 px-2 rounded">
                  智能合并
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface DetailedSyncStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DetailedSyncStats({ isOpen, onClose }: DetailedSyncStatsProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">同步统计</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          <div className="space-y-4">
            {/* 同步状态概览 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">状态概览</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">最后同步:</span>
                  <div className="font-medium">2小时前</div>
                </div>
                <div>
                  <span className="text-gray-600">同步频率:</span>
                  <div className="font-medium">每30秒</div>
                </div>
                <div>
                  <span className="text-gray-600">待同步项:</span>
                  <div className="font-medium">3 项变更</div>
                </div>
                <div>
                  <span className="text-gray-600">网络状态:</span>
                  <div className="font-medium text-green-600">在线</div>
                </div>
              </div>
            </div>

            {/* 同步历史 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">最近同步记录</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {[
                  { time: '14:30', status: 'success', message: '同步完成 - 3项更新' },
                  { time: '14:00', status: 'success', message: '同步完成 - 1项更新' },
                  { time: '13:30', status: 'conflict', message: '解决冲突 - 智能合并' },
                  { time: '13:00', status: 'error', message: '网络错误 - 已重试' },
                ].map((record, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-500 w-12">{record.time}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      record.status === 'success' ? 'bg-green-500' :
                      record.status === 'conflict' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="flex-1">{record.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 数据统计 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">数据统计</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 rounded p-3">
                  <div className="text-blue-600 font-medium">网站收藏</div>
                  <div className="text-2xl font-bold text-blue-800">24</div>
                  <div className="text-blue-600 text-xs">本地 + 云端</div>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <div className="text-green-600 font-medium">数据大小</div>
                  <div className="text-2xl font-bold text-green-800">2.1KB</div>
                  <div className="text-green-600 text-xs">已压缩</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
