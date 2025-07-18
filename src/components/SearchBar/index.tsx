import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useSmartDebounce } from '@/hooks/useSmartDebounceFixed';

// 子组件导入
import { SearchInput, SearchButton } from './SearchInput';
import { SearchSuggestions, fetchSearchSuggestions, type Suggestion } from './SearchSuggestions';
import { EngineButton, EngineTooltip, engineList } from './EngineSelector';
import { createFireworkEffect } from './FireworkEffect';

interface SearchBarProps {
  // 不再需要websites参数
}

export function SearchBar(_props: SearchBarProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [engine, setEngine] = useState<'bing' | 'google'>('bing');
  const [isExpandDone, setIsExpandDone] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const [fixedPos, setFixedPos] = useState<{ left: number; top: number } | null>(null);
  const [hoveredEmojiIdx, setHoveredEmojiIdx] = useState<number | null>(null);
  const [showEngineTooltip, setShowEngineTooltip] = useState(false);
  const searchBarRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { searchBarOpacity, setIsSearchFocused } = useTransparency();

  // 获取当前引擎配置
  const currentEngine = engineList.find(e => e.key === engine) || engineList[0];

  // 全局监听空格键聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('键盘事件:', e.code, e.key); // 调试信息
      
      // 检查是否按下空格键
      if (e.code === 'Space') {
        console.log('检测到空格键'); // 调试信息
        
        // 获取当前聚焦的元素
        const activeElement = document.activeElement;
        console.log('当前聚焦元素:', activeElement?.tagName, activeElement); // 调试信息
        
        // 如果当前聚焦的不是输入框/textarea/可编辑元素，则聚焦搜索框
        if (activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        )) {
          console.log('当前在输入元素中，跳过处理'); // 调试信息
          return; // 不处理，让默认行为执行
        }
        
        console.log('准备聚焦搜索框'); // 调试信息
        
        // 阻止默认的空格行为（滚动页面）
        e.preventDefault();
        
        // 聚焦搜索框并设置聚焦状态
        if (searchInputRef.current) {
          console.log('聚焦搜索框成功'); // 调试信息
          searchInputRef.current.focus();
          setIsFocused(true);
          setIsHovered(true); // 确保hover状态也被设置，让搜索框变宽
          setIsSearchFocused(true);
          console.log('设置搜索聚焦状态为true'); // 调试信息
        } else {
          console.log('搜索框ref为空'); // 调试信息
        }
      }
    };

    // 添加全局键盘监听
    document.addEventListener('keydown', handleKeyDown);
    console.log('添加空格键监听器'); // 调试信息
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      console.log('移除空格键监听器'); // 调试信息
    };
  }, [setIsSearchFocused]);

  // 使用智能防抖处理搜索建议
  const fetchSuggestionsWithDebounce = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const results = await fetchSearchSuggestions(query, engine);
      setSuggestions(results);
    } catch (error) {
      console.warn('获取搜索建议失败:', error);
      setSuggestions([]);
    }
  }, [engine]);

  const debouncedFetchSuggestions = useSmartDebounce(fetchSuggestionsWithDebounce, 300, 1000);

  // 切换搜索引擎并触发动画
  const switchEngine = useCallback(() => {
    const idx = engineList.findIndex(e => e.key === engine);
    const nextEngine = engineList[(idx + 1) % engineList.length];
    setEngine(nextEngine.key);

    // 触发烟花效果
    if (searchBtnRef.current) {
      const rect = searchBtnRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      createFireworkEffect(centerX, centerY);
    }

    setShowEngineTooltip(false);
  }, [engine]);

  // 处理搜索提交
  const handleSearch = useCallback((query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    const searchUrls = {
      bing: `https://www.bing.com/search?q=${encodeURIComponent(searchTerm)}`,
      google: `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}` // 修复：移除多余的反引号
    };

    // 模拟搜索延迟
    setTimeout(() => {
      window.open(searchUrls[engine], '_blank');
      setIsLoading(false);
    }, 100);
  }, [searchQuery, engine]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        const selectedSuggestion = suggestions[selectedSuggestionIndex];
        setSearchQuery(selectedSuggestion.text);
        handleSearch(selectedSuggestion.text);
      } else {
        handleSearch();
      }
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [selectedSuggestionIndex, suggestions, handleSearch]);

  // 处理搜索输入变化
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);
    
    if (value.trim()) {
      setShowSuggestions(true);
      debouncedFetchSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [debouncedFetchSuggestions]);

  // 处理建议点击
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    setSearchQuery(suggestion.text);
    handleSearch(suggestion.text);
    setShowSuggestions(false);
  }, [handleSearch]);

  // 引擎按钮鼠标事件
  const handleEngineMouseEnter = useCallback(() => {
    const emojiList = ['🚀', '🔍', '✨', '🎯', '💫', '🌟', '⭐', '💎'];
    setHoveredEmojiIdx(Math.floor(Math.random() * emojiList.length));
  }, []);

  const handleEngineMouseLeave = useCallback(() => {
    setHoveredEmojiIdx(null);
  }, []);

  // 获取固定位置用于动画
  useLayoutEffect(() => {
    if (searchBtnRef.current && !fixedPos) {
      const rect = searchBtnRef.current.getBoundingClientRect();
      setFixedPos({
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
      });
    }
  }, [fixedPos]);

  // 延迟标记展开完成
  useEffect(() => {
    if (fixedPos && !isExpandDone) {
      const timer = setTimeout(() => setIsExpandDone(true), 800);
      return () => clearTimeout(timer);
    }
  }, [fixedPos, isExpandDone]);

  return (
    <>
      {/* 聚焦时的背景模糊遮罩 */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              console.log('点击背景遮罩，取消聚焦'); // 调试信息
              setIsFocused(false);
              setIsHovered(false);
              setShowSuggestions(false);
              setIsSearchFocused(false);
              console.log('设置搜索聚焦状态为false'); // 调试信息
              searchInputRef.current?.blur();
            }}
          />
        )}
      </AnimatePresence>
      
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
        <motion.form
          ref={searchBarRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center bg-black/40 backdrop-blur-sm rounded-full border border-white/20 shadow-lg relative"
          initial={{ 
            width: 300, // 明确初始宽度
            height: 48,
            y: -100, 
            opacity: 0 
          }}
          animate={{
            y: 0,
            opacity: searchBarOpacity,
            width: isHovered || searchQuery || isFocused ? 400 : 300,
            height: 48,
            scale: isFocused ? 1.05 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => {
            setIsHovered(true);
            setIsFocused(true);
          }}
          onBlur={(e) => {
            // 只有当焦点完全离开搜索栏时才收起
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setIsHovered(false);
              setIsFocused(false);
              setIsSearchFocused(false);
              setTimeout(() => setShowSuggestions(false), 150);
            }
          }}
        >
        <div className="flex items-center w-full px-4">
          <SearchInput
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => {
              console.log('搜索框获得焦点'); // 调试信息
              setIsHovered(true);
              setIsFocused(true);
              setIsSearchFocused(true);
              console.log('点击设置搜索聚焦状态为true'); // 调试信息
              if (searchQuery.trim() && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // 延迟处理blur，避免点击建议时立即关闭
              setTimeout(() => {
                setIsFocused(false);
                setIsSearchFocused(false);
              }, 150);
            }}
            onKeyDown={handleKeyDown}
            isExpanded={isHovered || Boolean(searchQuery) || isFocused}
          />

          <EngineButton
            currentEngine={currentEngine}
            onClick={switchEngine}
            onMouseEnter={handleEngineMouseEnter}
            onMouseLeave={handleEngineMouseLeave}
            hoveredEmojiIdx={hoveredEmojiIdx}
          />

          <SearchButton
            onClick={() => handleSearch()}
            isLoading={isLoading}
          />
        </div>

        {/* 搜索建议 */}
        <SearchSuggestions
          suggestions={suggestions}
          show={showSuggestions}
          selectedIndex={selectedSuggestionIndex}
          onSuggestionClick={handleSuggestionClick}
          onMouseEnter={setSelectedSuggestionIndex}
          searchBarRef={searchBarRef}
        />

        {/* 引擎选择提示 */}
        <EngineTooltip
          currentEngine={currentEngine}
          onEngineChange={setEngine}
          show={showEngineTooltip}
          onShowChange={setShowEngineTooltip}
        />
      </motion.form>
    </div>
    </>
  );
}

// 默认导出
export default SearchBar;
