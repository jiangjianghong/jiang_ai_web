import { useState } from 'react';
import { motion } from 'framer-motion';
import { WorkspaceItem } from '@/contexts/WorkspaceContext';

interface WorkspaceCardProps {
  item: WorkspaceItem;
  onClick: () => void;
}

export default function WorkspaceCard({ item, onClick }: WorkspaceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 生成简单图标
  const getSimpleIcon = () => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500',
    ];
    const colorIndex = item.title.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  // 检查值是否为空或null
  const isValidValue = (value?: string) => {
    return (
      value &&
      value.toLowerCase() !== 'null' &&
      value.toLowerCase() !== 'undefined' &&
      value.trim() !== ''
    );
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

  // 卡片悬停动画变体 - 无阴影版本
  const cardVariants = {
    rest: {
      scale: 1,
      y: 0,
    },
    hover: {
      scale: 1.02,
      y: -2,
    },
  };

  return (
    <motion.div
      className="group cursor-pointer select-none h-40"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onContextMenu={handleContextMenu}
    >
      {/* 主卡片 - 3D翻转容器 */}
      <div className="relative h-full [perspective:1000px]">
        <div
          className={`absolute inset-0 w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isHovered && (isValidValue(item.username) || isValidValue(item.password))
              ? '[transform:rotateY(180deg)]'
              : ''
            }`}
        >
          {/* 正面 */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden select-none">
            {/* 图标区域 */}
            <div className="p-4 flex-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 mb-2">
                {/* 统一使用简单字母图标 */}
                <div
                  className={`w-full h-full rounded-2xl ${getSimpleIcon()} flex items-center justify-center shadow-lg transform transition-transform duration-200 group-hover:scale-105`}
                >
                  <span className="text-white font-bold text-2xl tracking-wide">
                    {item.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* 标题 */}
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-center mb-1 line-clamp-2 leading-tight">
                {item.title}
              </h3>

              {/* 描述 */}
              {item.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center line-clamp-1 leading-tight opacity-70">
                  {item.description}
                </p>
              )}
            </div>

            {/* 底部状态栏 */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200/80 dark:border-gray-700/80 px-3 py-2 flex items-center justify-between">
              {/* 左下角：状态指示器 */}
              <div className="flex items-center space-x-1">
                {(isValidValue(item.username) || isValidValue(item.password)) && (
                  <>
                    {isValidValue(item.username) && (
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"
                        title="有账号信息"
                      ></div>
                    )}
                    {isValidValue(item.password) && (
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"
                        title="有密码信息"
                      ></div>
                    )}
                  </>
                )}
                {/* 分类标签 */}
                {item.category &&
                  item.category !== 'default' &&
                  item.category !== 'Default' &&
                  item.category !== 'null' &&
                  item.category !== 'NULL' &&
                  item.category.toLowerCase() !== 'null' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 ml-2">
                      {item.category}
                    </span>
                  )}
              </div>

              {/* 右下角：跳转按钮 */}
              <div className="cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">
                <i className="fa-solid fa-external-link-alt text-xs text-gray-600 dark:text-gray-400"></i>
              </div>
            </div>
          </div>

          {/* 背面 - 账号密码信息 */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-center select-none">
            <div className="space-y-6">
              {isValidValue(item.username) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-user text-blue-600 dark:text-blue-400 text-lg"></i>
                    <span
                      className="text-base font-mono text-gray-800 dark:text-gray-100 max-w-[120px] truncate"
                      title={item.username}
                    >
                      {item.username}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.username!, '账号');
                    }}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-200"
                    title="复制账号"
                  >
                    <i className="fa-solid fa-copy text-gray-600 dark:text-gray-400 text-sm"></i>
                  </button>
                </div>
              )}

              {/* 分割线 */}
              {isValidValue(item.username) && isValidValue(item.password) && (
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
              )}

              {isValidValue(item.password) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-key text-amber-600 dark:text-amber-400 text-lg"></i>
                    <span className="text-base font-mono text-gray-800 dark:text-gray-100">
                      {'●'.repeat(Math.min(item.password!.length, 8))}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.password!, '密码');
                    }}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-200"
                    title="复制密码"
                  >
                    <i className="fa-solid fa-copy text-gray-600 dark:text-gray-400 text-sm"></i>
                  </button>
                </div>
              )}

              {!isValidValue(item.username) && !isValidValue(item.password) && (
                <div className="text-center">
                  <i className="fa-solid fa-lock text-gray-400 dark:text-gray-500 text-3xl mb-4"></i>
                  <p className="text-base text-gray-500 dark:text-gray-400 font-medium">暂无登录信息</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">该网站无需账号密码</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 添加 CSS 样式到全局样式或使用 Tailwind 的 @layer 指令
// 确保 line-clamp 工作正常
