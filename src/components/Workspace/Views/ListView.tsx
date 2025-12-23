import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRef, useEffect, useState } from 'react';
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

  const [focusPosition, setFocusPosition] = useState({ y: 0, height: 0 });
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 计算焦点框的位置
  useEffect(() => {
    if (focusedItemIndex >= 0 && itemRefs.current[focusedItemIndex]) {
      const element = itemRefs.current[focusedItemIndex];
      if (element) {
        // 获取列表容器
        const listContainer = element.closest('.list-items-container');
        if (listContainer) {
          // 使用元素相对于父容器的实际位置
          const rect = element.getBoundingClientRect();
          const containerRect = listContainer.getBoundingClientRect();

          setFocusPosition({
            y: rect.top - containerRect.top,
            height: element.offsetHeight
          });
        }
      }
    }
  }, [focusedItemIndex, filteredItems, searchQuery]);

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
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <i className="fa-solid fa-exclamation-triangle text-red-500 dark:text-red-400 text-xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">加载失败</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className={`list-view ${className}`}>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            {searchQuery ? (
              <i className="fa-solid fa-search text-gray-400 dark:text-gray-500 text-xl"></i>
            ) : (
              <i className="fa-solid fa-folder-open text-gray-400 dark:text-gray-500 text-xl"></i>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery ? '没有找到匹配的项目' : '工作空间为空'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-md">
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
              className="mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              清除搜索条件
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`list-view h-full select-none ${className}`} style={{ userSelect: 'none' }}>
      {/* 滚动容器 - 明确设置滚动行为 */}
      <div
        className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 list-container"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch' // iOS 滚动优化
        }}
      >
        <div className="relative space-y-1 p-4 min-h-full">
          {/* 列表头部（可选） */}
          {filteredItems.length > 0 && searchQuery && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                搜索 "<span className="font-medium text-gray-900 dark:text-gray-100">{searchQuery}</span>" 的结果
              </div>
            </div>
          )}

          {/* 列表项 */}
          <div className="relative list-items-container">
            {/* 滑动的焦点框 */}
            {focusedItemIndex >= 0 && (
              <motion.div
                className="absolute left-0 right-0 border-2 border-blue-500 rounded-xl pointer-events-none shadow-lg shadow-blue-500/20 bg-blue-50/10 dark:bg-blue-900/10"
                animate={{
                  y: focusPosition.y,
                  height: focusPosition.height
                }}
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 25,
                  mass: 1
                }}
                style={{
                  zIndex: 1
                }}
              />
            )}

            {/* LayoutGroup might be causing issues if types are not perfect, removing for stability since we only have list items */}
            <div className="space-y-2">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  ref={el => itemRefs.current[index] = el}
                  className="relative"
                >
                  <ListItem
                    item={item}
                    index={index}
                    isFocused={focusedItemIndex === index}
                    searchQuery={searchQuery}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 加载更多指示器（如果需要分页） */}
          {filteredItems.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                共 {filteredItems.length} 个项目
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}