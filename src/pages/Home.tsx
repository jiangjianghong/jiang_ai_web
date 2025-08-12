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
import { useRAFThrottledMouseMove } from '@/hooks/useRAFThrottle';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useOptimizedWallpaper } from '@/hooks/useOptimizedWallpaper';
// 调试面板暂时禁用以修复构建问题
// import { WallpaperDebugPanel } from '@/components/WallpaperDebugPanel';
import { logger } from '@/lib/logger';

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

  // 使用优化的壁纸Hook
  const {
    url: bgImage,
    isLoading: bgImageLoading,
    isReady: bgImageLoaded,
    isFromCache,
    isToday,
    needsUpdate,
    showLoadingIndicator,
    showUpdateHint,
    refreshWallpaper,
    getCacheStats
  } = useOptimizedWallpaper(wallpaperResolution);

  const [showSettings, setShowSettings] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGreeting, setShowGreeting] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 开发环境下提供缓存清理功能
  useEffect(() => {
    if (import.meta.env.DEV) {
      // 在全局对象上暴露清理函数，方便调试
      (window as any).clearWallpaperCache = refreshWallpaper;
      (window as any).getWallpaperStats = getCacheStats;
      // 调试信息现在由logger管理
    }
  }, [refreshWallpaper, getCacheStats]);


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

  // 壁纸加载现在由 useOptimizedWallpaper Hook 处理

  // 优化的鼠标移动处理器 - 使用 RAF 节流
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  const throttledMouseMove = useRAFThrottledMouseMove(
    handleMouseMove,
    parallaxEnabled && !isSettingsOpen && !isWorkspaceOpen
  );

  // 监听鼠标移动 - 使用 RAF 节流优化性能
  useEffect(() => {
    // 如果视差被禁用或设置页面/工作空间打开，不添加鼠标监听器
    if (!parallaxEnabled || isSettingsOpen || isWorkspaceOpen) {
      setMousePosition({ x: 0, y: 0 });
      return;
    }

    window.addEventListener('mousemove', throttledMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [parallaxEnabled, isSettingsOpen, isWorkspaceOpen, throttledMouseMove]);

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
          logger.favicon.info(`开始批量预缓存 ${uncachedWebsites.length} 个未缓存的 favicon`);
          faviconCache.batchCacheFaviconsToIndexedDB(uncachedWebsites)
            .then(() => {
              logger.favicon.info('Favicon 批量预缓存完成');
            })
            .catch(error => {
              logger.favicon.warn('Favicon 批量预缓存失败', error);
            });
        } else {
          logger.favicon.debug('所有 favicon 均已缓存，跳过批量预缓存');
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
        logger.favicon.info('用户登录状态变化，检查图标缓存需求');
        const uncachedWebsites = websites.filter(website => {
          const cached = faviconCache.getCachedFavicon(website.url);
          return !cached;
        });

        if (uncachedWebsites.length > 0) {
          logger.favicon.info(`登录后开始预缓存 ${uncachedWebsites.length} 个图标`);
          faviconCache.batchCacheFaviconsToIndexedDB(uncachedWebsites)
            .then(() => logger.favicon.info('登录后图标预缓存完成'))
            .catch(error => logger.favicon.warn('登录后图标预缓存失败', error));
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
          transform: !isSettingsOpen && !isWorkspaceOpen && parallaxEnabled && !isMobile && mousePosition ? 
            `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) scale(1.05)` : 
            'translate(0px, 0px) scale(1)',
          transition: 'filter 1.5s ease-out, transform 0.3s ease-out',
          // 添加缓存标识的视觉提示
          opacity: bgImageLoaded ? 1 : 0.8,
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
            opacity: bgImageLoaded ? 0 : 0.3, // 减少遮罩不透明度，避免过度遮挡
            transition: 'opacity 1.5s ease-out',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* 备用背景 - 当没有壁纸时显示 */}
      {!bgImage && (
        <div 
          className="fixed top-0 left-0 w-full h-full -z-10"
          style={{
            background: '#f0f0f0',
          }}
        />
      )}
      
      {/* 壁纸加载指示器 - 响应式位置 */}
      {showLoadingIndicator && (
        <div className={`fixed ${isMobile ? 'top-2 left-2' : 'top-4 left-4'} z-40 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2`}>
          <div className="text-white/90 text-sm font-medium flex items-center space-x-2">
            <div className="animate-pulse rounded-full h-2 w-2 bg-white/70"></div>
            <span className={isMobile ? 'text-xs' : 'text-sm'}>壁纸加载中</span>
          </div>
        </div>
      )}

      {/* 壁纸更新提示 */}
      {showUpdateHint && !isMobile && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-blue-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-400/30">
          <div className="text-white/90 text-sm font-medium flex items-center space-x-2">
            <i className="fa-solid fa-sync-alt animate-spin text-blue-300"></i>
            <span>正在后台更新今日壁纸...</span>
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

        {/* 壁纸调试面板 - 暂时禁用以修复构建问题 */}
        {/* <WallpaperDebugPanel
          currentResolution={wallpaperResolution}
          currentUrl={bgImage}
          isFromCache={isFromCache}
          isToday={isToday}
          needsUpdate={needsUpdate}
        /> */}
      </div>
    </>
  );
}