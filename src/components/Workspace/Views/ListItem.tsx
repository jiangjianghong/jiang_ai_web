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

interface ListItemProps {
  item: WorkspaceItem;
  index: number;
  isFocused: boolean;
  searchQuery?: string;
}

export default function ListItem({ item, index, isFocused, searchQuery = '' }: ListItemProps) {
  const { openItem, copyItemUrl, copyItemCredentials, setFocusedItemIndex } = useWorkspace();
  const [showCredentials, setShowCredentials] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // 焦点时滚动到视图
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({
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
      ref={itemRef}
      className={`
        relative group cursor-pointer select-none
        bg-white dark:bg-gray-800 rounded-xl p-4
        transition-all duration-200
        border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600
      `}
      style={{ userSelect: 'none' }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          delay: index * 0.05,
          ease: [0.4, 0, 0.2, 1]
        }
      }}
    >
      {/* 主要内容区域 */}
      <div className="flex items-start space-x-4">
        {/* 图标 */}
        <div className="flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-xl ${getIconColor()} flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105`}
          >
            <span className="text-white font-bold text-lg">
              {item.title.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 标题和分类 */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {highlightText(item.title, searchQuery)}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${item.category === '工作链接'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                  }
                `}>
                  {item.category === '工作链接' ? '🏢' : '🛠️'} {item.category}
                </span>
                {hasCredentials && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                    🔐 有登录信息
                  </span>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyUrl();
                }}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                title="复制链接 (C)"
              >
                <i className="fa-solid fa-copy text-xs"></i>
              </button>

              {hasCredentials && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCredentials(!showCredentials);
                  }}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                  title="显示登录信息 (D)"
                >
                  <i className={`fa-solid ${showCredentials ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openItem(item);
                }}
                className="p-1.5 text-blue-500 hover:text-blue-600 rounded-lg transition-colors"
                title="打开链接 (Enter)"
              >
                <i className="fa-solid fa-external-link-alt text-xs"></i>
              </button>
            </div>
          </div>

          {/* URL */}
          <div className="mb-2">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline truncate block select-text"
              style={{ userSelect: 'text' }}
            >
              {highlightText(item.url, searchQuery)}
            </a>
          </div>

          {/* 描述 */}
          {item.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {highlightText(item.description, searchQuery)}
            </p>
          )}

          {/* 登录信息（展开时显示） */}
          {showCredentials && hasCredentials && (
            <motion.div
              className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                {item.username && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fa-solid fa-user text-blue-600 dark:text-blue-400 text-sm"></i>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">账号:</span>
                      <code className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-600 select-text" style={{ userSelect: 'text' }}>
                        {item.username}
                      </code>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCredentials('username');
                      }}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                      title="复制账号"
                    >
                      <i className="fa-solid fa-copy text-xs"></i>
                    </button>
                  </div>
                )}

                {item.password && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fa-solid fa-key text-amber-600 dark:text-amber-400 text-sm"></i>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">密码:</span>
                      <code className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-600 select-text" style={{ userSelect: 'text' }}>
                        {'●'.repeat(Math.min(item.password.length, 12))}
                      </code>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCredentials('password');
                      }}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                      title="复制密码"
                    >
                      <i className="fa-solid fa-copy text-xs"></i>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 复制反馈 */}
      {copyFeedback && (
        <motion.div
          className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg"
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