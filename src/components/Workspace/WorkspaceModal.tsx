import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

// 导航组件
import CategoryTabs from './Navigation/CategoryTabs';
import SearchBar from './Navigation/SearchBar';
import ViewSwitcher from './Navigation/ViewSwitcher';

// 视图组件
import ListView from './Views/ListView';
import CardView from './Views/CardView';

// 其他组件
import WorkspaceSettings from './WorkspaceSettings';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function WorkspaceModalComponent({ isOpen, onClose }: WorkspaceModalProps) {
  const {
    workspaceItems,
    isLoading,
    error,
    isConfigured,
    lastSync,
    viewType,
    selectedCategory,
    filteredItems,
    refreshItems
  } = useWorkspace();

  const { isMobile } = useResponsiveLayout();
  const [showSettings, setShowSettings] = useState(false);

  // 键盘导航
  useKeyboardNavigation({ 
    isEnabled: isOpen && !showSettings,
    onEscape: onClose 
  });

  // 如果未配置，默认显示设置
  useEffect(() => {
    if (isOpen && !isConfigured) {
      setShowSettings(true);
    }
  }, [isOpen, isConfigured]);

  // 格式化同步时间
  const formatSyncTime = (isoString: string | null) => {
    if (!isoString) return '从未同步';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return '刚刚同步';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return date.toLocaleDateString();
  };

  const containerClasses = isMobile
    ? 'fixed inset-4 max-h-[95vh]'
    : 'w-full max-w-7xl max-h-[90vh]';

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={onClose}
          />

          {/* 工作空间容器 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none select-none">
            <motion.div
              data-workspace-modal
              className={`${containerClasses} bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 select-none`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: isMobile ? 'calc(100vh - 32px)' : '90vh', // 明确设置高度
                maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh',
                pointerEvents: 'auto',
                position: 'relative'
              }}
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
                duration: 0.5,
              }}
            >
              {/* 头部区域 */}
              <div className="flex-shrink-0 border-b border-gray-200/80 bg-white/90 backdrop-blur-sm rounded-t-2xl overflow-visible" style={{ position: 'relative', zIndex: 100 }}>
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fa-solid fa-briefcase text-blue-600 text-lg"></i>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">工作空间</h1>
                      <p className="text-sm text-gray-600">
                        {isConfigured ? (
                          <>
                            {workspaceItems.length} 个项目 • {formatSyncTime(lastSync)}
                          </>
                        ) : (
                          '请先配置 Notion 数据库连接'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isConfigured && (
                      <>
                        {/* 刷新按钮 */}
                        <motion.button
                          onClick={refreshItems}
                          disabled={isLoading}
                          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                          title="刷新数据"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className={`fa-solid fa-refresh text-sm ${isLoading ? 'animate-spin' : ''}`}></i>
                        </motion.button>

                        {/* 设置按钮 */}
                        <motion.button
                          onClick={() => setShowSettings(true)}
                          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                          title="设置"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fa-solid fa-cog text-sm"></i>
                        </motion.button>
                      </>
                    )}

                    {/* 关闭按钮 */}
                    <motion.button
                      onClick={onClose}
                      className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      title="关闭 (Esc)"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fa-solid fa-times text-sm"></i>
                    </motion.button>
                  </div>
                </div>

                {/* 导航栏 */}
                {isConfigured && !showSettings && (
                  <div className="border-t border-gray-100 overflow-visible" style={{ position: 'relative', zIndex: 50 }}>
                    {/* 分类标签 */}
                    <CategoryTabs />

                    {/* 搜索和视图控制 */}
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 overflow-visible" style={{ position: 'relative' }}>
                      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                        {/* 搜索栏 */}
                        <div className={isMobile ? 'w-full' : 'flex-1 max-w-md'}>
                          <SearchBar placeholder="搜索工作空间..." />
                        </div>

                        {/* 视图切换器 */}
                        <div className={isMobile ? 'w-full' : 'flex-shrink-0'}>
                          <ViewSwitcher />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 主内容区域 - 确保有固定高度用于滚动 */}
              <div style={{
                flex: '1 1 0',
                minHeight: '0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderBottomLeftRadius: '1rem',
                borderBottomRightRadius: '1rem'
              }}>
                <AnimatePresence mode="wait">
                  {showSettings ? (
                    /* 设置页面 */
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ flex: '1 1 0', overflow: 'hidden' }}
                    >
                      <WorkspaceSettings
                        onClose={() => setShowSettings(false)}
                        onConfigured={() => {
                          setShowSettings(false);
                          refreshItems();
                        }}
                      />
                    </motion.div>
                  ) : isConfigured ? (
                    /* 主工作空间视图 */
                    <motion.div
                      key="workspace"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ 
                        flex: '1 1 0', 
                        minHeight: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      {/* 错误提示 */}
                      {error && (
                        <div className="flex-shrink-0 mx-6 mt-4 mb-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <i className="fa-solid fa-exclamation-triangle text-red-500"></i>
                            <div>
                              <h3 className="text-sm font-medium text-red-800">同步失败</h3>
                              <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 内容视图 - 这里是滚动的关键 */}
                      <div style={{ 
                        flex: '1 1 0', 
                        minHeight: '0',
                        overflow: 'hidden'
                      }}>
                        <AnimatePresence mode="wait">
                          {viewType === 'list' ? (
                            <motion.div
                              key="list-view"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ height: '100%' }}
                            >
                              <ListView />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="card-view"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ height: '100%' }}
                            >
                              <CardView />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ) : (
                    /* 未配置状态 */
                    <motion.div
                      key="unconfigured"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="h-full flex flex-col items-center justify-center p-8"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                        <i className="fa-brands fa-notion text-3xl text-blue-600"></i>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎使用工作空间</h2>
                      <p className="text-gray-600 text-center mb-8 max-w-md">
                        连接您的 Notion 数据库，让工作链接触手可及。支持智能搜索、分类管理和键盘快捷操作。
                      </p>
                      <motion.button
                        onClick={() => setShowSettings(true)}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/25"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        开始配置
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 底部状态栏 */}
              {isConfigured && !showSettings && (
                <div className="flex-shrink-0 px-6 py-3 bg-gray-50/80 border-t border-gray-200 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-6">
                      <span>💡 快捷键: Space-搜索 • ↑↓-导航 • Enter-打开 • C-复制</span>
                      {!isMobile && (
                        <span>1-9-分类切换 • V-切换视图</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>当前: {selectedCategory === 'all' ? '全部' : selectedCategory}</span>
                      <span>视图: {viewType === 'list' ? '列表' : '卡片'}</span>
                      {filteredItems.length !== workspaceItems.length && (
                        <span>筛选: {filteredItems.length}/{workspaceItems.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

const WorkspaceModal = memo(WorkspaceModalComponent);
export default WorkspaceModal;