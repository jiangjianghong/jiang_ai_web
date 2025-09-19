import { motion, LayoutGroup } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRef, useEffect, useState } from 'react';
import WorkspaceCard from './WorkspaceCard';
import LoadingSpinner from '../LoadingSpinner';

interface CardViewProps {
  className?: string;
}

export default function CardView({ className = '' }: CardViewProps) {
  const { 
    filteredItems, 
    isLoading, 
    error,
    focusedItemIndex,
    searchQuery,
    setSearchQuery 
  } = useWorkspace();

  const [focusPosition, setFocusPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 计算焦点框的位置
  useEffect(() => {
    if (focusedItemIndex >= 0 && cardRefs.current[focusedItemIndex]) {
      const element = cardRefs.current[focusedItemIndex];
      if (element) {
        const gridContainer = element.closest('.grid-container');
        if (gridContainer) {
          const rect = element.getBoundingClientRect();
          const containerRect = gridContainer.getBoundingClientRect();
          
          setFocusPosition({
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height
          });
        }
      }
    }
  }, [focusedItemIndex, filteredItems]);

  if (isLoading) {
    return (
      <div className={`card-view ${className}`}>
        <LoadingSpinner message="正在加载工作空间数据..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card-view ${className}`}>
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
      <div className={`card-view ${className}`}>
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

  // 计算网格布局
  const getGridClasses = () => {
    return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 滚动容器 - 使用内联样式确保正确的滚动 */}
      <div 
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
        style={{ 
          flex: '1 1 0',
          minHeight: '0',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{ padding: '16px', minHeight: '100%' }}>
          {/* 卡片视图头部（可选） */}
          {filteredItems.length > 0 && searchQuery && (
            <div className="mb-6">
              <div className="text-sm text-gray-600">
                搜索 "<span className="font-medium text-gray-900">{searchQuery}</span>" 的结果
              </div>
            </div>
          )}

          {/* 卡片网格容器 */}
          <div className="relative grid-container">
            {/* 滑动的焦点框 */}
            {focusedItemIndex >= 0 && (
              <motion.div
                className="absolute border-2 border-blue-500 rounded-2xl pointer-events-none shadow-lg shadow-blue-500/20 bg-blue-50/10"
                animate={{
                  x: focusPosition.x,
                  y: focusPosition.y,
                  width: focusPosition.width,
                  height: focusPosition.height
                }}
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
                style={{ 
                  zIndex: 10
                }}
              />
            )}
            
            {/* 卡片网格 */}
            <LayoutGroup>
              <div
                className={getGridClasses()}
                style={{ paddingBottom: '80px' }}
              >
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    ref={el => cardRefs.current[index] = el}
                    className="relative"
                  >
                    <WorkspaceCard
                      item={item}
                      index={index}
                      isFocused={focusedItemIndex === index}
                      searchQuery={searchQuery}
                    />
                  </div>
                ))}
              </div>
            </LayoutGroup>
          </div>

          {/* 底部统计信息 */}
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