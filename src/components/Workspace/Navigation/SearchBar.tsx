import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '@/contexts/WorkspaceContext';

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
    setFocusedItemIndex
  } = useWorkspace();

  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setFocusedItemIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (searchQuery) {
          setSearchQuery('');
        } else {
          inputRef.current?.blur();
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
      case 'ArrowUp':
        // 上移到分类标签 - 由全局hook处理
        break;
      case 'ArrowDown':
        // 下移到内容区域 - 由全局hook处理
        break;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFocusedItemIndex(-1);
    inputRef.current?.focus();
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
            focus:outline-none
            ${isFocused 
              ? 'border-transparent bg-white' 
              : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
            }
          `}
        />

        {/* 清除按钮 */}
        {searchQuery && (
          <motion.button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="清除搜索 (Esc)"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <i className="fa-solid fa-times text-xs leading-none"></i>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}