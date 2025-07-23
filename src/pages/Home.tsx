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
import WorkspaceModal from '@/components/Workspace/WorkspaceModal';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { faviconCache } from '@/lib/faviconCache';
import { improvedWallpaperCache } from '@/lib/cacheManager';
import { indexedDBCache } from '@/lib/indexedDBCache';
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
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useWorkspace();
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

    const getBlobCacheKey = () => `blob-${wallpaperResolution}-${getTodayKey()}`;

    const getCachedWallpaper = async () => {
      try {
        // 只检查IndexedDB Blob缓存
        const blobCacheKey = getBlobCacheKey();
        console.log('🔍 检查Blob缓存键:', blobCacheKey);
        
        const cachedBlobUrl = await improvedWallpaperCache.getCachedWallpaper(blobCacheKey);
        if (cachedBlobUrl) {
          console.log('⚡ 使用本地Blob缓存');
          return cachedBlobUrl;
        }
      } catch (error) {
        console.warn('读取壁纸缓存失败:', error);
      }
      return null;
    };
    
    getCachedWallpaper().then(cachedUrl => {
      if (cachedUrl) {
        setBgImage(cachedUrl);
        setBgImageLoaded(true);
        console.log('⚡ 即时加载缓存壁纸');
      }
    });
  }, []); // 只在组件挂载时执行一次

  // 开发环境下提供缓存清理功能
  useEffect(() => {
    if (import.meta.env.DEV) {
      // 在全局对象上暴露清理函数，方便调试
      (window as any).clearWallpaperCache = async () => {
        try {
          const getTodayKey = () => {
            const today = new Date();
            return today.toISOString().split('T')[0];
          };
          const blobCacheKey = `blob-${wallpaperResolution}-${getTodayKey()}`;
          const fullCacheKey = `wallpaper-blob:${blobCacheKey}`;
          await indexedDBCache.delete(fullCacheKey);
          console.log('🗑️ 壁纸缓存已清理:', fullCacheKey);
          window.location.reload();
        } catch (error) {
          console.error('清理缓存失败:', error);
        }
      };
      console.log('🔧 开发模式：可使用 clearWallpaperCache() 清理壁纸缓存');
    }
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
    // 使用Supabase壁纸服务获取壁纸URL
    const getWallpaperUrl = async (resolution: string) => {
      try {
        // 获取 Supabase URL
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
        
        if (supabaseUrl) {
          // 分辨率映射
          const resolutionMap = {
            '4k': 'uhd',
            '1080p': '1920x1080',
            '720p': '1366x768',
            'mobile': 'mobile'
          };
          
          const targetResolution = resolutionMap[resolution as keyof typeof resolutionMap] || '1920x1080';
          const wallpaperUrl = `${supabaseUrl}/functions/v1/wallpaper-service?resolution=${targetResolution}`;
          
          console.log(`🖼️ 使用Supabase壁纸服务: ${wallpaperUrl}`);
          return wallpaperUrl;
        } else {
          console.warn('⚠️ Supabase URL未配置，使用备用壁纸');
        }
      } catch (error) {
        console.warn('⚠️ Supabase壁纸服务访问失败:', error);
      }
      
      // 备用方案：使用本地默认壁纸
      console.log('🔄 使用备用壁纸方案');
      return '/icon/icon.jpg'; // 使用本地默认图片作为备用
    };

    // 获取今天的日期字符串
    const getTodayKey = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    // 生成缓存键
    const getBlobCacheKey = () => `blob-${wallpaperResolution}-${getTodayKey()}`;

    // 检查本地缓存
    const getCachedWallpaper = async () => {
      try {
        const blobCacheKey = getBlobCacheKey();
        console.log('🔍 检查本地缓存:', blobCacheKey);
        
        const cachedBlobUrl = await improvedWallpaperCache.getCachedWallpaper(blobCacheKey);
        if (cachedBlobUrl) {
          console.log('⚡ 使用本地缓存');
          return cachedBlobUrl;
        }
      } catch (error) {
        console.warn('读取缓存失败:', error);
      }
      return null;
    };

    // 缓存壁纸（仅Blob缓存）
    const cacheWallpaper = async (imageUrl: string) => {
      try {
        const blobCacheKey = getBlobCacheKey();
        console.log('🚀 开始缓存壁纸Blob...');
        await improvedWallpaperCache.cacheWallpaperBlob(imageUrl, blobCacheKey);
        console.log('✅ 壁纸已缓存');
      } catch (error) {
        console.warn('缓存壁纸失败:', error);
      }
    };

    const loadWallpaper = (apiUrl: string) => {
      console.log('🖼️ 加载壁纸，分辨率:', wallpaperResolution);
      setBgImageLoaded(false);
      
      // 如果URL需要代理访问，使用公共CORS代理
      const proxyUrl = apiUrl.includes('bing.com') 
        ? `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`
        : apiUrl;
      
      console.log('🔄 壁纸代理URL:', proxyUrl);
      
      const img = new Image();
      
      // 超时处理
      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        console.warn('⏰ 壁纸加载超时');
        setBgImage('');
        setBgImageLoaded(true);
      }, 15000); // 延长到15秒超时
      
      img.onload = () => {
        clearTimeout(timeout);
        setBgImage(proxyUrl);
        setBgImageLoaded(true);
        cacheWallpaper(proxyUrl); // 缓存代理URL
        console.log('✅ 壁纸加载完成:', proxyUrl);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.warn('❌ 壁纸加载失败:', proxyUrl);
        setBgImage('');
        setBgImageLoaded(true);
      };
      
      img.src = proxyUrl;
    };

    // 主要逻辑：优先使用本地缓存，无缓存时才加载新壁纸
    getCachedWallpaper().then(async (cached) => {
      if (cached) {
        console.log('📦 使用本地缓存壁纸');
        setBgImage(cached);
        setBgImageLoaded(true);
        
        // 使用缓存后，异步检查是否需要更新（可以添加日期比较逻辑）
        console.log('🔄 本地缓存已加载，可以后台检查更新');
      } else {
        // 无本地缓存，直接加载新壁纸
        try {
          const wallpaperUrl = await getWallpaperUrl(wallpaperResolution);
          console.log('🌐 无本地缓存，加载新壁纸:', wallpaperUrl);
          loadWallpaper(wallpaperUrl);
        } catch (error) {
          console.warn('获取壁纸URL失败:', error);
          setBgImage('');
          setBgImageLoaded(true);
        }
      }
    }).catch(async (error) => {
      console.warn('检查缓存失败:', error);
      // 如果缓存检查失败，直接加载壁纸
      try {
        const wallpaperUrl = await getWallpaperUrl(wallpaperResolution);
        console.log('🌐 加载壁纸:', wallpaperUrl);
        loadWallpaper(wallpaperUrl);
      } catch (error) {
        console.warn('获取壁纸URL失败:', error);
        setBgImage('');
        setBgImageLoaded(true);
      }
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

  // 智能预缓存 favicon（避免冗余）
  useEffect(() => {
    if (websites.length > 0) {
      // 延迟执行，避免阻塞首屏渲染
      const timer = setTimeout(() => {
        // 检查是否有未缓存的favicon
        const uncachedWebsites = websites.filter(website => {
          const cached = faviconCache.getCachedFavicon(website.url);
          return !cached;
        });

        if (uncachedWebsites.length > 0) {
          console.log(`🚀 [Home] 开始批量预缓存 ${uncachedWebsites.length} 个未缓存的 favicon...`);
          faviconCache.batchCacheFaviconsToIndexedDB(uncachedWebsites)
            .then(() => {
              console.log('✅ [Home] Favicon 批量预缓存完成');
            })
            .catch(error => {
              console.warn('❌ [Home] Favicon 批量预缓存失败:', error);
            });
        } else {
          console.log('📦 [Home] 所有 favicon 均已缓存，跳过批量预缓存');
        }
      }, 1500); // 减少到1.5秒，更快响应数据变化

      return () => clearTimeout(timer);
    }
  }, [websites]); // 当网站数据变化时触发

  // 监听用户登录状态变化，触发图标预缓存
  useEffect(() => {
    if (currentUser && currentUser.email_confirmed_at && websites.length > 0) {
      // 用户登录后，检查是否需要预缓存图标
      const timer = setTimeout(() => {
        console.log('👤 用户登录状态变化，检查图标缓存需求...');
        const uncachedWebsites = websites.filter(website => {
          const cached = faviconCache.getCachedFavicon(website.url);
          return !cached;
        });

        if (uncachedWebsites.length > 0) {
          console.log(`🚀 [登录后] 开始预缓存 ${uncachedWebsites.length} 个图标...`);
          faviconCache.batchCacheFaviconsToIndexedDB(uncachedWebsites)
            .then(() => console.log('✅ [登录后] 图标预缓存完成'))
            .catch(error => console.warn('❌ [登录后] 图标预缓存失败:', error));
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentUser?.email_confirmed_at, websites.length]); // 监听登录状态和网站数量变化

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
      workspaceButton: isMobile 
        ? 'fixed top-2 left-2 z-40 scale-90' 
        : 'fixed top-4 left-4 z-40',
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
          <SearchBar websites={websites} />
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

        {/* 工作空间触发按钮 - 响应式调整 */}
        <div className={classes.workspaceButton}>
          <button
            onClick={() => setIsWorkspaceOpen(true)}
            className={`bg-white/20 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-2'} flex items-center space-x-2 hover:bg-white/30 transition-colors cursor-pointer group`}
            title="工作空间"
          >
            <i className={`fa-solid fa-briefcase text-white/80 group-hover:text-white transition-colors ${isMobile ? 'text-xs' : ''}`}></i>
            {!isMobile && (
              <span className="text-white/90 text-sm font-medium group-hover:text-white transition-colors">
                工作空间
              </span>
            )}
          </button>
        </div>

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
        
        {/* 工作空间模态框 */}
        <WorkspaceModal 
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
        />
      </div>
    </>
  );
}