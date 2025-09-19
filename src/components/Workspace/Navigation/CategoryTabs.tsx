import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';

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

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setFocusedItemIndex(-1); // 重置焦点
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent, categoryName: string) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleCategoryClick(categoryName);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.stopPropagation();
        // 移动到前一个分类，第一个不循环
        const currentIndex = categories.findIndex(cat => cat.name === selectedCategory);
        if (currentIndex > 0) {
          setSelectedCategory(categories[currentIndex - 1].name);
          setFocusedItemIndex(-1); // 重置焦点
          // Focus the previous button
          setTimeout(() => {
            const buttons = document.querySelectorAll('.category-tab-button');
            if (buttons[currentIndex - 1]) {
              (buttons[currentIndex - 1] as HTMLElement).focus();
            }
          }, 0);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        // 移动到下一个分类，最后一个不循环
        const currentIdx = categories.findIndex(cat => cat.name === selectedCategory);
        if (currentIdx < categories.length - 1) {
          setSelectedCategory(categories[currentIdx + 1].name);
          setFocusedItemIndex(-1); // 重置焦点
          // Focus the next button
          setTimeout(() => {
            const buttons = document.querySelectorAll('.category-tab-button');
            if (buttons[currentIdx + 1]) {
              (buttons[currentIdx + 1] as HTMLElement).focus();
            }
          }, 0);
        }
        break;
    }
  };

  return (
    <div className={`category-tabs ${className}`}>
      <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        {categories.map((category) => {
          const isActive = selectedCategory === category.name;
          const displayName = category.name === 'all' ? '全部' : category.name;
          
          return (
            <motion.button
              key={category.name}
              onClick={() => handleCategoryClick(category.name)}
              onKeyDown={(e) => handleButtonKeyDown(e, category.name)}
              className={`category-tab-button
                relative flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                }
              `}
              whileHover={{ scale: isActive ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={false}
              animate={{ 
                backgroundColor: isActive ? '#3B82F6' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#4B5563'
              }}
              tabIndex={0}
            >
              <span className="text-base">{category.icon}</span>
              <span className="text-sm font-medium">{displayName}</span>
              <span 
                className={`
                  inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full
                  ${isActive 
                    ? 'bg-white/25 text-white' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600'
                  }
                `}
              >
                {category.count}
              </span>
              
              {/* 激活指示器 */}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}