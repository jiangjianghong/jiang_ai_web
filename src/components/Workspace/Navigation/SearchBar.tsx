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
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFocusedItemIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`search-bar relative ${className}`}>
      <div className="relative">
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
            w-full pl-10 pr-12 py-3 border-2 rounded-xl text-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${isFocused 
              ? 'border-blue-300 bg-white shadow-lg' 
              : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
            }
          `}
        />

        {/* 清除按钮 */}
        {searchQuery && (
          <motion.button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="清除搜索 (Esc)"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <i className="fa-solid fa-times text-xs"></i>
          </motion.button>
        )}
      </div>
    </div>
  );
}