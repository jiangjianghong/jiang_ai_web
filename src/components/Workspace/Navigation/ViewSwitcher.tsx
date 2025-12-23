import { motion } from 'framer-motion';
import { useWorkspace, ViewType } from '@/contexts/WorkspaceContext';

interface ViewSwitcherProps {
  className?: string;
}

export default function ViewSwitcher({ className = '' }: ViewSwitcherProps) {
  const {
    viewType,
    setViewType,
    filteredItems
  } = useWorkspace();

  const viewOptions = [
    {
      type: 'list' as ViewType,
      icon: 'fa-list',
      label: '列表视图',
      description: '详细信息，易于扫描'
    },
    {
      type: 'card' as ViewType,
      icon: 'fa-grid',
      label: '卡片视图',
      description: '视觉化浏览'
    }
  ];

  const handleViewChange = (newViewType: ViewType) => {
    setViewType(newViewType);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void, currentIndex: number) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        action();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex === 0) {
          // 如果在第一个按钮，返回搜索框
          const searchInput = document.querySelector('.search-bar input');
          if (searchInput) {
            (searchInput as HTMLElement).focus();
          }
        } else {
          // 切换到上一个视图选项
          const buttons = document.querySelectorAll('.view-switcher-button');
          if (buttons[currentIndex - 1]) {
            (buttons[currentIndex - 1] as HTMLElement).focus();
          }
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < viewOptions.length - 1) {
          // 切换到下一个视图选项
          const buttons = document.querySelectorAll('.view-switcher-button');
          if (buttons[currentIndex + 1]) {
            (buttons[currentIndex + 1] as HTMLElement).focus();
          }
        }
        // 最右边时不跳转到其他地方
        break;
    }
  };

  return (
    <div className={`view-switcher flex items-center space-x-4 select-none ${className}`} style={{ userSelect: 'none' }}>
      {/* 结果统计 */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{filteredItems.length}</span> 个项目
      </div>

      {/* 视图切换按钮 */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {viewOptions.map((option, index) => (
          <motion.button
            key={option.type}
            onClick={() => handleViewChange(option.type)}
            onKeyDown={(e) => handleKeyDown(e, () => handleViewChange(option.type), index)}
            className={`
              view-switcher-button relative flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${viewType === option.type
                ? 'text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 shadow-sm border border-blue-100 dark:border-blue-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={`${option.label} - ${option.description}`}
          >
            <i className={`fa-solid ${option.icon} text-xs`}></i>
            <span className="hidden sm:inline">{option.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}