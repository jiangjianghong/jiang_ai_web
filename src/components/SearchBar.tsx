import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface WebsiteData {
  id: string;
  name: string;
  url: string;
  favicon: string;
  tags: string[];
  visitCount: number;
  lastVisit: string;
  note?: string;
}

interface SearchBarProps {
  websites?: WebsiteData[];
}

export function SearchBar(props: SearchBarProps = {}) {
  const { websites = [] } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { searchBarOpacity, searchBarColor, setIsSearchFocused } = useTransparency();
  const { isMobile } = useResponsiveLayout();
  
  // 状态变量声明移到useEffect之前
  const [searchQuery, setSearchQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [engine, setEngine] = useState<'bing' | 'google'>('bing');
  const [isExpandDone, setIsExpandDone] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [websiteSuggestions, setWebsiteSuggestions] = useState<WebsiteData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const [fixedPos, setFixedPos] = useState<{ left: number; top: number } | null>(null);
  const [hoveredEmojiIdx, setHoveredEmojiIdx] = useState<number | null>(null);
  const [showEngineTooltip, setShowEngineTooltip] = useState(false);
  const searchBarRef = useRef<HTMLFormElement>(null);
  
  // 全局监听空格键，未聚焦输入框时聚焦搜索框
  useEffect(() => {
    const handleSpaceFocus = (e: KeyboardEvent) => {
      // 只处理空格键
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        // 判断当前聚焦元素是否是输入框/textarea/可编辑内容
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable
        );
        
        // 如果当前聚焦在搜索框上且输入框是空的，则退出聚焦状态
        if (isInput && active === inputRef.current && searchQuery.trim() === '' && isFocused) {
          console.log('空格键触发退出聚焦状态'); // 调试信息
          e.preventDefault(); // 阻止输入空格
          setIsFocused(false);
          setIsHovered(false);
          setIsSearchFocused(false);
          inputRef.current?.blur(); // 失去焦点
          console.log('设置状态: focused=false, hovered=false, searchFocused=false'); // 调试信息
          return;
        }
        
        // 如果当前不在输入框中，则聚焦搜索框
        if (!isInput && inputRef.current) {
          console.log('空格键触发，聚焦搜索框'); // 调试信息
          e.preventDefault(); // 阻止页面滚动
          inputRef.current.focus();
          setIsFocused(true);
          setIsHovered(true); // 添加这行让搜索框变宽
          setIsSearchFocused(true);
          console.log('设置状态: focused=true, hovered=true, searchFocused=true'); // 调试信息
        }
      }
    };
    window.addEventListener('keydown', handleSpaceFocus, { capture: true });
    return () => window.removeEventListener('keydown', handleSpaceFocus, { capture: true } as any);
  }, [setIsSearchFocused, searchQuery, isFocused]); // 添加searchQuery和isFocused依赖
  
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

  // 搜索网站卡片 - 智能匹配算法（添加相关性阈值和限制数量）
  const searchWebsites = (query: string): WebsiteData[] => {
    if (!query.trim() || websites.length === 0 || query.trim().length < 2) return [];
    
    const queryLower = query.toLowerCase();
    const matches: Array<{ website: WebsiteData; score: number; matchType: string }> = [];
    
    websites.forEach(website => {
      let score = 0;
      let matchType = '';
      
      // 提取URL域名
      const domain = (() => {
        try {
          return new URL(website.url).hostname.replace(/^www\./, '');
        } catch {
          return website.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        }
      })();
      
      // 1. 网站名称匹配 (权重最高)
      if (website.name.toLowerCase().includes(queryLower)) {
        score += 100;
        matchType = '网站名称';
        // 完全匹配加分
        if (website.name.toLowerCase() === queryLower) {
          score += 50;
        }
        // 开头匹配加分
        if (website.name.toLowerCase().startsWith(queryLower)) {
          score += 30;
        }
      }
      
      // 2. 标签匹配 (权重高)
      const matchingTags = website.tags.filter(tag => 
        tag.toLowerCase().includes(queryLower)
      );
      if (matchingTags.length > 0) {
        score += 80 * matchingTags.length;
        matchType = matchType || '标签';
        // 完全匹配标签加分
        if (matchingTags.some(tag => tag.toLowerCase() === queryLower)) {
          score += 40;
        }
      }
      
      // 3. 域名匹配 (权重中等) - 提高匹配标准
      if (domain.toLowerCase().includes(queryLower) && queryLower.length >= 3) {
        score += 60;
        matchType = matchType || '域名';
        // 域名开头匹配加分
        if (domain.toLowerCase().startsWith(queryLower)) {
          score += 20;
        }
      }
      
      // 4. 备注匹配 (权重较低) - 提高匹配标准
      if (website.note && website.note.toLowerCase().includes(queryLower) && queryLower.length >= 3) {
        score += 40;
        matchType = matchType || '备注';
      }
      
      // 5. 访问频率加权 (常用网站优先)
      score += Math.min(website.visitCount * 2, 20);
      
      // 6. 模糊匹配加分 (处理输入错误) - 提高相似度阈值
      const similarity = calculateSimilarity(queryLower, website.name.toLowerCase());
      if (similarity > 0.7 && queryLower.length >= 3) {
        score += similarity * 30;
        matchType = matchType || '模糊匹配';
      }
      
      // 设置最低分数阈值，提高匹配相关性
      const MIN_SCORE_THRESHOLD = 80;
      if (score >= MIN_SCORE_THRESHOLD) {
        matches.push({ website, score, matchType });
      }
    });
    
    // 按分数排序并限制为最多3个
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(match => ({
        ...match.website,
        matchType: match.matchType
      }));
  };
  
  // 计算字符串相似度 (简化版Levenshtein距离)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[len1][len2];
    return 1 - distance / Math.max(len1, len2);
  };

  // 监听搜索查询变化，更新建议（优化逻辑：同时显示网站卡片和搜索建议）
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        // 同时搜索网站和生成搜索建议
        const matchedWebsites = searchWebsites(searchQuery);
        setWebsiteSuggestions(matchedWebsites);
        
        // 总是生成搜索建议，与网站卡片并存
        generateSuggestions(searchQuery).then((newSuggestions) => {
          setSuggestions(newSuggestions);
          // 只要有任一类型的建议就显示下拉框
          setShowSuggestions(matchedWebsites.length > 0 || newSuggestions.length > 0);
          setSelectedSuggestionIndex(-1);
        });
      } else {
        setSuggestions([]);
        setWebsiteSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, websites]);

  const handleSearch = (e: React.FormEvent, suggestionQuery?: string, website?: WebsiteData) => {
    e.preventDefault();
    
    // 如果是网站建议，直接打开网站
    if (website) {
      window.open(website.url, '_blank');
      setSearchQuery('');
      setShowSuggestions(false);
      setWebsiteSuggestions([]);
      return;
    }
    
    // 处理选中的建议
    const totalSuggestions = websiteSuggestions.length + suggestions.length;
    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < totalSuggestions) {
      if (selectedSuggestionIndex < websiteSuggestions.length) {
        // 选中的是网站建议
        const selectedWebsite = websiteSuggestions[selectedSuggestionIndex];
        window.open(selectedWebsite.url, '_blank');
        setSearchQuery('');
        setShowSuggestions(false);
        setWebsiteSuggestions([]);
        return;
      } else {
        // 选中的是搜索引擎建议
        const suggestionIndex = selectedSuggestionIndex - websiteSuggestions.length;
        const queryToSearch = suggestions[suggestionIndex]?.query || searchQuery;
        if (queryToSearch.trim()) {
          window.open(getSearchUrl(engine, queryToSearch), '_blank');
          setSearchQuery('');
          setShowSuggestions(false);
          setWebsiteSuggestions([]);
        }
        return;
      }
    }
    
    // 默认搜索
    const queryToSearch = suggestionQuery || searchQuery;
    if (queryToSearch.trim()) {
      window.open(getSearchUrl(engine, queryToSearch), '_blank');
      setSearchQuery('');
      setShowSuggestions(false);
      setWebsiteSuggestions([]);
    }
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalSuggestions = websiteSuggestions.length + suggestions.length;
    
    switch (e.key) {
      case 'ArrowDown':
        if (!showSuggestions || totalSuggestions === 0) return;
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < totalSuggestions - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        if (!showSuggestions) return;
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setWebsiteSuggestions([]);
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
              setIsFocused(false);
              setIsSearchFocused(false);
              inputRef.current?.blur();
            }}
          />
        )}
      </AnimatePresence>
      
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
            animate={{ width: isHovered ? (isMobile ? 320 : 520) : (isMobile ? 280 : 340) }}
            initial={{ width: isMobile ? 280 : 340 }}
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
                onMouseEnter={() => setShowEngineTooltip(true)}
                onMouseLeave={() => setShowEngineTooltip(false)}
              >
                {engineList.find(e => e.key === engine)?.icon}
                <span className="hidden sm:inline text-base font-semibold select-none">{engineList.find(e => e.key === engine)?.label}</span>
              </button>
              
              {/* 自定义美观的 tooltip */}
              {showEngineTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800/90 text-white text-sm rounded-lg shadow-lg backdrop-blur-sm border border-white/10 whitespace-nowrap z-30">
                  切换至 {engine === 'bing' ? 'Google' : 'Bing'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800/90"></div>
                </div>
              )}
            </div>
            {/* 分隔符 */}
            <span className="mx-2 text-white/30 select-none font-normal text-base z-10">|</span>
            <span className="text-white/60 select-none font-normal text-base z-10"></span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                setIsSearchFocused(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsFocused(false);
                  setIsSearchFocused(false);
                }, 150);
              }}
              placeholder="🧸搜点啥捏..."
              className="backdrop-blur-md border border-white/20 rounded-full pl-4 py-2 text-white placeholder-white/60 outline-none text-base transition-all duration-200 pr-12 w-full ml-3"
              style={{
                backgroundColor: `rgba(${searchBarColor}, ${searchBarOpacity})`,
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
            {showSuggestions && (websiteSuggestions.length > 0 || suggestions.length > 0) && (
              <motion.div
                className={`absolute top-full left-0 right-0 mt-2 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-50 overflow-hidden overflow-y-auto ${
                  isMobile ? 'max-h-60' : 'max-h-80'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ 
                  pointerEvents: 'auto',
                  backgroundColor: `rgba(255, 255, 255, 0.95)` // 更清晰的背景
                }}
                onMouseEnter={() => {
                  if (shrinkTimeout.current) {
                    clearTimeout(shrinkTimeout.current);
                    shrinkTimeout.current = null;
                  }
                }}
                onMouseLeave={() => {
                  // 延迟隐藏，给用户时间移动鼠标
                  if (shrinkTimeout.current) clearTimeout(shrinkTimeout.current);
                  shrinkTimeout.current = setTimeout(() => {
                    setShowSuggestions(false);
                    setWebsiteSuggestions([]);
                  }, 200);
                }}
              >
                {/* 网站建议部分 */}
                {websiteSuggestions.length > 0 && (
                  <div className="border-b border-gray-200/50">
                    <div className={`${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'} bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100`}>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-globe text-blue-500 text-sm"></i>
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-700`}>网站建议</span>
                      </div>
                    </div>
                    {websiteSuggestions.map((website, index) => {
                      const isSelected = index === selectedSuggestionIndex;
                      return (
                        <div
                          key={website.id}
                          className={`${isMobile ? 'px-3 py-2' : 'px-4 py-3'} cursor-pointer transition-all duration-200 border-b border-gray-100/50 last:border-b-0 select-none ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200' 
                              : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSearch(e as any, undefined, website);
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'} select-none`}>
                            {/* 网站图标 */}
                            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200/50 flex-shrink-0`}>
                              <img 
                                src={website.favicon} 
                                alt={website.name}
                                className="w-full h-full object-contain"
                                loading="lazy"
                                draggable="false"
                              />
                            </div>
                            
                            {/* 网站信息 */}
                            <div className="flex-1 min-w-0">
                              <div className={`flex items-center gap-2 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                                <h4 className={`font-medium text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>{website.name}</h4>
                                {(website as any).matchType && !isMobile && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                    {(website as any).matchType}
                                  </span>
                                )}
                              </div>
                              
                              {/* URL和标签 */}
                              <div className={`flex items-center gap-1 ${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                                <span className={`truncate ${isMobile ? 'max-w-[120px]' : 'max-w-[200px]'}`}>
                                  {(() => {
                                    try {
                                      return new URL(website.url).hostname;
                                    } catch {
                                      return website.url;
                                    }
                                  })()}
                                </span>
                                
                                {/* 标签显示 */}
                                {website.tags.length > 0 && !isMobile && (
                                  <>
                                    <span>•</span>
                                    <div className="flex gap-1">
                                      {website.tags.slice(0, 2).map((tag, tagIndex) => (
                                        <span 
                                          key={tagIndex}
                                          className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      {website.tags.length > 2 && (
                                        <span className="text-gray-400">+{website.tags.length - 2}</span>
                                      )}
                                    </div>
                                  </>
                                )}
                                
                                {/* 访问次数 */}
                                {website.visitCount > 0 && !isMobile && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600">{website.visitCount}次访问</span>
                                  </>
                                )}
                              </div>
                              
                              {/* 备注显示 */}
                              {website.note && (
                                <div className="mt-1 text-xs text-gray-600 truncate">
                                  {website.note}
                                </div>
                              )}
                            </div>
                            
                            {/* 快捷键提示 */}
                            <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              Enter
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* 搜索引擎建议部分 */}
                {suggestions.length > 0 && (
                  <div>
                    {websiteSuggestions.length > 0 && (
                      <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-magnifying-glass text-gray-500 text-sm"></i>
                          <span className="text-sm font-medium text-gray-700">搜索建议</span>
                        </div>
                      </div>
                    )}
                    {suggestions.map((suggestion, index) => {
                      const adjustedIndex = index + websiteSuggestions.length;
                      const isSelected = adjustedIndex === selectedSuggestionIndex;
                      return (
                        <div
                          key={suggestion.id}
                          className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100/50 last:border-b-0 select-none ${
                            isSelected 
                              ? 'bg-blue-500/10 text-gray-800' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery(suggestion.text);
                            handleSearch(e as any, suggestion.query);
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(adjustedIndex)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center gap-3 select-none">
                            <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm w-4 select-none"></i>
                            <div className="flex-1 min-w-0 select-none">
                              <div className="font-medium text-sm truncate select-none">{suggestion.text}</div>
                            </div>
                            <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              Enter
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
    </>
  );
}