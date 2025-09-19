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

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className={`view-switcher flex items-center space-x-4 ${className}`}>
      {/* 结果统计 */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">{filteredItems.length}</span> 个项目
      </div>

      {/* 视图切换按钮 */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        {viewOptions.map((option) => (
          <motion.button
            key={option.type}
            onClick={() => handleViewChange(option.type)}
            onKeyDown={(e) => handleKeyDown(e, () => handleViewChange(option.type))}
            className={`
              relative flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${viewType === option.type
                ? 'text-blue-700 bg-white shadow-sm border border-blue-100'
                : 'text-gray-600 hover:text-gray-900'
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