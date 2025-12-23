import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface WorkspaceItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  category: string;
  isActive: boolean;
  lastSync: string;
  notionId: string;
  username?: string;
  password?: string;
}

interface WorkspaceCardProps {
  item: WorkspaceItem;
  index: number;
  isFocused: boolean;
  searchQuery?: string;
}

export default function WorkspaceCard({ item, index, isFocused, searchQuery = '' }: WorkspaceCardProps) {
  const { openItem, copyItemUrl, copyItemCredentials, setFocusedItemIndex } = useWorkspace();
  const [showCredentials, setShowCredentials] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 焦点时滚动到视图
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [isFocused]);

  // 生成简单图标颜色
  const getIconColor = () => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    return colors[item.title.charCodeAt(0) % colors.length];
  };

  // 高亮搜索文本
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // 检查是否有登录信息
  const hasCredentials = item.username || item.password;

  // 处理点击
  const handleClick = () => {
    setFocusedItemIndex(index);
    // 有密码的卡片，主体点击也直接跳转
    openItem(item);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        openItem(item);
        break;
      case 'c':
      case 'C':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleCopyUrl();
        }
        break;
      case 'd':
      case 'D':
        e.preventDefault();
        setShowCredentials(!showCredentials);
        break;
      case ' ':
        e.preventDefault();
        setShowCredentials(!showCredentials);
        break;
    }
  };

  // 复制操作
  const handleCopyUrl = async () => {
    await copyItemUrl(item);
    showCopyFeedback('链接已复制');
  };

  const handleCopyCredentials = async (type: 'username' | 'password') => {
    await copyItemCredentials(item, type);
    showCopyFeedback(`${type === 'username' ? '账号' : '密码'}已复制`);
  };

  const showCopyFeedback = (message: string) => {
    setCopyFeedback(message);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <motion.div
      ref={cardRef}
      className="workspace-card group cursor-pointer select-none relative"
      style={{ userSelect: 'none' }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      {/* 卡片容器 */}
      <div className="relative h-48 [perspective:1000px]">
        <div
          className={`
            absolute inset-0 w-full h-full transition-transform duration-700 [transform-style:preserve-3d]
            ${showCredentials && hasCredentials ? '[transform:rotateY(180deg)]' : ''}
          `}
        >
          {/* 正面 */}
          <div className={`
            absolute inset-0 w-full h-full [backface-visibility:hidden] 
            bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg
            transition-all duration-200 
            ${isFocused ? 'border-blue-300 dark:border-blue-500 shadow-blue-100 dark:shadow-blue-900' : 'border-gray-200 dark:border-gray-700'}
          `}>

            {/* 头部区域 */}
            <div className="p-4 flex flex-col h-full">
              {/* 图标 */}
              <div className="flex justify-center mb-3">
                <div
                  className={`w-16 h-16 rounded-2xl ${getIconColor()} flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105`}
                >
                  <span className="text-white font-bold text-2xl">
                    {item.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* 标题 */}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center mb-2 line-clamp-2 leading-tight">
                {highlightText(item.title, searchQuery)}
              </h3>

              {/* 描述 */}
              {item.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center line-clamp-2 leading-relaxed flex-1">
                  {highlightText(item.description, searchQuery)}
                </p>
              )}
            </div>

            {/* 底部状态栏 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-50/95 dark:bg-gray-700/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-600 p-2">
              <div className="flex items-center justify-between">
                {/* 左侧：分类和状态 */}
                <div className="flex items-center space-x-2">
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${item.category === '工作链接'
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                    }
                  `}>
                    {item.category === '工作链接' ? '🏢' : '🛠️'}
                  </span>

                  {hasCredentials && (
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm" title="有登录信息"></div>
                  )}
                </div>

                {/* 右侧：操作按钮 */}
                <div className="flex items-center space-x-1">
                  {hasCredentials && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCredentials(!showCredentials);
                      }}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                      title="显示登录信息"
                    >
                      <i className={`fa-solid ${showCredentials ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openItem(item);
                    }}
                    className={`
                      p-1.5 text-blue-500 hover:text-blue-600 rounded-lg transition-all
                      ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}
                    title="打开链接"
                  >
                    <i className="fa-solid fa-external-link-alt text-xs"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* 焦点指示器 */}
            {isFocused && (
              <motion.div
                className="absolute top-2 left-2 w-3 h-3 bg-blue-500 rounded-full shadow-lg"
                layoutId="cardFocusIndicator"
                initial={false}
              />
            )}
          </div>

          {/* 背面 - 登录信息 */}
          {hasCredentials && (
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center shadow-sm">
              <div className="px-6 py-4 space-y-6">
                {/* 账号信息 */}
                {item.username && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-user text-blue-600 dark:text-blue-400 text-sm"></i>
                      </div>
                      <code className="text-sm text-gray-900 dark:text-gray-100 truncate font-mono select-text" style={{ userSelect: 'text' }}>
                        {item.username}
                      </code>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCredentials('username');
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors flex-shrink-0"
                      title="复制账号"
                    >
                      <i className="fa-solid fa-copy text-sm"></i>
                    </button>
                  </div>
                )}

                {/* 密码信息 */}
                {item.password && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-key text-amber-600 dark:text-amber-400 text-sm"></i>
                      </div>
                      <code className="text-sm text-gray-900 dark:text-gray-100 font-mono select-text" style={{ userSelect: 'text' }}>
                        {'●'.repeat(Math.min(item.password.length, 12))}
                      </code>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCredentials('password');
                      }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors flex-shrink-0"
                      title="复制密码"
                    >
                      <i className="fa-solid fa-copy text-sm"></i>
                    </button>
                  </div>
                )}

                {/* 返回提示 */}
                <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">点击返回</span>
                </div>
              </div>
            </div>
          )}

          {/* 无登录信息时的背面 */}
          {!hasCredentials && showCredentials && (
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-lock text-gray-400 dark:text-gray-500 text-2xl"></i>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">该网站无需登录信息</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCredentials(false);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                点击返回
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 复制反馈 */}
      {copyFeedback && (
        <motion.div
          className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg z-10"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
        >
          {copyFeedback}
        </motion.div>
      )}
    </motion.div>
  );
}