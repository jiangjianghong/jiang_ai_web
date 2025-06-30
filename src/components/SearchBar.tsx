import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';

interface SearchBarProps {
  // 不再需要websites参数
}

export function SearchBar(_props: SearchBarProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [engine, setEngine] = useState<'bing' | 'google'>('bing');
  const [isExpandDone, setIsExpandDone] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const [fixedPos, setFixedPos] = useState<{ left: number; top: number } | null>(null);
  const [hoveredEmojiIdx, setHoveredEmojiIdx] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [searchBarCenter, setSearchBarCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const searchBarRef = useRef<HTMLFormElement>(null);
  const { searchBarOpacity } = useTransparency();
  const engineList = [
    { key: 'bing', label: 'Bing', icon: <i className="fa-brands fa-microsoft text-blue-400"></i> },
    { key: 'google', label: 'Google', icon: <i className="fa-brands fa-google text-blue-500"></i> },
  ];

  // 表情名称和图标
  const emojiNames = ['chatGPT', 'Gemini', 'Deepseek', 'Kimi'];
  const emojiLinks = [
    'https://chatgpt.com/',
    'https://gemini.google.com/',
    'https://chat.deepseek.com/',
    'https://www.kimi.com/',
  ];
  const emojiList = [
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px' }}>
      <img src={import.meta.env.BASE_URL + "icon/chatgpt.svg"} alt="chatGPT" style={{ width: 20, height: 20, display: 'block' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px' }}>
      <img src={import.meta.env.BASE_URL + "icon/gemini.svg"} alt="Gemini" style={{ width: 20, height: 20, display: 'block' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px' }}>
      <img src={import.meta.env.BASE_URL + "icon/deepseek.svg"} alt="Deepseek" style={{ width: 20, height: 20, display: 'block' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px' }}>
      <img src={import.meta.env.BASE_URL + "icon/kimi.svg"} alt="Kimi" style={{ width: 20, height: 20, display: 'block' }} />
    </span>,
  ];

  const getSearchUrl = (engine: string, query: string) => {
    switch (engine) {
      case 'google':
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      default:
        return `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    }
  };

  // 计算背景偏移量
  const calculateBackgroundOffset = () => {
    // 如果鼠标位置或搜索框中心未初始化，返回默认值
    if (!mousePosition.x || !mousePosition.y || !searchBarCenter.x || !searchBarCenter.y) {
      return { x: 0, y: 0 };
    }
    
    // 计算搜索框中心到鼠标的向量
    const deltaX = mousePosition.x - searchBarCenter.x;
    const deltaY = mousePosition.y - searchBarCenter.y;
    
    // 计算距离
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 最大偏移量（增加到15%的移动范围，让效果更明显）
    const maxOffset = 15;
    
    // 根据距离计算偏移强度，距离越远偏移越大，但有上限
    const offsetStrength = Math.min(distance / 150, 1); // 减少到150px 作为参考距离，让效果更敏感
    
    // 计算偏移量
    const offsetX = (deltaX / (distance || 1)) * maxOffset * offsetStrength;
    const offsetY = (deltaY / (distance || 1)) * maxOffset * offsetStrength;
    
    return { x: offsetX, y: offsetY };
  };

  // 生成搜索建议 - 使用百度联想API (带CORS处理)
  const generateSuggestions = async (query: string): Promise<any[]> => {
    if (!query.trim()) return [];
    
    try {
      // 尝试使用百度联想API，通过JSONP方式绕过CORS
      const script = document.createElement('script');
      const callbackName = `baiduCallback_${Date.now()}`;
      
      return new Promise<any[]>((resolve) => {
        // 设置全局回调函数
        (window as any)[callbackName] = (data: any) => {
          if (data && data.s && Array.isArray(data.s)) {
            const suggestions = data.s.slice(0, 5).map((suggestion: string, index: number) => ({
              id: `baidu-${index}`,
              text: suggestion,
              query: suggestion
            }));
            resolve(suggestions);
          } else {
            // 如果百度API失败，使用本地建议
            const localSuggestions = generateSmartSuggestions(query);
            resolve(localSuggestions.slice(0, 5).map((suggestion, index) => ({
              id: `local-${index}`,
              text: suggestion,
              query: suggestion
            })));
          }
          
          // 清理
          document.head.removeChild(script);
          delete (window as any)[callbackName];
        };
        
        // 设置超时处理
        setTimeout(() => {
          if ((window as any)[callbackName]) {
            // 超时后使用本地建议
            const localSuggestions = generateSmartSuggestions(query);
            resolve(localSuggestions.slice(0, 5).map((suggestion, index) => ({
              id: `local-${index}`,
              text: suggestion,
              query: suggestion
            })));
            
            // 清理
            if (document.head.contains(script)) {
              document.head.removeChild(script);
            }
            delete (window as any)[callbackName];
          }
        }, 2000);
        
        // 创建JSONP请求
        script.src = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&cb=${callbackName}`;
        script.onerror = () => {
          // 如果脚本加载失败，使用本地建议
          const localSuggestions = generateSmartSuggestions(query);
          resolve(localSuggestions.slice(0, 5).map((suggestion, index) => ({
            id: `local-${index}`,
            text: suggestion,
            query: suggestion
          })));
          
          // 清理
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
          delete (window as any)[callbackName];
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.warn('Failed to fetch Baidu suggestions:', error);
      
      // 备用方案：使用本地智能建议
      const suggestions = generateSmartSuggestions(query);
      return suggestions.slice(0, 5).map((suggestion, index) => ({
        id: `local-${index}`,
        text: suggestion,
        query: suggestion
      }));
    }
  };

  // 生成智能搜索建议
  const generateSmartSuggestions = (query: string) => {
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // 常见的搜索模式
    const patterns = [
      query, // 原始查询
      `${query} 是什么`,
      `${query} 怎么用`,
      `${query} 教程`,
      `如何 ${query}`,
      `${query} 下载`,
      `${query} 官网`,
      `${query} 价格`,
    ];

    // 根据查询内容智能生成建议
    if (queryLower.includes('什么') || queryLower.includes('how')) {
      suggestions.push(`${query}`, `${query} 详解`, `${query} 原理`);
    } else if (queryLower.includes('怎么') || queryLower.includes('如何')) {
      suggestions.push(`${query}`, `${query} 步骤`, `${query} 方法`);
    } else {
      suggestions.push(...patterns);
    }

    // 移除重复并返回
    return [...new Set(suggestions)];
  };

  // 监听搜索查询变化，更新建议（添加防抖）
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        generateSuggestions(searchQuery).then((newSuggestions) => {
          setSuggestions(newSuggestions);
          setShowSuggestions(newSuggestions.length > 0);
          setSelectedSuggestionIndex(-1);
        });
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    }, 500); // 增加到500ms防抖，给API更多时间

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // 监听鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 更新搜索框中心位置
  useEffect(() => {
    const updateSearchBarCenter = () => {
      if (searchBarRef.current) {
        const rect = searchBarRef.current.getBoundingClientRect();
        setSearchBarCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };

    // 初始化时更新一次
    updateSearchBarCenter();

    // 监听窗口大小变化和滚动
    window.addEventListener('resize', updateSearchBarCenter);
    window.addEventListener('scroll', updateSearchBarCenter);

    return () => {
      window.removeEventListener('resize', updateSearchBarCenter);
      window.removeEventListener('scroll', updateSearchBarCenter);
    };
  }, [isHovered, engine]); // 当状态变化时重新计算中心位置

  const handleSearch = (e: React.FormEvent, suggestionQuery?: string) => {
    e.preventDefault();
    const queryToSearch = suggestionQuery || (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex] 
      ? suggestions[selectedSuggestionIndex].query 
      : searchQuery);
      
    if (queryToSearch.trim()) {
      window.open(getSearchUrl(engine, queryToSearch), '_blank');
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      case 'Tab':
        if (!e.shiftKey) {
          e.preventDefault();
          const idx = engineList.findIndex(en => en.key === engine);
          setEngine(engineList[(idx + 1) % engineList.length].key as any);
        }
        break;
    }
  };

  const shrinkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 只在动画完成时获取一次绝对位置
  useLayoutEffect(() => {
    if (isExpandDone && searchBtnRef.current) {
      const rect = searchBtnRef.current.getBoundingClientRect();
      setFixedPos({
        left: rect.left + rect.width / 2,
        top: rect.top, // 直接用top，修正视觉中心
      });
    } else {
      setFixedPos(null);
    }
  }, [isExpandDone, engine]);

  return (
    <div className="relative left-0 right-0 z-50 flex justify-center px-4">
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form
          ref={searchBarRef}
          onSubmit={handleSearch}
          className="relative flex items-center justify-center"
          onMouseEnter={() => {
            if (shrinkTimeout.current) {
              clearTimeout(shrinkTimeout.current);
              shrinkTimeout.current = null;
            }
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            if (shrinkTimeout.current) clearTimeout(shrinkTimeout.current);
            shrinkTimeout.current = setTimeout(() => {
              setIsHovered(false);
              setIsExpandDone(false);
              // 延迟隐藏建议，避免鼠标移动到建议上时立即隐藏
              setTimeout(() => {
                setShowSuggestions(false);
              }, 100);
            }, 200);
          }}
        >
          <motion.div
            animate={{ width: isHovered ? 520 : 340 }}
            initial={{ width: 340 }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }}
            style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
            onAnimationComplete={() => { if (isHovered) setIsExpandDone(true); }}
          >
            {/* 搜索引擎切换按钮和“搜索”字样 */}
            <div className="relative flex items-center">
              <button
                type="button"
                className="flex items-center gap-2 px-1.5 py-1 text-white/80 hover:text-white bg-transparent border-none outline-none text-lg select-none relative z-20"
                style={{ pointerEvents: 'auto', height: 36, minWidth: 36, minHeight: 36, justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                tabIndex={-1}
                onClick={() => {
                  const idx = engineList.findIndex(e => e.key === engine);
                  setEngine(engineList[(idx + 1) % engineList.length].key as any);
                }}
                title={`切换搜索引擎：${engineList.find(e => e.key === engine)?.label}`}
              >
                {engineList.find(e => e.key === engine)?.icon}
                <span className="hidden sm:inline text-base font-semibold">{engineList.find(e => e.key === engine)?.label}</span>
              </button>
            </div>
            {/* 分隔符 */}
            <span className="mx-2 text-white/30 select-none font-normal text-base z-10">|</span>
            <span className="text-white/60 select-none font-normal text-base z-10"></span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入内容..."
              className="backdrop-blur-md border border-white/20 rounded-full pl-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-white/30 text-base transition-all duration-200 pr-12 w-full ml-3"
              style={{
                backgroundColor: `rgba(255, 255, 255, ${searchBarOpacity})`,
                minWidth: '4rem',
                maxWidth: '100%'
              }}
            />
            <button
              ref={searchBtnRef}
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors bg-transparent border-none outline-none group"
              style={{ pointerEvents: 'auto' }}
            >
              <motion.i
                className="fa-solid fa-magnifying-glass text-sm"
                whileHover={{ scale: 1.22, rotate: 18, color: '#fff' }}
                whileTap={{ scale: 0.95, rotate: 0 }}
                animate={{ color: isHovered ? '#fff' : undefined }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                style={{ display: 'inline-block' }}
              />
            </button>

            {/* 搜索建议列表 */}
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-2 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-50 overflow-hidden max-h-60 overflow-y-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ 
                  pointerEvents: 'auto',
                  backgroundColor: `rgba(255, 255, 255, 0.9)` // 更白的背景
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-white/10 last:border-b-0 ${
                      index === selectedSuggestionIndex 
                        ? 'bg-blue-500/20 text-gray-800' 
                        : 'hover:bg-white/50 text-gray-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery(suggestion.text);
                      handleSearch(e as any, suggestion.query);
                    }}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    onMouseDown={(e) => e.preventDefault()} // 防止失去焦点
                  >
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm w-4"></i>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{suggestion.text}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
            {/* 悬停时显示的表情（fixed定位，圆心为放大镜按钮绝对中心） */}
            {isHovered && isExpandDone && fixedPos && (
              <div
                className="fixed z-30"
                style={{
                  left: fixedPos.left,
                  top: fixedPos.top,
                  width: 0,
                  height: 0,
                  pointerEvents: 'auto',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0 }}>
                  {emojiList.map((emoji, i, arr) => {
                    // -60°到60°，右上半圆分布，半径增大为44
                    const N = arr.length;
                    const angle = (-60 + (120 / (N - 1)) * i) * (Math.PI / 180);
                    const r = 44;
                    const x = r * Math.cos(angle);
                    const y = r * Math.sin(angle);
                    const rectHeight = 19; // 更小的高度
                    const rectWidth = rectHeight * 3.6; // 更紧凑的宽度
                    return (
                      <motion.span
                        key={i}
                        role="img"
                        aria-label={emojiNames[i]}
                        initial={{ x: 0, y: 0, scale: 0.3, opacity: 0, filter: 'none' }}
                        animate={{ x, y, scale: 1.18, opacity: 1, filter: 'none' }}
                        whileHover={{ scale: 1.38, filter: 'drop-shadow(0 0 4px #fff) drop-shadow(0 0 8px #fff)' }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 22,
                          delay: 0.08 * i,
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          fontSize: 22,
                          cursor: 'pointer',
                          userSelect: 'none',
                          zIndex: 2,
                          willChange: 'filter, transform',
                        }}
                        onClick={() => window.open(emojiLinks[i], '_blank')}
                        onMouseEnter={() => setHoveredEmojiIdx(i)}
                        onMouseLeave={() => setHoveredEmojiIdx(null)}
                      >
                        {emoji}
                        {hoveredEmojiIdx === i && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 28,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              height: rectHeight,
                              width: rectWidth,
                              background: 'rgba(255,255,255,0.98)', // 浅色背景
                              color: '#222', // 深色字体
                              borderRadius: rectHeight / 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 12px #0003',
                              fontSize: 14,
                              fontWeight: 500,
                              pointerEvents: 'auto',
                              zIndex: 10,
                              padding: '0 10px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span>{emojiNames[i]}</span>
                          </div>
                        )}
                      </motion.span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}