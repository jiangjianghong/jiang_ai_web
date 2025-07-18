import { useState, useEffect, useCallback } from 'react';
import { WebsiteCard } from '@/components/WebsiteCard';
import { SearchBar } from '@/components/SearchBar';
import { AnimatedCat } from '@/components/AnimatedCat';
// 拖拽逻辑已迁移到 WebsiteCard
import { motion } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAutoSync } from '@/hooks/useAutoSync';
import Settings from '@/pages/Settings';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { faviconCache } from '@/lib/faviconCache';
import { improvedWallpaperCache } from '@/lib/cacheManager';
import { useRAFThrottledMouseMove } from '@/hooks/useRAFThrottle';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface HomeProps {
  websites: any[];
  setWebsites: (websites: any[]) => void;
}

export default function Home({ websites, setWebsites }: HomeProps) {
  const { parallaxEnabled, wallpaperResolution, isSettingsOpen } = useTransparency();
  const { currentUser } = useAuth();
  const { displayName } = useUserProfile();
  const { 
    isMobile, 
    getGridClasses, 
    getSearchBarLayout
  } = useResponsiveLayout();
  
  // 启用自动同步
  useAutoSync(websites);
  
  // 拖拽排序逻辑
  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const newWebsites = [...websites];
    const [removed] = newWebsites.splice(dragIndex, 1);
    newWebsites.splice(hoverIndex, 0, removed);
    setWebsites(newWebsites);
  };

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
    const getBlobCacheKey = () => `blob-${wallpaperResolution}-${getTodayKey()}`;

    // 混合缓存策略：优先检查高级Blob缓存，然后检查URL缓存
    const getCachedWallpaper = async () => {
      try {
        // 1. 首先检查高级Blob缓存（IndexedDB）
        const blobCacheKey = getBlobCacheKey();
        console.log('🔍 检查Blob缓存键:', blobCacheKey);
        
        const cachedBlobUrl = await improvedWallpaperCache.getCachedWallpaper(blobCacheKey);
        console.log('🔍 Blob缓存结果:', cachedBlobUrl ? '找到' : '未找到');
        if (cachedBlobUrl) {
          console.log('⚡ 使用高级Blob缓存');
          return { url: cachedBlobUrl, type: 'blob' };
        }

        // 2. 回退到URL缓存
        const cacheKey = getCacheKey();
        console.log('🔍 检查URL缓存键:', cacheKey);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { url, timestamp } = JSON.parse(cached);
          // 检查缓存是否在24小时内有效
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          if (now - timestamp < oneDay && url) {
            console.log('📦 使用URL缓存');
            return { url, type: 'url' };
          }
        }
      } catch (error) {
        console.warn('读取壁纸缓存失败:', error);
      }
      return null;
    };

    // 智能缓存壁纸：同时缓存URL和Blob
    const cacheWallpaper = async (imageUrl: string) => {
      try {
        // 1. 缓存URL（快速回退方案）
        const cacheKey = getCacheKey();
        const cacheData = {
          url: imageUrl,
          timestamp: Date.now(),
          resolution: wallpaperResolution
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('✅ URL缓存完成');
        
        // 2. 异步缓存Blob（性能增强方案）
        const blobCacheKey = getBlobCacheKey();
        console.log('🚀 开始异步创建Blob缓存...');
        improvedWallpaperCache.cacheWallpaperBlob(imageUrl, blobCacheKey)
          .then((blobUrl) => {
            console.log('✅ 壁纸Blob已缓存，下次访问将瞬间加载');
            console.log('🎯 Blob URL:', blobUrl);
          })
          .catch(error => {
            console.warn('❌ Blob缓存失败，但URL缓存仍可用:', error);
          });

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
        cacheWallpaper(img.src); // 智能缓存实际的图片URL
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
    getCachedWallpaper().then(cached => {
      if (cached) {
        console.log(`📦 使用${cached.type === 'blob' ? '高级Blob' : 'URL'}缓存:`, cached.url);
        setBgImage(cached.url);
        setBgImageLoaded(true);
        
        // 如果使用的是URL缓存，异步创建Blob缓存以提升未来的加载速度
        if (cached.type === 'url') {
          const blobCacheKey = getBlobCacheKey();
          console.log('🚀 异步创建Blob缓存以提升未来性能...');
          improvedWallpaperCache.cacheWallpaperBlob(cached.url, blobCacheKey)
            .then((blobUrl) => {
              console.log('✅ 异步Blob缓存创建成功！下次访问将瞬间加载');
              console.log('🎯 Blob URL:', blobUrl);
            })
            .catch(error => {
              console.warn('❌ 异步Blob缓存失败:', error);
            });
        }
      } else {
        // 优先使用官方 Bing 壁纸 API（所有环境）
        const wallpaperUrl = getWallpaperUrl(wallpaperResolution);
        console.log('🌐 加载官方 Bing 壁纸:', wallpaperUrl);
        loadWallpaper(wallpaperUrl);
      }
    }).catch(error => {
      console.warn('检查缓存失败:', error);
      // 如果缓存检查失败，直接加载壁纸
      const wallpaperUrl = getWallpaperUrl(wallpaperResolution);
      console.log('🌐 加载官方 Bing 壁纸:', wallpaperUrl);
      loadWallpaper(wallpaperUrl);
    });
  }, [wallpaperResolution]);

  // 优化的鼠标移动处理器 - 使用 RAF 节流
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  const throttledMouseMove = useRAFThrottledMouseMove(
    handleMouseMove,
    parallaxEnabled && !isSettingsOpen
  );

  // 监听鼠标移动 - 使用 RAF 节流优化性能
  useEffect(() => {
    // 如果视差被禁用或设置页面打开，不添加鼠标监听器
    if (!parallaxEnabled || isSettingsOpen) {
      setMousePosition({ x: 0, y: 0 });
      return;
    }

    window.addEventListener('mousemove', throttledMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [parallaxEnabled, isSettingsOpen, throttledMouseMove]);

  // 预加载 favicon（已移除，使用下面的 IndexedDB 批量缓存代替）

  // 批量预缓存 favicon（简化版）
  useEffect(() => {
    if (websites.length > 0) {
      // 延迟执行，避免阻塞首屏渲染
      const timer = setTimeout(() => {
        console.log('🚀 开始简单批量预缓存 favicon...');
        faviconCache.batchCacheFaviconsToIndexedDB(websites)
          .then(() => {
            console.log('✅ Favicon 简单批量预缓存完成');
          })
          .catch(error => {
            console.warn('❌ Favicon 简单批量预缓存失败:', error);
          });
      }, 2000); // 2秒后开始，确保不影响首屏渲染

      return () => clearTimeout(timer);
    }
  }, [websites]); // 当网站数据变化时触发

  // 响应式布局配置
  const getResponsiveClasses = () => {
    const searchBarLayout = getSearchBarLayout();
    const gridClasses = getGridClasses();
    
    return {
      container: `relative min-h-screen ${isMobile ? 'pt-[25vh]' : 'pt-[33vh]'}`,
      searchContainer: searchBarLayout.containerClass,
      cardContainer: `${isMobile ? 'pt-8 pb-4' : 'pt-16 pb-8'} px-4 max-w-6xl mx-auto`,
      gridLayout: gridClasses,
      userInfo: isMobile 
        ? 'fixed top-2 right-2 z-40 scale-90' 
        : 'fixed top-4 right-4 z-40',
      settingsButton: isMobile 
        ? 'fixed bottom-2 right-2 z-[9999] p-2 bg-white/10 rounded-full backdrop-blur-sm' 
        : 'fixed bottom-4 right-4 z-[9999]'
    };
  };

  const classes = getResponsiveClasses();

  return (
    <>
      {/* 邮箱验证横幅 */}
      <EmailVerificationBanner />
      
      {/* 壁纸背景层 - 响应式优化 */}
      <div 
        className="fixed top-0 left-0 w-full h-full -z-10"
        style={{ 
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: isMobile ? 'center center' : 'center top',
          backgroundRepeat: 'no-repeat',
          filter: bgImageLoaded ? 'none' : 'blur(2px)',
          transform: !isSettingsOpen && parallaxEnabled && !isMobile && mousePosition ? 
            `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) scale(1.05)` : 
            'translate(0px, 0px) scale(1)',
          transition: 'filter 1.5s ease-out, transform 0.3s ease-out',
        }}
      />

      {/* 渐变遮罩层 - 响应式调整 */}
      {bgImage && (
        <div 
          className="fixed top-0 left-0 w-full h-full -z-10"
          style={{
            background: isMobile 
              ? 'linear-gradient(to bottom, rgba(30, 41, 59, 0.6) 0%, rgba(30, 41, 59, 0.4) 50%, rgba(30, 41, 59, 0.2) 100%)'
              : 'linear-gradient(to bottom, rgba(30, 41, 59, 0.7) 0%, rgba(30, 41, 59, 0.3) 50%, rgba(30, 41, 59, 0.1) 100%)',
            opacity: bgImageLoaded ? 0 : 1,
            transition: 'opacity 1.5s ease-out',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* 壁纸加载指示器 - 响应式位置 */}
      {!bgImageLoaded && bgImage && (
        <div className={`fixed ${isMobile ? 'top-2 left-2' : 'top-4 left-4'} z-40 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2`}>
          <div className="text-white/90 text-sm font-medium flex items-center space-x-2">
            <div className="animate-pulse rounded-full h-2 w-2 bg-white/70"></div>
            <span className={isMobile ? 'text-xs' : 'text-sm'}>壁纸加载中</span>
          </div>
        </div>
      )}
      
      <div className={classes.container}>
        <div className={classes.searchContainer}>
          <SearchBar />
        </div>
        
        <div className={classes.cardContainer}>
          <motion.div 
            className={classes.gridLayout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {sortedWebsites.map((website, idx) => (
              <WebsiteCard
                key={website.id}
                {...website}
                index={idx}
                moveCard={moveCard}
                onSave={handleSaveCard}
                onDelete={(id) => {
                  setWebsites(websites.filter(card => card.id !== id));
                }}
              />
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

        {/* 用户信息显示 - 响应式调整 */}
        {currentUser && currentUser.email_confirmed_at && (
          <div className={classes.userInfo}>
            <button
              onClick={handleUserNameClick}
              className={`bg-white/20 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-2'} flex items-center space-x-2 hover:bg-white/30 transition-colors cursor-pointer`}
            >
              <i className={`fa-solid fa-user text-white/80 ${isMobile ? 'text-xs' : ''}`}></i>
              <span className={`text-white/90 ${isMobile ? 'text-xs' : 'text-sm'} font-medium ${isMobile && displayName.length > 8 ? 'max-w-[60px] truncate' : ''}`}>
                {displayName}
              </span>
            </button>
            
            {/* 问候语气泡 - 响应式调整 */}
            {showGreeting && !isMobile && (
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

        <div className={classes.settingsButton}>
          <button
            onClick={() => setShowSettings(true)}
            className={`${isMobile ? 'p-2' : 'p-2'} text-white/70 hover:text-white transition-colors`}
            aria-label="设置"
          >
            <i className={`fa-solid fa-sliders ${isMobile ? 'text-base' : 'text-lg'}`}></i>
          </button>
        </div>

        {/* 动画猫 - 仅在非移动端显示 */}
        {!isMobile && <AnimatedCat />}
      </div>
    </>
  );
}