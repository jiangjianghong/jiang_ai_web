import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WebsiteData } from '@/lib/supabaseSync';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  localWebsites: WebsiteData[];
  cloudWebsites: WebsiteData[];
  onChoice: (choice: 'local' | 'cloud' | 'merge') => void;
}

export default function DataSyncModal({
  isOpen,
  onClose,
  localWebsites,
  cloudWebsites,
  onChoice,
}: DataSyncModalProps) {
  const [loading, setLoading] = useState(false);

  // ESC键关闭模态框
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChoice = async (choice: 'local' | 'cloud' | 'merge') => {
    setLoading(true);
    try {
      await onChoice(choice);
      onClose();
    } catch (error) {
      console.error('处理数据同步失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="w-full max-w-[384px] mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-100">数据同步选择</h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={loading}
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-2 pb-6 space-y-4 overflow-y-auto">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              <i className="fa-solid fa-info-circle mr-2"></i>
              检测到您有本地数据和云端数据，请选择如何处理：
            </p>
          </div>

          <div className="space-y-3">
            {/* 本地数据信息 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <i className="fa-solid fa-computer mr-2"></i>本地数据
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">{localWebsites.length} 个网站卡片</p>
            </div>

            {/* 云端数据信息 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <i className="fa-solid fa-cloud mr-2"></i>云端数据
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">{cloudWebsites.length} 个网站卡片</p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            {/* 使用云端数据 */}
            <button
              onClick={() => handleChoice('cloud')}
              disabled={loading}
              className="w-full p-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="flex items-start space-x-3">
                <i className="fa-solid fa-cloud-arrow-down text-lg mt-1"></i>
                <div>
                  <div className="font-medium">使用云端数据</div>
                  <div className="text-xs text-blue-100">本地数据将被云端数据覆盖</div>
                </div>
              </div>
            </button>

            {/* 使用本地数据 */}
            <button
              onClick={() => handleChoice('local')}
              disabled={loading}
              className="w-full p-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="flex items-start space-x-3">
                <i className="fa-solid fa-cloud-arrow-up text-lg mt-1"></i>
                <div>
                  <div className="font-medium">使用本地数据</div>
                  <div className="text-xs text-green-100">本地数据将同步到云端，覆盖云端数据</div>
                </div>
              </div>
            </button>

            {/* 智能合并 */}
            <button
              onClick={() => handleChoice('merge')}
              disabled={loading}
              className="w-full p-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="flex items-start space-x-3">
                <i className="fa-solid fa-code-merge text-lg mt-1"></i>
                <div>
                  <div className="font-medium">智能合并</div>
                  <div className="text-xs text-purple-100">
                    保留访问次数更高的网站卡片，去除重复项
                  </div>
                </div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              <span className="text-sm text-gray-600 dark:text-gray-400">处理中...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
