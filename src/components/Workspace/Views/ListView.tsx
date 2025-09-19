import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ListItem from './ListItem';
import LoadingSpinner from '../LoadingSpinner';

interface ListViewProps {
  className?: string;
}

export default function ListView({ className = '' }: ListViewProps) {
  const { 
    filteredItems, 
    isLoading, 
    error,
    focusedItemIndex,
    searchQuery,
    setSearchQuery 
  } = useWorkspace();

  if (isLoading) {
    return (
      <div className={`list-view ${className}`}>
        <LoadingSpinner message="正在加载工作空间数据..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`list-view ${className}`}>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <i className="fa-solid fa-exclamation-triangle text-red-500 text-xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 text-sm text-center max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className={`list-view ${className}`}>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {searchQuery ? (
              <i className="fa-solid fa-search text-gray-400 text-xl"></i>
            ) : (
              <i className="fa-solid fa-folder-open text-gray-400 text-xl"></i>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '没有找到匹配的项目' : '工作空间为空'}
          </h3>
          <p className="text-gray-500 text-sm text-center max-w-md">
            {searchQuery 
              ? `没有找到包含 "${searchQuery}" 的项目，尝试使用其他关键词搜索`
              : '还没有任何工作空间项目，请先从 Notion 同步数据'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              清除搜索条件
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`list-view h-full ${className}`}>
      {/* 滚动容器 - 明确设置滚动行为 */}
      <div 
        className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch' // iOS 滚动优化
        }}
      >
        <div className="space-y-1 p-4 min-h-full">
          {/* 列表头部（可选） */}
          {filteredItems.length > 0 && searchQuery && (
            <div className="mb-4">
              <div className="text-sm text-gray-600">
                搜索 "<span className="font-medium text-gray-900">{searchQuery}</span>" 的结果
              </div>
            </div>
          )}

          {/* 列表项 */}
          <motion.div
            className="space-y-2 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: Math.min(index * 0.05, 0.5) // 限制最大延迟
                }}
              >
                <ListItem
                  item={item}
                  index={index}
                  isFocused={focusedItemIndex === index}
                  searchQuery={searchQuery}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* 加载更多指示器（如果需要分页） */}
          {filteredItems.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              <div className="text-center text-sm text-gray-500">
                共 {filteredItems.length} 个项目
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}