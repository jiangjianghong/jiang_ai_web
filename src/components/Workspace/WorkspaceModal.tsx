import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import WorkspaceCard from './WorkspaceCard';
import WorkspaceSettings from './WorkspaceSettings';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkspaceModal({ isOpen, onClose }: WorkspaceModalProps) {
  const {
    workspaceItems,
    isLoading,
    error,
    isConfigured,
    lastSync,
    syncWorkspaceData,
    refreshItems
  } = useWorkspace();
  
  const { isMobile } = useResponsiveLayout();
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 如果未配置，默认显示设置
  useEffect(() => {
    if (isOpen && !isConfigured) {
      setShowSettings(true);
    }
  }, [isOpen, isConfigured]);

  // 过滤和搜索逻辑
  const filteredItems = workspaceItems.filter(item => {
    // 搜索过滤
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 分类过滤
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    // 只显示激活的项目
    return item.isActive && matchesSearch && matchesCategory;
  });

  // 获取所有分类
  const categories = ['all', ...new Set(workspaceItems.map(item => item.category))];

  // 处理卡片点击
  const handleCardClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  const containerClasses = isMobile
    ? "fixed inset-4 max-h-[90vh]"
    : "w-full max-w-6xl max-h-[85vh]";

  const gridClasses = isMobile
    ? "grid-cols-2 gap-3 auto-rows-fr"
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-fr";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 模糊背景遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* 工作空间内容 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className={`${containerClasses} bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-briefcase text-white text-sm"></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">工作空间</h2>
                    <p className="text-xs text-gray-500">
                      {isConfigured ? (
                        <>共 {workspaceItems.length} 个项目 • {formatSyncTime(lastSync)}</>
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
                      <button
                        onClick={refreshItems}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="刷新数据"
                      >
                        <i className={`fa-solid fa-refresh text-sm ${isLoading ? 'animate-spin' : ''}`}></i>
                      </button>

                      {/* 设置按钮 */}
                      <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="设置"
                      >
                        <i className="fa-solid fa-cog text-sm"></i>
                      </button>
                    </>
                  )}

                  {/* 关闭按钮 */}
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-times text-sm"></i>
                  </button>
                </div>
              </div>

              {/* 主要内容区域 */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {showSettings ? (
                  /* 设置页面 */
                  <WorkspaceSettings 
                    onClose={() => setShowSettings(false)}
                    onConfigured={() => {
                      setShowSettings(false);
                      syncWorkspaceData();
                    }}
                  />
                ) : isConfigured ? (
                  <>
                    {/* 搜索和筛选栏 */}
                    {workspaceItems.length > 0 && (
                      <div className="px-6 py-4 border-b border-gray-200/50">
                        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center space-x-4'}`}>
                          {/* 搜索框 */}
                          <div className="relative flex-1">
                            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                            <input
                              type="text"
                              placeholder="搜索工作空间..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>

                          {/* 分类筛选 */}
                          {categories.length > 2 && (
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className={`${isMobile ? 'w-full' : 'w-48'} px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                            >
                              <option value="all">所有分类</option>
                              {categories.filter(cat => cat !== 'all').map(category => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 工作空间项目网格 */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-exclamation-triangle text-red-500"></i>
                            <span className="text-red-700 text-sm">{error}</span>
                          </div>
                        </div>
                      )}

                      {isLoading ? (
                        /* 加载状态 */
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                          <p className="text-gray-500 text-sm">正在同步工作空间数据...</p>
                        </div>
                      ) : filteredItems.length > 0 ? (
                        /* 工作空间项目网格 */
                        <div className={`grid ${gridClasses}`}>
                          {filteredItems.map(item => (
                            <WorkspaceCard
                              key={item.id}
                              item={item}
                              onClick={() => handleCardClick(item.url)}
                            />
                          ))}
                        </div>
                      ) : workspaceItems.length > 0 ? (
                        /* 无匹配结果 */
                        <div className="flex flex-col items-center justify-center py-12">
                          <i className="fa-solid fa-search text-gray-300 text-3xl mb-4"></i>
                          <p className="text-gray-500 text-sm mb-2">没有找到匹配的工作空间项目</p>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('all');
                            }}
                            className="text-blue-500 hover:text-blue-600 text-sm"
                          >
                            清除筛选条件
                          </button>
                        </div>
                      ) : (
                        /* 空状态 */
                        <div className="flex flex-col items-center justify-center py-12">
                          <i className="fa-solid fa-briefcase text-gray-300 text-3xl mb-4"></i>
                          <p className="text-gray-500 text-sm mb-4">工作空间为空</p>
                          <button
                            onClick={refreshItems}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            从Notion同步数据
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* 未配置状态 */
                  <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <i className="fa-brands fa-notion text-gray-300 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">欢迎使用工作空间</h3>
                    <p className="text-gray-500 text-sm text-center mb-6">
                      连接您的 Notion 数据库，让工作链接触手可及
                    </p>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      开始配置
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}