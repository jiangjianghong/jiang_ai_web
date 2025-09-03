import { useState, useRef, useLayoutEffect, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import validator from 'validator';

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

function SearchBarComponent(props: SearchBarProps = {}) {
    const { websites = [] } = props;
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const { searchBarOpacity, searchBarColor, setIsSearchFocused, searchInNewTab } = useTransparency();
    const { isMobile } = useResponsiveLayout();

    // 状态变量声明移到useEffect之前
    const [searchQuery, setSearchQuery] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [engine, setEngine] = useState<'bing' | 'google'>('bing');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [websiteSuggestions, setWebsiteSuggestions] = useState<WebsiteData[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchBtnRef = useRef<HTMLButtonElement>(null);
    const [hoveredEmojiIdx, setHoveredEmojiIdx] = useState<number | null>(null);
    const [showEngineTooltip, setShowEngineTooltip] = useState(false);
    const searchBarRef = useRef<HTMLFormElement>(null);

    // 创建彩带动画效果 - 使用真正多样的SVG形状
    const createFireworkEffect = useCallback((centerX: number, centerY: number) => {
        // 丰富的彩带颜色
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3',
            '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#EE5A24', '#FD79A8',
            '#0FB9B1', '#A55EEA', '#26D0CE', '#FDCB6E', '#6C5CE7', '#74B9FF',
            '#E17055', '#F39C12', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C'
        ];

        // 多样的SVG彩带形状路径 - 更小更多样的形状
        const ribbonPaths = [
            'M2,5 Q12,2 22,5 Q32,8 42,5 L42,8 Q32,11 22,8 Q12,5 2,8 Z',
            'M20,2 L38,2 L29,12 Z',
            'M20,7 A6,6 0,1,1 20,7.1 Z',
            'M20,2 L30,7 L20,12 L10,7 Z',
            'M20,2 L22,8 L28,8 L23,11 L25,17 L20,14 L15,17 L17,11 L12,8 L18,8 Z',
            'M2,6 Q15,2 28,6 Q41,10 54,6 L54,9 Q41,13 28,9 Q15,5 2,9 Z'
        ];

        // 创建彩带
        for (let i = 0; i < 30; i++) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            const pathData = ribbonPaths[Math.floor(Math.random() * ribbonPaths.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const width = Math.random() * 25 + 15;
            const height = Math.random() * 15 + 8;

            svg.setAttribute('width', width.toString());
            svg.setAttribute('height', height.toString());
            svg.setAttribute('viewBox', '0 0 44 14');
            svg.style.position = 'fixed';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '9999';
            svg.style.left = centerX + 'px';
            svg.style.top = centerY + 'px';

            path.setAttribute('d', pathData);
            path.setAttribute('fill', color);
            path.setAttribute('opacity', '0.9');

            svg.appendChild(path);
            document.body.appendChild(svg);

            const angle = (Math.random() * 360) * (Math.PI / 180);
            const velocity = Math.random() * 4 + 2;
            let vx = Math.cos(angle) * velocity;
            let vy = Math.sin(angle) * velocity;
            const rotationSpeed = (Math.random() - 0.5) * 80;
            let rotation = Math.random() * 360;
            let x = centerX - width / 2;
            let y = centerY - height / 2;
            const gravity = 0.2;
            const friction = 0.998;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                vy += gravity;
                vx *= friction;
                vy *= friction;
                x += vx;
                y += vy;
                rotation += rotationSpeed * (1 / 60);
                svg.style.left = x + 'px';
                svg.style.top = y + 'px';
                svg.style.transform = `rotate(${rotation}deg)`;
                const opacity = Math.max(0, 1 - elapsed / 7);
                svg.style.opacity = opacity.toString();

                if (opacity > 0 && y < window.innerHeight + 100) {
                    requestAnimationFrame(animate);
                } else {
                    if (document.body.contains(svg)) {
                        document.body.removeChild(svg);
                    }
                }
            };

            setTimeout(() => {
                requestAnimationFrame(animate);
            }, Math.random() * 150);
        }
    }, []);

    // 全局监听空格键，未聚焦输入框时聚焦搜索框
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // 处理Tab键切换搜索引擎
            if (e.key === 'Tab' && !e.shiftKey) {
                // 判断当前聚焦元素是否是输入框/textarea/可编辑内容
                const active = document.activeElement;
                const isInput = active && (
                    active.tagName === 'INPUT' ||
                    active.tagName === 'TEXTAREA' ||
                    (active as HTMLElement).isContentEditable
                );

                // 如果是我们的搜索框或者不在任何输入框中，则切换搜索引擎
                const isOurSearchInput = active === inputRef.current;
                if (!isInput || isOurSearchInput) {
                    e.preventDefault();
                    // 切换引擎并触发彩带动画
                    setEngine(prevEngine => prevEngine === 'bing' ? 'google' : 'bing');

                    // 触发彩带动画 - 从搜索引擎按钮位置
                    const engineButton = document.querySelector('.fa-brands.fa-microsoft, .fa-brands.fa-google')?.closest('button');
                    if (engineButton) {
                        const rect = engineButton.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        createFireworkEffect(centerX, centerY);
                    }
                    return;
                }
            }

            // 处理空格键
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
        window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true } as any);
    }, [setIsSearchFocused, searchQuery, isFocused, createFireworkEffect]); // 添加createFireworkEffect依赖

    const engineList = [
        { key: 'bing', label: 'Bing', icon: <i className="fa-brands fa-microsoft text-blue-400"></i> },
        { key: 'google', label: 'Google', icon: <i className="fa-brands fa-google text-blue-500"></i> },
    ];



    // 切换搜索引擎并触发动画
    const switchEngine = () => {
        const idx = engineList.findIndex(e => e.key === engine);
        const newEngine = engineList[(idx + 1) % engineList.length].key as any;
        setEngine(newEngine);

        // 触发彩带动画 - 从搜索引擎按钮位置
        const engineButton = document.querySelector('.fa-brands.fa-microsoft, .fa-brands.fa-google')?.closest('button');
        if (engineButton) {
            const rect = engineButton.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
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

    // 根据设置打开链接的辅助函数
    const openUrl = (url: string) => {
        if (searchInNewTab) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    };

    // 检测输入是否为URL
    const isValidURL = (input: string): boolean => {
        const trimmedInput = input.trim();
        
        // 空输入直接返回false
        if (!trimmedInput) return false;
        
        try {
            // 处理各种URL格式
            let urlToCheck = trimmedInput;
            
            // 如果没有协议，尝试添加http://
            if (!trimmedInput.match(/^https?:\/\//i)) {
                urlToCheck = `http://${trimmedInput}`;
            }
            
            // 使用validator.js检验URL
            if (!validator.isURL(urlToCheck, {
                protocols: ['http', 'https'],
                require_protocol: true,
                require_valid_protocol: true,
                allow_underscores: true,
                allow_trailing_dot: false,
                allow_protocol_relative_urls: false
            })) {
                return false;
            }
            
            // 进一步验证URL格式
            const url = new URL(urlToCheck);
            
            // 检查域名格式
            const hostname = url.hostname.toLowerCase();
            
            // 域名必须包含点号（除非是localhost）
            if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('.')) {
                return false;
            }
            
            // 检查是否是有效的域名格式
            if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                // 简单的域名验证：至少包含一个点，且TLD至少2个字符
                const parts = hostname.split('.');
                if (parts.length < 2) return false;
                
                const tld = parts[parts.length - 1];
                if (tld.length < 2) return false;
                
                // 检查是否包含有效字符
                if (!/^[a-z0-9.-]+$/i.test(hostname)) return false;
            }
            
            return true;
        } catch {
            return false;
        }
    };

    // 格式化URL，确保有正确的协议
    const formatURL = (input: string): string => {
        const trimmedInput = input.trim();
        
        // 如果已经有协议，直接返回
        if (trimmedInput.match(/^https?:\/\//i)) {
            return trimmedInput;
        }
        
        // 否则添加http://
        return `http://${trimmedInput}`;
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

                // 检测是否为URL输入
                const isURL = isValidURL(searchQuery);

                if (isURL) {
                    // 如果是URL，优先显示直接访问选项
                    const formattedURL = formatURL(searchQuery);
                    const urlSuggestion = {
                        id: 'direct-visit',
                        text: `直接访问: ${formattedURL}`,
                        query: formattedURL,
                        isDirectVisit: true,
                        displayUrl: formattedURL
                    };
                    
                    // 生成常规搜索建议作为备选
                    generateSuggestions(searchQuery).then((newSuggestions) => {
                        // URL建议放在最前面
                        const allSuggestions = [urlSuggestion, ...newSuggestions];
                        setSuggestions(allSuggestions);
                        // 只要有任一类型的建议就显示下拉框
                        setShowSuggestions(matchedWebsites.length > 0 || allSuggestions.length > 0);
                        setSelectedSuggestionIndex(-1);
                    });
                } else {
                    // 总是生成搜索建议，与网站卡片并存
                    generateSuggestions(searchQuery).then((newSuggestions) => {
                        setSuggestions(newSuggestions);
                        // 只要有任一类型的建议就显示下拉框
                        setShowSuggestions(matchedWebsites.length > 0 || newSuggestions.length > 0);
                        setSelectedSuggestionIndex(-1);
                    });
                }
            } else {
                setSuggestions([]);
                setWebsiteSuggestions([]);
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, websites]);

    const handleSearch = (e: React.FormEvent, suggestionQuery?: string, website?: WebsiteData, isDirectVisit?: boolean) => {
        e.preventDefault();

        // 如果是网站建议，直接打开网站
        if (website) {
            openUrl(website.url);
            setSearchQuery('');
            setShowSuggestions(false);
            setWebsiteSuggestions([]);
            return;
        }

        // 如果是直接访问URL
        if (isDirectVisit && suggestionQuery) {
            openUrl(suggestionQuery);
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
                openUrl(selectedWebsite.url);
                setSearchQuery('');
                setShowSuggestions(false);
                setWebsiteSuggestions([]);
                return;
            } else {
                // 选中的是搜索引擎建议
                const suggestionIndex = selectedSuggestionIndex - websiteSuggestions.length;
                const selectedSuggestion = suggestions[suggestionIndex];
                
                // 检查是否是直接访问建议
                if (selectedSuggestion?.isDirectVisit) {
                    openUrl(selectedSuggestion.query);
                    setSearchQuery('');
                    setShowSuggestions(false);
                    setWebsiteSuggestions([]);
                    return;
                }
                
                // 常规搜索
                const queryToSearch = selectedSuggestion?.query || searchQuery;
                if (queryToSearch.trim()) {
                    openUrl(getSearchUrl(engine, queryToSearch));
                    setSearchQuery('');
                    setShowSuggestions(false);
                    setWebsiteSuggestions([]);
                }
                return;
            }
        }

        // 默认搜索或直接访问
        const queryToSearch = suggestionQuery || searchQuery;
        if (queryToSearch.trim()) {
            // 检测是否为URL
            if (isValidURL(queryToSearch)) {
                // 直接访问URL
                openUrl(formatURL(queryToSearch));
            } else {
                // 搜索引擎搜索
                openUrl(getSearchUrl(engine, queryToSearch));
            }
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
            // Tab键处理已移至全局键盘监听，避免冲突
        }
    };



    // AI图标位置不需要复杂计算，直接相对于搜索按钮定位
    // useLayoutEffect 已移除，使用CSS直接定位

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
                            setIsHovered(false);
                            setShowSuggestions(false);
                            setWebsiteSuggestions([]);
                            inputRef.current?.blur();
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="relative left-0 right-0 z-50 flex justify-center px-4 select-none" style={{ transform: 'translateX(-47px)' }}>
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
                            setIsHovered(true);
                        }}
                        onMouseLeave={() => {
                            // 只有在未聚焦状态下才缩短搜索框
                            if (!isFocused) {
                                setIsHovered(false);
                                    // 建议保持显示，只有取消聚焦时才隐藏
                            }
                        }}
                    >
                        <motion.div
                            animate={{ width: isHovered ? (isMobile ? 320 : 520) : (isMobile ? 280 : 340) }}
                            initial={{ width: isMobile ? 280 : 340 }}
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 5,
                                mass: 0.6
                            }}
                            style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
                            onAnimationComplete={() => { /* Animation complete */ }}
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
                            <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    setIsFocused(true);
                                    setIsSearchFocused(true);
                                    // 聚焦时如果有搜索内容，重新生成并显示建议
                                    if (searchQuery.trim()) {
                                        const matchedWebsites = searchWebsites(searchQuery);
                                        setWebsiteSuggestions(matchedWebsites);

                                        // 检测是否为URL输入
                                        const isURL = isValidURL(searchQuery);

                                        if (isURL) {
                                            // 如果是URL，优先显示直接访问选项
                                            const formattedURL = formatURL(searchQuery);
                                            const urlSuggestion = {
                                                id: 'direct-visit',
                                                text: `直接访问: ${formattedURL}`,
                                                query: formattedURL,
                                                isDirectVisit: true,
                                                displayUrl: formattedURL
                                            };
                                            
                                            // 生成常规搜索建议作为备选
                                            generateSuggestions(searchQuery).then((newSuggestions) => {
                                                // URL建议放在最前面
                                                const allSuggestions = [urlSuggestion, ...newSuggestions];
                                                setSuggestions(allSuggestions);
                                                // 只要有任一类型的建议就显示下拉框
                                                if (matchedWebsites.length > 0 || allSuggestions.length > 0) {
                                                    setShowSuggestions(true);
                                                    setSelectedSuggestionIndex(-1);
                                                }
                                            });
                                        } else {
                                            // 重新生成搜索建议
                                            generateSuggestions(searchQuery).then((newSuggestions) => {
                                                setSuggestions(newSuggestions);
                                                // 只要有任一类型的建议就显示下拉框
                                                if (matchedWebsites.length > 0 || newSuggestions.length > 0) {
                                                    setShowSuggestions(true);
                                                    setSelectedSuggestionIndex(-1);
                                                }
                                            });
                                        }
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setIsFocused(false);
                                        setIsSearchFocused(false);
                                        // 失去焦点时隐藏建议
                                        setShowSuggestions(false);
                                        setWebsiteSuggestions([]);
                                        // 失去焦点时，如果鼠标不在搜索框区域内，则缩短搜索框
                                        setIsHovered(false);
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
                            
                            {/* 搜索建议列表 - 现在相对于输入框定位 */}
                            <AnimatePresence>
                                {showSuggestions && (websiteSuggestions.length > 0 || suggestions.length > 0) && (
                                    <motion.div
                                        className={`absolute top-full left-3 right-0 mt-2 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-50 overflow-hidden overflow-y-auto ${isMobile ? 'max-h-60' : 'max-h-80'
                                            }`}
                                        initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                        exit={{
                                            scaleY: 0,
                                            transition: {
                                                duration: 0.3,
                                                ease: "easeInOut"
                                            }
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 280,
                                            damping: 6,
                                            mass: 0.5
                                        }}
                                        style={{
                                            pointerEvents: 'auto',
                                            backgroundColor: `rgba(255, 255, 255, 0.95)`, // 更清晰的背景
                                            transformOrigin: 'top center', // 从顶部固定，底部收起
                                            overflow: 'hidden' // 确保内容被正确裁剪
                                        }}
                                        onMouseEnter={() => {
                                            // 保持建议显示
                                        }}
                                        onMouseLeave={() => {
                                            // 建议保持显示，只有取消聚焦时才隐藏
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
                                                            className={`${isMobile ? 'px-3 py-2' : 'px-4 py-3'} cursor-pointer transition-all duration-200 border-b border-gray-100/50 last:border-b-0 select-none ${isSelected
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
                                                    const isDirectVisit = (suggestion as any).isDirectVisit;
                                                    
                                                    return (
                                                        <div
                                                            key={suggestion.id}
                                                            className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100/50 last:border-b-0 select-none ${
                                                                isSelected
                                                                    ? isDirectVisit 
                                                                        ? 'bg-green-500/10 text-gray-800 border-l-4 border-green-500'
                                                                        : 'bg-blue-500/10 text-gray-800'
                                                                    : isDirectVisit
                                                                        ? 'hover:bg-green-50 text-gray-700 border-l-4 border-transparent hover:border-green-200'
                                                                        : 'hover:bg-gray-50 text-gray-700'
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isDirectVisit) {
                                                                    handleSearch(e as any, suggestion.query, undefined, true);
                                                                } else {
                                                                    setSearchQuery(suggestion.text);
                                                                    handleSearch(e as any, suggestion.query);
                                                                }
                                                            }}
                                                            onMouseEnter={() => setSelectedSuggestionIndex(adjustedIndex)}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                        >
                                                            <div className="flex items-center gap-3 select-none">
                                                                {isDirectVisit ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <i className="fa-solid fa-external-link-alt text-green-600 text-sm w-4 select-none"></i>
                                                                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                                            直接访问
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm w-4 select-none"></i>
                                                                )}
                                                                <div className="flex-1 min-w-0 select-none">
                                                                    {isDirectVisit ? (
                                                                        <div>
                                                                            <div className="font-medium text-sm text-green-700 select-none">直接访问网站</div>
                                                                            <div className="text-xs text-green-600 truncate select-none">{(suggestion as any).displayUrl}</div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="font-medium text-sm truncate select-none">{suggestion.text}</div>
                                                                    )}
                                                                </div>
                                                                <div className={`text-xs px-2 py-1 rounded ${
                                                                    isDirectVisit 
                                                                        ? 'text-green-600 bg-green-100'
                                                                        : 'text-gray-400 bg-gray-100'
                                                                }`}>
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
                            </AnimatePresence>
                            </div>
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
                                    transition={{ type: 'spring', stiffness: 350, damping: 6 }}
                                    style={{ display: 'inline-block' }}
                                />
                                
                                {/* 悬停时显示的AI图标（以搜索图标为圆心） */}
                                {isHovered && (
                                    <div
                                        className="absolute z-30"
                                        style={{
                                            left: '50%',     // 按钮中心
                                            top: 'calc(50% - 15px)',  // 向上调整15px
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
                                                const rectHeight = 19;
                                                const rectWidth = rectHeight * 3.6;
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
                                                            damping: 8,
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
                                                                    background: 'rgba(255,255,255,0.98)',
                                                                    color: '#222',
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
                            </button>

                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </>
    );
}

export const SearchBar = memo(SearchBarComponent, (prevProps, nextProps) => {
    if (!prevProps || !nextProps) return false;
    return prevProps.websites === nextProps.websites;
});