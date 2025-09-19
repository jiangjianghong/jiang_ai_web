import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRef, useEffect, useState } from 'react';

interface CategoryTabsProps {
  className?: string;
}

export default function CategoryTabs({ className = '' }: CategoryTabsProps) {
  const { 
    categories, 
    selectedCategory, 
    setSelectedCategory,
    setFocusedItemIndex 
  } = useWorkspace();

  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 更新激活索引
  useEffect(() => {
    const index = categories.findIndex(cat => cat.name === selectedCategory);
    if (index >= 0) {
      setActiveIndex(index);
    }
  }, [selectedCategory, categories]);

  const handleCategoryClick = (categoryName: string, index: number) => {
    setSelectedCategory(categoryName);
    setActiveIndex(index);
    setFocusedItemIndex(-1); // 重置焦点
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleCategoryClick(categories[index].name, index);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.stopPropagation();
        // 移动到前一个分类，第一个不循环
        if (activeIndex > 0) {
          const newIndex = activeIndex - 1;
          setSelectedCategory(categories[newIndex].name);
          setActiveIndex(newIndex);
          setFocusedItemIndex(-1);
          // Focus the previous button
          setTimeout(() => {
            buttonRefs.current[newIndex]?.focus();
          }, 0);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        // 移动到下一个分类，最后一个不循环
        if (activeIndex < categories.length - 1) {
          const newIndex = activeIndex + 1;
          setSelectedCategory(categories[newIndex].name);
          setActiveIndex(newIndex);
          setFocusedItemIndex(-1);
          // Focus the next button
          setTimeout(() => {
            buttonRefs.current[newIndex]?.focus();
          }, 0);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        // 下移到搜索框
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
          (searchInput as HTMLElement).focus();
        }
        break;
    }
  };

  return (
    <div className={`category-tabs ${className}`}>
      <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        {categories.map((category, index) => {
          const isActive = activeIndex === index;
          const displayName = category.name === 'all' ? '全部' : category.name;
          
          return (
            <motion.button
              key={category.name}
              ref={el => buttonRefs.current[index] = el}
              onClick={() => handleCategoryClick(category.name, index)}
              onKeyDown={(e) => handleButtonKeyDown(e, index)}
              className={`category-tab-button relative flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all duration-200 focus:outline-none overflow-hidden
                ${isActive ? 'ring-2 ring-blue-300 ring-offset-1' : ''}
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              tabIndex={0}
            >
              {/* 滑动背景 - 仅在选中时显示 */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl"
                  layoutId="activeTab"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 25,
                    mass: 1
                  }}
                />
              )}
              
              {/* 内容层 - 始终在最上层 */}
              <div className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                <span className="text-base">{category.icon}</span>
                <span className="text-sm font-medium">{displayName}</span>
                <span 
                  className={`
                    inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600'
                    }
                  `}
                >
                  {category.count}
                </span>
              </div>
              
              {/* 非激活状态的背景 */}
              {!isActive && (
                <div className="absolute inset-0 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}