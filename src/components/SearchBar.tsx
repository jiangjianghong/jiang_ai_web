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
  const searchBarRef = useRef<HTMLFormElement>(null);
  const { searchBarOpacity } = useTransparency();
  
  const engineList = [
    { key: 'bing', label: 'Bing', icon: <i className="fa-brands fa-microsoft text-blue-400"></i> },
    { key: 'google', label: 'Google', icon: <i className="fa-brands fa-google text-blue-500"></i> },
  ];

  // 创建彩带动画效果 - 使用真正多样的SVG形状
  const createFireworkEffect = (centerX: number, centerY: number) => {
    // 丰富的彩带颜色
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3',
      '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#EE5A24', '#FD79A8',
      '#0FB9B1', '#A55EEA', '#26D0CE', '#FDCB6E', '#6C5CE7', '#74B9FF',
      '#E17055', '#F39C12', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C'
    ];

    // 多样的SVG彩带形状路径 - 更小更多样的形状
    const ribbonPaths = [
      // 细长S形彩带
      'M2,5 Q12,2 22,5 Q32,8 42,5 L42,8 Q32,11 22,8 Q12,5 2,8 Z',
      // 三角形彩带
      'M20,2 L38,2 L29,12 Z',
      // 圆形彩带
      'M20,7 A6,6 0,1,1 20,7.1 Z',
      // 菱形彩带
      'M20,2 L30,7 L20,12 L10,7 Z',
      // 星形彩带
      'M20,2 L22,8 L28,8 L23,11 L25,17 L20,14 L15,17 L17,11 L12,8 L18,8 Z',
      // 长条波浪彩带
      'M2,6 Q15,2 28,6 Q41,10 54,6 L54,9 Q41,13 28,9 Q15,5 2,9 Z',
      // 锯齿彩带
      'M5,5 L10,2 L15,5 L20,2 L25,5 L30,2 L35,5 L35,8 L30,11 L25,8 L20,11 L15,8 L10,11 L5,8 Z',
      // 花瓣彩带
      'M20,2 Q25,7 20,12 Q15,7 20,2 M20,2 Q25,7 30,2 Q25,7 30,12 Q25,7 20,12',
      // 爱心彩带
      'M20,4 C18,2 15,2 15,5 C15,8 20,12 20,12 C20,12 25,8 25,5 C25,2 22,2 20,4 Z',
      // 蝴蝶结彩带
      'M15,4 Q10,7 15,10 Q20,7 25,10 Q30,7 25,4 Q20,7 15,4',
      // 扭曲带彩带
      'M5,4 Q20,2 35,4 Q40,7 35,10 Q20,8 5,10 Q0,7 5,4',
      // 螺旋彩带
      'M2,7 Q10,3 18,7 Q26,11 34,7 Q38,5 42,7 L42,10 Q38,8 34,10 Q26,14 18,10 Q10,6 2,10 Z'
    ];

    // 增加粒子数量
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      // 创建SVG元素
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // 随机选择颜色和形状
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomPath = ribbonPaths[Math.floor(Math.random() * ribbonPaths.length)];
      
      // 更小的随机大小
      const scale = Math.random() * 0.6 + 0.5; // 0.5-1.1倍缩放
      const width = 44 * scale; // 大幅缩小
      const height = 16 * scale; // 大幅缩小
      
      // 设置SVG属性
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());
      svg.setAttribute('viewBox', '0 0 44 16'); // 匹配小尺寸
      svg.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        left: ${centerX - width/2}px;
        top: ${centerY - height/2}px;
        transform-origin: center;
      `;
      
      // 设置路径属性
      path.setAttribute('d', randomPath);
      path.setAttribute('fill', randomColor);
      
      // 50%的概率添加描边效果
      if (Math.random() > 0.5) {
        path.setAttribute('stroke', randomColor);
        path.setAttribute('stroke-width', '1');
        path.setAttribute('fill-opacity', '0.8');
      }
      
      // 30%的概率使用渐变填充
      if (Math.random() > 0.7) {
        const gradientId = `gradient-${Date.now()}-${i}`;
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');
        
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', randomColor);
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', colors[Math.floor(Math.random() * colors.length)]);
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
        
        path.setAttribute('fill', `url(#${gradientId})`);
      }
      
      svg.appendChild(path);
      document.body.appendChild(svg);

      // 随机初始速度和方向 - 更慢更优雅
      const angle = (Math.random() * 360) * (Math.PI / 180);
      const velocity = Math.random() * 4 + 2; // 进一步减慢速度：2-6
      let vx = Math.cos(angle) * velocity;
      let vy = Math.sin(angle) * velocity;
      
      // 随机旋转速度 - 更慢
      const rotationSpeed = (Math.random() - 0.5) * 80; // 进一步减慢旋转：-40到40度/秒
      let rotation = Math.random() * 360; // 随机初始旋转
      
      let x = centerX - width/2;
      let y = centerY - height/2;
      
      const gravity = 0.2; // 进一步减小重力
      const friction = 0.998; // 进一步减小阻力，让动画更持久
      
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        // 应用重力
        vy += gravity;
        
        // 应用空气阻力
        vx *= friction;
        vy *= friction;
        
        // 更新位置
        x += vx;
        y += vy;
        
        // 更新旋转
        rotation += rotationSpeed * (1/60);
        
        // 应用变换
        svg.style.left = x + 'px';
        svg.style.top = y + 'px';
        svg.style.transform = `rotate(${rotation}deg)`;
        
        // 淡出效果 - 进一步延长动画时间
        const opacity = Math.max(0, 1 - elapsed / 7); // 从5秒延长到7秒
        svg.style.opacity = opacity.toString();
        
        if (opacity > 0 && y < window.innerHeight + 100) {
          requestAnimationFrame(animate);
        } else {
          if (document.body.contains(svg)) {
            document.body.removeChild(svg);
          }
        }
      };
      
      // 适度的随机延迟 - 创造层次感
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, Math.random() * 150); // 从50ms增加到150ms
    }
  };

  // 切换搜索引擎并触发动画
  const switchEngine = () => {
    const idx = engineList.findIndex(e => e.key === engine);
    const newEngine = engineList[(idx + 1) % engineList.length].key as any;
    setEngine(newEngine);
    
    // 触发彩带动画
    if (searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect();
      const centerX = rect.left + 60; // 搜索引擎按钮的大概位置
      const centerY = rect.top + rect.height / 2;
      createFireworkEffect(centerX, centerY);
    }
  };

  // 表情名称和图标
  const emojiNames = ['chatGPT', 'Gemini', 'Deepseek', 'Kimi'];
  const emojiLinks = [
    'https://chatgpt.com/',
    'https://gemini.google.com/',
    'https://chat.deepseek.com/',
    'https://www.kimi.com/',
  ];
  const emojiList = [
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px', userSelect: 'none' }}>
      <img src={import.meta.env.BASE_URL + "icon/chatgpt.svg"} alt="chatGPT" style={{ width: 20, height: 20, display: 'block', userSelect: 'none' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px', userSelect: 'none' }}>
      <img src={import.meta.env.BASE_URL + "icon/gemini.svg"} alt="Gemini" style={{ width: 20, height: 20, display: 'block', userSelect: 'none' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px', userSelect: 'none' }}>
      <img src={import.meta.env.BASE_URL + "icon/deepseek.svg"} alt="Deepseek" style={{ width: 20, height: 20, display: 'block', userSelect: 'none' }} />
    </span>,
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, verticalAlign: 'middle', position: 'relative', top: '1px', userSelect: 'none' }}>
      <img src={import.meta.env.BASE_URL + "icon/kimi.svg"} alt="Kimi" style={{ width: 20, height: 20, display: 'block', userSelect: 'none' }} />
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
    switch (e.key) {
      case 'ArrowDown':
        if (!showSuggestions) return;
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        if (!showSuggestions) return;
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
          switchEngine();
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
    <div className="relative left-0 right-0 z-50 flex justify-center px-4 select-none">
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
                  switchEngine();
                }}
                title={`切换搜索引擎：${engineList.find(e => e.key === engine)?.label}`}
              >
                {engineList.find(e => e.key === engine)?.icon}
                <span className="hidden sm:inline text-base font-semibold select-none">{engineList.find(e => e.key === engine)?.label}</span>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors bg-transparent border-none outline-none group select-none"
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
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-white/10 last:border-b-0 select-none ${
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
                    <div className="flex items-center gap-3 select-none">
                      <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm w-4 select-none"></i>
                      <div className="flex-1 min-w-0 select-none">
                        <div className="font-medium text-sm truncate select-none">{suggestion.text}</div>
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
                            <span style={{ userSelect: 'none' }}>{emojiNames[i]}</span>
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