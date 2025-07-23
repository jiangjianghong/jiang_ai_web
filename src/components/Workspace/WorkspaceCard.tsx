import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WorkspaceItem } from '@/contexts/WorkspaceContext';

interface WorkspaceCardProps {
  item: WorkspaceItem;
  onClick: () => void;
}

export default function WorkspaceCard({ item, onClick }: WorkspaceCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 生成简单图标
  const getSimpleIcon = () => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    const colorIndex = item.title.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  // 检查值是否为空或null
  const isValidValue = (value?: string) => {
    return value && 
           value.toLowerCase() !== 'null' && 
           value.toLowerCase() !== 'undefined' && 
           value.trim() !== '';
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 可以添加提示消息
      console.log(`${type}已复制到剪贴板`);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // 这里可以添加右键菜单功能
  };

  // 卡片悬停动画变体
  const cardVariants = {
    rest: { 
      scale: 1, 
      y: 0,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    },
    hover: { 
      scale: 1.02, 
      y: -4,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }
  };

  return (
    <motion.div
      className="group cursor-pointer"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onContextMenu={handleContextMenu}
    >
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full transition-all duration-200">
        {/* 图标区域 */}
        <div className="p-4 pb-2">
          <div className="w-12 h-12 mx-auto mb-3 relative">
            {/* 统一使用简单字母图标 */}
            <div className={`w-full h-full rounded-lg ${getSimpleIcon()} flex items-center justify-center shadow-sm`}>
              <span className="text-white font-semibold text-lg">
                {item.title.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* 状态指示器 */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
              <div className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>

          {/* 标题 */}
          <h3 className="text-sm font-medium text-gray-900 text-center mb-1 line-clamp-2 leading-tight">
            {item.title}
          </h3>

          {/* 描述 */}
          {item.description && (
            <p className="text-xs text-gray-500 text-center line-clamp-2 leading-tight">
              {item.description}
            </p>
          )}
        </div>

        {/* 底部信息栏 */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {/* 分类标签 - 优化显示 */}
            {item.category && 
             item.category !== 'default' && 
             item.category !== 'Default' && 
             item.category !== 'null' && 
             item.category !== 'NULL' && 
             item.category.toLowerCase() !== 'null' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {item.category}
              </span>
            )}
            
            {/* 账号密码指示器 */}
            {(isValidValue(item.username) || isValidValue(item.password)) && (
              <div className="flex items-center space-x-1">
                {isValidValue(item.username) && (
                  <div className="w-2 h-2 rounded-full bg-green-500" title="有账号信息"></div>
                )}
                {isValidValue(item.password) && (
                  <div className="w-2 h-2 rounded-full bg-orange-500" title="有密码信息"></div>
                )}
              </div>
            )}

            {/* 外部链接图标 */}
            <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-40'} ml-auto`}>
              <i className="fa-solid fa-external-link-alt text-xs text-gray-500"></i>
            </div>
          </div>
        </div>

        {/* 账号密码悬停提示 - 优化样式 */}
        {(isValidValue(item.username) || isValidValue(item.password)) && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-2 right-2 bg-white border border-gray-200 text-gray-700 text-xs rounded-xl p-3 shadow-xl z-20 min-w-[160px] backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {isValidValue(item.username) && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">账号</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded-md text-xs max-w-[80px] truncate" title={item.username}>
                      {item.username}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.username!, '账号')}
                      className="p-1.5 hover:bg-green-50 rounded-md text-green-600 hover:text-green-700 transition-colors"
                      title="复制账号"
                    >
                      <i className="fa-solid fa-copy text-xs"></i>
                    </button>
                  </div>
                </div>
              )}
              {isValidValue(item.password) && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">密码</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded-md text-xs">
                      {'•'.repeat(Math.min(item.password!.length, 8))}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.password!, '密码')}
                      className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 transition-colors"
                      title="复制密码"
                    >
                      <i className="fa-solid fa-copy text-xs"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* 小箭头 */}
            <div className="absolute top-3 -right-1 w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
          </motion.div>
        )}

        {/* 悬停遮罩 */}
        <motion.div
          className="absolute inset-0 bg-blue-500 opacity-0 pointer-events-none rounded-xl"
          animate={{ opacity: isHovered ? 0.03 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
}

// 添加 CSS 样式到全局样式或使用 Tailwind 的 @layer 指令
// 确保 line-clamp 工作正常
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;