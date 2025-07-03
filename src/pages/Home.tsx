import { useState, useEffect } from 'react';
import { WebsiteCard } from '@/components/WebsiteCard';
import { SearchBar } from '@/components/SearchBar';
import { AnimatedCat } from '@/components/AnimatedCat';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { motion } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAutoSync } from '@/hooks/useAutoSync';
import Settings from '@/pages/Settings';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { faviconCache } from '@/lib/faviconCache';

interface HomeProps {
  websites: any[];
  setWebsites: (websites: any[]) => void;
}

export default function Home({ websites, setWebsites }: HomeProps) {
  const { parallaxEnabled, wallpaperResolution, isSettingsOpen } = useTransparency();
  const { currentUser } = useAuth();
  const { displayName } = useUserProfile();
  
  // 启用自动同步
  useAutoSync(websites);
  
  const { drag, drop, isDragging } = useDragAndDrop(websites, setWebsites);
  const [bgImage, setBgImage] = useState('');
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGreeting, setShowGreeting] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 组件挂载时立即检查缓存，提供即时加载体验
  useEffect(() => {
    const getTodayKey = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    const getCacheKey = () => `wallpaper-${wallpaperResolution}-${getTodayKey()}`;

    const getCachedWallpaper = () => {
      try {
        const cacheKey = getCacheKey();
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { url, timestamp } = JSON.parse(cached);
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          if (now - timestamp < oneDay && url) {
            return url;
          }
        }
      } catch (error) {
        console.warn('读取壁纸缓存失败:', error);
      }
      return null;
    };
    
    const cachedUrl = getCachedWallpaper();
    if (cachedUrl) {
      setBgImage(cachedUrl);
      setBgImageLoaded(true);
      console.log('⚡ 即时加载缓存壁纸');
    }
  }, []); // 只在组件挂载时执行一次

  // 壁纸预加载机制 - 简化版本
  useEffect(() => {
    // 在组件挂载后延迟预加载壁纸，避免阻塞首屏渲染
    const preloadTimer = setTimeout(() => {
      const getTodayKey = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
      };

      const getCacheKey = (resolution: string) => `wallpaper-${resolution}-${getTodayKey()}`;

      const getCachedWallpaper = (resolution: string) => {
        try {
          const cacheKey = getCacheKey(resolution);
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { url, timestamp } = JSON.parse(cached);
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - timestamp < oneDay && url) {
              return url;
            }
          }
        } catch (error) {
          console.warn('读取缓存失败:', error);
        }
        return null;
      };

      // 检查当前分辨率是否有缓存
      const cachedUrl = getCachedWallpaper(wallpaperResolution);
      if (!cachedUrl) {
        console.log('🚀 当前分辨率无缓存，将在正常加载时获取');
      } else {
        console.log('✅ 当前分辨率已有缓存');
      }
    }, 300);

    return () => clearTimeout(preloadTimer);
  }, [wallpaperResolution]);

  // 根据访问次数自动排序卡片
  const sortedWebsites = [...websites].sort((a, b) => {
    // 首先按访问次数降序排序
    const visitDiff = (b.visitCount || 0) - (a.visitCount || 0);
    if (visitDiff !== 0) return visitDiff;
    
    // 如果访问次数相同，按最后访问时间降序排序
    const dateA = new Date(a.lastVisit || '2000-01-01').getTime();
    const dateB = new Date(b.lastVisit || '2000-01-01').getTime();
    return dateB - dateA;
  });

  // 处理用户名框点击事件
  const handleUserNameClick = () => {
    if (isAnimating) return; // 防止动画期间重复点击
    
    setClickCount(prev => prev + 1);
    setIsAnimating(true);
    setShowGreeting(true);
    
    // 1秒后开始淡出
    setTimeout(() => {
      setShowGreeting(false);
      // 再等待动画完成后重置动画状态
      setTimeout(() => {
        setIsAnimating(false);
      }, 300); // 等待淡出动画完成
    }, 1000);
  };

  const handleSaveCard = (updatedCard: {
    id: string;
    name: string;
    url: string;
    favicon: string;
    tags: string[];
    note?: string;
    visitCount?: number;
    lastVisit?: string;
  }) => {
    setWebsites(
      websites.map(card =>
        card.id === updatedCard.id ? { ...card, ...updatedCard } : card
      )
    );
  };

  // 计算视差变换 - 基于博客思路优化
  const calculateParallaxTransform = () => {
    // 如果视差被禁用或设置页面打开，返回默认值
    if (!parallaxEnabled || isSettingsOpen || !mousePosition.x || !mousePosition.y) {
      return 'translate(0px, 0px)'; // 默认无偏移
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 旋转角度系数
    const range = 20;
    
    // 旋转公式（返回-10 ~ 10，保留1位小数）
    const calcValue = (a: number, b: number) => (a / b * range - range / 2).toFixed(1);
    
    // 通过 calcValue 根据鼠标当前位置和容器宽高比计算得出的值
    const xValue = parseFloat(calcValue(mousePosition.x, windowWidth));
    const yValue = parseFloat(calcValue(mousePosition.y, windowHeight));
    
    // 背景图偏移（使用更小的系数让移动更微妙）
    const translateX = -xValue * 0.4;
    const translateY = -yValue * 0.4;
    
    return `translate(${translateX}px, ${translateY}px)`;
  };

  useEffect(() => {
    // 根据分辨率设置获取对应的壁纸URL
    const getWallpaperUrl = (resolution: string) => {
      // 使用官方可靠的Bing壁纸API
      const wallpapers = {
        '4k': 'https://bing.img.run/uhd.php',
        '1080p': 'https://bing.img.run/1920x1080.php',
        '720p': 'https://bing.img.run/1366x768.php',
        'mobile': 'https://bing.img.run/m.php'
      };
      return wallpapers[resolution as keyof typeof wallpapers];
    };

    // 备用壁纸URLs（用于localhost开发环境）
    const getFallbackWallpaperUrl = () => {
      // 使用无跨域限制的备用壁纸
      const fallbackWallpapers = [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&h=1080&fit=crop'
      ];
      const today = new Date().getDate();
      return fallbackWallpapers[today % fallbackWallpapers.length];
    };

    // 获取今天的日期字符串
    const getTodayKey = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    // 生成缓存键
    const getCacheKey = () => `wallpaper-${wallpaperResolution}-${getTodayKey()}`;

    // 从缓存中获取今天的壁纸
    const getCachedWallpaper = () => {
      try {
        const cacheKey = getCacheKey();
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { url, timestamp } = JSON.parse(cached);
          // 检查缓存是否在24小时内有效
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          if (now - timestamp < oneDay && url) {
            return url;
          }
        }
      } catch (error) {
        console.warn('读取壁纸缓存失败:', error);
      }
      return null;
    };

    // 缓存壁纸URL
    const cacheWallpaper = (imageUrl: string) => {
      try {
        const cacheKey = getCacheKey();
        const cacheData = {
          url: imageUrl,
          timestamp: Date.now(),
          resolution: wallpaperResolution
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('✅ 壁纸已缓存');
      } catch (error) {
        console.warn('缓存壁纸失败:', error);
      }
    };

    const loadWallpaper = (apiUrl: string, isFallback = false) => {
      console.log('🖼️ 加载壁纸，分辨率:', wallpaperResolution, isFallback ? '(备用)' : '');
      setBgImageLoaded(false);
      
      const img = new Image();
      // 不设置 crossOrigin，避免 CORS 问题
      // img.crossOrigin = 'anonymous';
      
      // 超时处理
      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        console.warn('⏰ 壁纸加载超时，使用备用壁纸');
        // 超时时使用备用壁纸而非空背景
        if (!isFallback) {
          const fallbackUrl = getFallbackWallpaperUrl();
          loadWallpaper(fallbackUrl, true);
        } else {
          setBgImage('');
          setBgImageLoaded(true);
        }
      }, 6000); // 减少到6秒超时
      
      img.onload = () => {
        clearTimeout(timeout);
        setBgImage(img.src);
        setBgImageLoaded(true);
        cacheWallpaper(img.src); // 缓存实际的图片URL（重定向后的最终URL）
        console.log('✅ 壁纸加载完成:', img.src);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        
        // 如果是主要API失败，尝试备用壁纸
        if (!isFallback) {
          console.warn('❌ 主要壁纸API失败，尝试备用壁纸');
          const fallbackUrl = getFallbackWallpaperUrl();
          loadWallpaper(fallbackUrl, true);
        } else {
          console.warn('❌ 备用壁纸也失败，使用占位背景');
          setBgImage('');
          setBgImageLoaded(true);
        }
      };
      
      img.src = apiUrl;
    };

    // 检查缓存，如果有效就直接使用
    const cachedUrl = getCachedWallpaper();
    if (cachedUrl) {
      console.log('📦 使用缓存壁纸:', cachedUrl);
      setBgImage(cachedUrl);
      setBgImageLoaded(true);
    } else {
      // 优先使用官方 Bing 壁纸 API（所有环境）
      const wallpaperUrl = getWallpaperUrl(wallpaperResolution);
      console.log('🌐 加载官方 Bing 壁纸:', wallpaperUrl);
      loadWallpaper(wallpaperUrl);
    }
  }, [wallpaperResolution]);

  // 监听鼠标移动 - 根据视差开关决定是否启用
  useEffect(() => {
    // 如果视差被禁用或设置页面打开，不添加鼠标监听器
    if (!parallaxEnabled || isSettingsOpen) {
      setMousePosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [parallaxEnabled, isSettingsOpen]);

  // 预加载 favicon
  useEffect(() => {
    if (websites.length > 0) {
      // 延迟预加载，避免影响主要内容的加载
      const timer = setTimeout(() => {
        faviconCache.preloadFavicons(
          websites.map(website => ({
            url: website.url,
            favicon: website.favicon
          }))
        );
      }, 1000); // 1秒后开始预加载

      return () => clearTimeout(timer);
    }
  }, [websites]);

    return (
    <>
      {/* 邮箱验证横幅 */}
      <EmailVerificationBanner />
      
      {/* 壁纸背景层 */}
      <div 
        className="fixed top-0 left-0 w-full h-full -z-10"
        style={{ 
          backgroundImage: bgImage ? `url(${bgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          transform: calculateParallaxTransform(),
          transition: 'transform 0.1s ease-out, filter 1.2s ease-out',
          opacity: bgImageLoaded && bgImage ? 1 : 0,
          backgroundColor: '#1e293b', // 更深的占位背景色（slate-800）
          filter: bgImageLoaded && bgImage ? 'brightness(1)' : 'brightness(0.3)' // "天亮了"效果：从暗到亮
        }}
      />
      
      {/* 天亮渐变遮罩层 - 营造"黎明"效果 */}
      {bgImage && (
        <div 
          className="fixed top-0 left-0 w-full h-full -z-9"
          style={{
            background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.7) 0%, rgba(30, 41, 59, 0.3) 50%, rgba(30, 41, 59, 0.1) 100%)',
            opacity: bgImageLoaded ? 0 : 1,
            transition: 'opacity 1.5s ease-out',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* 壁纸加载指示器 - 简化版本 */}
      {!bgImageLoaded && bgImage && (
        <div className="fixed top-4 left-4 z-40 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white/90 text-sm font-medium flex items-center space-x-2">
            <div className="animate-pulse rounded-full h-2 w-2 bg-white/70"></div>
            <span>壁纸加载中</span>
          </div>
        </div>
      )}
      
      <div className="relative min-h-screen pt-[33vh]">
    
      <SearchBar />
      
      <div className="pt-16 pb-8 px-4 max-w-6xl mx-auto">
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {sortedWebsites.map((website) => (
             <motion.div 
              key={website.id}
              ref={(node) => drag(drop(node))}
              style={{ opacity: isDragging ? 0.5 : 1 }}
              layout
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              <WebsiteCard 
                {...website} 
                onSave={handleSaveCard}
                onDelete={(id) => {
                  setWebsites(websites.filter(card => card.id !== id));
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)}
          websites={websites}
          setWebsites={setWebsites}
        />
      )}

      {/* 用户信息显示 - 仅在邮箱已验证时显示 */}
      {currentUser && currentUser.emailVerified && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={handleUserNameClick}
            className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2 hover:bg-white/30 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-user text-white/80"></i>
            <span className="text-white/90 text-sm font-medium">
              {displayName}
            </span>
          </button>
          
          {/* 问候语气泡 */}
          {showGreeting && (
            <div className={`absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-white/20 transition-opacity duration-300 ${showGreeting ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-gray-800 text-sm font-medium whitespace-nowrap">
                {clickCount >= 10 ? (
                  <>
                    <span className="text-red-500">😠</span> 别点啦！
                  </>
                ) : (
                  `你好鸭，"${displayName}"，今天也要开心哦！`
                )}
              </p>
              <div className="absolute -top-2 right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white/95"></div>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-white/70 hover:text-white transition-colors"
          aria-label="设置"
        >
          <i className="fa-solid fa-sliders text-lg"></i>
        </button>
      </div>

      <AnimatedCat />
      </div>
    </>
  );
}