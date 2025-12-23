import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import type { SearchSuggestion } from '@/contexts/WorkspaceContext';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export default function SearchBar({
  className = '',
  placeholder = '搜索工作空间链接...'
}: SearchBarProps) {
  const {
    searchQuery,
    setSearchQuery,
    setFocusedItemIndex,
    searchSuggestions,
    openItem,
    workspaceItems
  } = useWorkspace();

  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 当工作空间打开时自动聚焦
  useEffect(() => {
    // 延迟一小段时间以确保动画完成后聚焦
    const timer = setTimeout(() => {
      // 检查是否在工作空间模态框内
      const workspaceModal = document.querySelector('[data-workspace-modal]');
      if (workspaceModal && inputRef.current) {
        inputRef.current.focus();
      }
    }, 500); // 动画时长约500ms

    return () => clearTimeout(timer);
  }, []);

  // 全局空格键聚焦
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target !== inputRef.current) {
        const activeElement = document.activeElement;
        const isInInput = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable
        );

        if (!isInInput) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 控制建议下拉框的显示
  useEffect(() => {
    setShowSuggestions(isFocused && searchSuggestions.length > 0 && searchQuery.trim().length > 0);
    setSelectedSuggestionIndex(-1); // 重置选中索引
  }, [searchSuggestions, isFocused, searchQuery]);

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setFocusedItemIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (showSuggestions) {
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        } else if (searchQuery) {
          setSearchQuery('');
        } else {
          inputRef.current?.blur();
        }
        break;
      case 'ArrowDown':
        if (showSuggestions) {
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev < searchSuggestions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        if (showSuggestions) {
          e.preventDefault();
          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        break;
      case 'Enter':
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          e.preventDefault();
          selectSuggestion(searchSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'ArrowRight':
        // 如果光标在输入框最右侧，切换到视图选择器
        const input = inputRef.current;
        if (input && input.selectionStart === input.value.length) {
          e.preventDefault();
          // 找到第一个视图切换按钮并聚焦
          const viewSwitcherButton = document.querySelector('.view-switcher-button');
          if (viewSwitcherButton) {
            (viewSwitcherButton as HTMLElement).focus();
          }
        }
        break;
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    // 找到对应的完整工作空间项目
    const fullItem = workspaceItems.find(item => item.id === suggestion.id);
    if (fullItem) {
      openItem(fullItem);
      setShowSuggestions(false);
      setSearchQuery(''); // 清空搜索
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFocusedItemIndex(-1);
    inputRef.current?.focus();
  };

  // 高亮搜索文本
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : part
    );
  };

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '工作链接':
        return '🏢';
      case '工具链接':
        return '🛠️';
      default:
        return '📁';
    }
  };

  return (
    <div className={`search-bar relative ${className}`}>
      <motion.div
        className="relative"
        animate={{
          scale: isFocused ? 1.02 : 1
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
      >
        {/* 滑动焦点框 */}
        <motion.div
          className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isFocused ? 1 : 0,
            boxShadow: isFocused ? '0 0 20px rgba(59, 130, 246, 0.3)' : '0 0 0 rgba(59, 130, 246, 0)'
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          style={{ zIndex: 1 }}
        />
        {/* 搜索图标 */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <i className="fa-solid fa-search text-sm"></i>
        </div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-12 py-3 border rounded-xl text-sm transition-colors duration-200
            focus:outline-none dark:text-gray-100 dark:placeholder-gray-400
            ${isFocused
              ? 'border-transparent bg-white dark:bg-gray-800'
              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }
          `}
        />

        {/* 清除按钮 */}
        {searchQuery && (
          <motion.button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="清除搜索 (Esc)"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <i className="fa-solid fa-times text-xs leading-none"></i>
          </motion.button>
        )}
      </motion.div>

      {/* 搜索建议下拉框 */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* 标题栏 */}
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <i className="fa-solid fa-briefcase text-blue-500"></i>
                  工作空间搜索结果
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {searchSuggestions.length} 个匹配项
                </span>
              </div>
            </div>

            {/* 建议列表 */}
            <div className="max-h-96 overflow-y-auto">
              {searchSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  className={`
                    px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0
                    transition-colors duration-150
                    ${selectedSuggestionIndex === index ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                  `}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {highlightText(suggestion.title, searchQuery)}
                        </span>
                        {suggestion.hasCredentials && (
                          <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-full flex items-center gap-0.5">
                            <i className="fa-solid fa-key text-xs"></i>
                            <span>登录</span>
                          </span>
                        )}
                      </div>

                      {/* 描述 */}
                      {suggestion.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                          {highlightText(suggestion.description, searchQuery)}
                        </p>
                      )}

                      {/* URL */}
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {highlightText(suggestion.url, searchQuery)}
                      </p>
                    </div>

                    {/* 分类标签 */}
                    <div className="flex-shrink-0">
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium
                        ${suggestion.category === '工作链接'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                        }
                      `}>
                        <span className="mr-1">{getCategoryIcon(suggestion.category)}</span>
                        {suggestion.category}
                      </span>
                    </div>
                  </div>

                  {/* 快捷操作提示 */}
                  {selectedSuggestionIndex === index && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
                        打开链接
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd>
                        关闭建议
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* 底部提示 */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                使用 <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">↑↓</kbd> 导航，
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">Enter</kbd> 打开
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}