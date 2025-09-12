import { useState, useEffect, useCallback } from 'react';
import { WebsiteCard } from '@/components/WebsiteCard';
import { SearchBar } from '@/components/SearchBar';
import { TimeDisplay } from '@/components/TimeDisplay';
import { PoemDisplay } from '@/components/PoemDisplay';
import { AnimatedCat } from '@/components/AnimatedCat';
// 拖拽逻辑已迁移到 WebsiteCard
import { motion } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useAutoSync } from '@/hooks/useAutoSync';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { LazySettings, LazyWorkspaceModal } from '@/utils/lazyComponents';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { faviconCache } from '@/lib/faviconCache';
import { optimizedWallpaperService } from '@/lib/optimizedWallpaperService';
import { useRAFThrottledMouseMove } from '@/hooks/useRAFThrottle';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { logger } from '@/utils/logger';

interface HomeProps {
  websites: any[];
  setWebsites: (websites: any[]) => void;
  dataInitialized?: boolean;
}

export default function Home({ websites, setWebsites, dataInitialized = true }: HomeProps) {
  const {
    parallaxEnabled,
    wallpaperResolution,
    isSettingsOpen,
    autoSortEnabled,
    customWallpaperUrl,
    isSearchFocused,
  } = useTransparency();
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useWorkspace();
  const { isMobile, getGridClasses, getSearchBarLayout } = useResponsiveLayout();

  // 启用自动同步（传递数据初始化状态）
  useAutoSync(websites, dataInitialized);

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

  // 组件挂载时立即检查缓存，提供即时加载体验
  useEffect(() => {
    const checkCacheAndLoadWallpaper = async () => {
      try {
        logger.debug('🔍 检查壁纸缓存');

        // 如果有自定义壁纸，直接使用
        if (customWallpaperUrl && customWallpaperUrl.trim()) {
          setBgImage(customWallpaperUrl);
          setBgImageLoaded(true);
          logger.debug('⚡ 即时加载自定义壁纸');
          return;
        }

        // 检查是否需要新的壁纸（跨天检查）
        const today = new Date().toISOString().split('T')[0];
        const lastWallpaperDateKey = `last-wallpaper-date-${wallpaperResolution}`;
        const lastWallpaperDate = localStorage.getItem(lastWallpaperDateKey);
        
        // 如果是新的一天，在最后尝试触发重新加载
        const shouldRefreshForNewDay = lastWallpaperDate !== today;
        if (shouldRefreshForNewDay) {
          localStorage.setItem(lastWallpaperDateKey, today);
          logger.debug('🌅 检测到新的一天，将在后续触发壁纸更新');
        }

        const result = await optimizedWallpaperService.getWallpaper(wallpaperResolution);

        if (result.url && result.isFromCache) {
          setBgImage(result.url);
          setBgImageLoaded(true);
          logger.debug('⚡ 即时加载缓存壁纸', { isToday: result.isToday });

          // 如果缓存的不是今天的壁纸或检测到新的一天，记录警告并后续将触发更新
          if (!result.isToday || shouldRefreshForNewDay) {
            logger.warn('⚠️ 使用的是过期壁纸缓存或新的一天，将在后续更新');
          }
        } else if (result.url) {
          // 新下载的壁纸
          setBgImage(result.url);
          setBgImageLoaded(true);
          logger.debug('🌐 加载新下载壁纸');
        }
      } catch (error) {
        logger.warn('检查缓存失败:', error);
      }
    };

    checkCacheAndLoadWallpaper();
  }, []); // 只在组件挂载时执行一次

  // 根据设置决定是否自动排序卡片
  const displayWebsites = autoSortEnabled
    ? [...websites].sort((a, b) => {
        // 首先按访问次数降序排序
        const visitDiff = (b.visitCount || 0) - (a.visitCount || 0);
        if (visitDiff !== 0) return visitDiff;

        // 如果访问次数相同，按最后访问时间降序排序
        const dateA = new Date(a.lastVisit || '2000-01-01').getTime();
        const dateB = new Date(b.lastVisit || '2000-01-01').getTime();
        return dateB - dateA;
      })
    : websites;

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
      websites.map((card) => (card.id === updatedCard.id ? { ...card, ...updatedCard } : card))
    );
  };

  useEffect(() => {
    // 主要逻辑：使用优化的壁纸服务
    (async () => {
      try {
        logger.debug('🖼️ 开始加载壁纸，分辨率:', wallpaperResolution);
        setBgImageLoaded(false);

        // 如果有自定义壁纸URL，优先使用
        if (customWallpaperUrl && customWallpaperUrl.trim()) {
          logger.debug('🎨 使用自定义壁纸:', customWallpaperUrl);
          setBgImage(customWallpaperUrl);
          setBgImageLoaded(true);
          return;
        }

        const result = await optimizedWallpaperService.getWallpaper(wallpaperResolution);

        if (result.url) {
          logger.debug(result.isFromCache ? '📦 使用缓存壁纸' : '🌐 加载新壁纸');
          setBgImage(result.url);
          setBgImageLoaded(true);
        } else {
          logger.warn('❌ 无法获取壁纸');
          setBgImage('');
          setBgImageLoaded(true);
        }
      } catch (error) {
        logger.warn('获取壁纸失败:', error);
        setBgImage('');
        setBgImageLoaded(true);
      }
    })();
  }, [wallpaperResolution, customWallpaperUrl]);

  // 预加载当前页面的图标
  useEffect(() => {
    if (websites.length > 0) {
      // 延迟预加载，避免阻塞首屏渲染
      const timer = setTimeout(() => {
        faviconCache.preloadFavicons(websites).catch((err) => {
          console.warn('批量预加载图标失败:', err);
        });
      }, 500); // 延迟500ms，确保首屏渲染完成

      return () => clearTimeout(timer);
    }
  }, [websites]);

  // 优化的鼠标移动处理器 - 使用 RAF 节流
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  const throttledMouseMove = useRAFThrottledMouseMove(
    handleMouseMove,
    parallaxEnabled && !isSettingsOpen && !isSearchFocused
  );

  // 监听鼠标移动 - 使用 RAF 节流优化性能
  useEffect(() => {
    // 如果视差被禁用或设置页面打开或搜索框聚焦，不添加鼠标监听器
    if (!parallaxEnabled || isSettingsOpen || isSearchFocused) {
      setMousePosition({ x: 0, y: 0 });
      return;
    }

    window.addEventListener('mousemove', throttledMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [parallaxEnabled, isSettingsOpen, isSearchFocused, throttledMouseMove]);

  // 预加载 favicon（已移除，使用下面的 IndexedDB 批量缓存代替）

  // 批量预缓存 favicon（简化版）
  useEffect(() => {
    if (websites.length > 0) {
      // 延迟执行，避免阻塞首屏渲染
      const timer = setTimeout(() => {
        logger.debug('🚀 开始简单批量预缓存 favicon...');
        faviconCache
          .batchCacheFaviconsToIndexedDB(websites)
          .then(() => {
            logger.debug('✅ Favicon 简单批量预缓存完成');
          })
          .catch((error) => {
            logger.warn('❌ Favicon 简单批量预缓存失败:', error);
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
      userInfo: isMobile ? 'fixed top-2 right-2 z-40 scale-90' : 'fixed top-4 right-4 z-40',
      workspaceButton: isMobile ? 'fixed top-2 left-2 z-40 scale-90' : 'fixed top-4 left-4 z-40',
      settingsButton: isMobile
        ? 'fixed bottom-2 right-2 z-[9999] p-2 bg-white/10 rounded-full backdrop-blur-sm'
        : 'fixed bottom-4 right-4 z-[9999]',
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
          transform:
            !isSettingsOpen && !isSearchFocused && parallaxEnabled && !isMobile && mousePosition
              ? `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) scale(1.05)`
              : 'translate(0px, 0px) scale(1)',
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
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 壁纸加载指示器 - 响应式位置 */}
      {!bgImageLoaded && bgImage && (
        <div
          className={`fixed ${isMobile ? 'top-2 left-2' : 'top-4 left-4'} z-40 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2`}
        >
          <div className="text-white/90 text-sm font-medium flex items-center space-x-2">
            <div className="animate-pulse rounded-full h-2 w-2 bg-white/70"></div>
            <span className={isMobile ? 'text-xs' : 'text-sm'}>壁纸加载中</span>
          </div>
        </div>
      )}

      <div className={classes.container}>
        {/* SEO 导航 - 视觉上隐藏但对搜索引擎可见 */}
        <nav className="sr-only">
          <ul>
            <li>
              <a href="#main-content">主要内容</a>
            </li>
            <li>
              <a href="#search">搜索功能</a>
            </li>
            <li>
              <a href="#bookmarks">书签收藏</a>
            </li>
          </ul>
        </nav>

        <div className={`${classes.searchContainer} relative`} id="main-content">
          {/* SEO H1 标签 - 视觉上隐藏但对搜索引擎可见 */}
          <h1 className="sr-only">
            你好呀，这里是一个AI友好的个性化便签页面，创作者：江江 和 claude coze kiro coplit
            页面美观好用，有诸多彩蛋（**新标签页**，**new tab**,**AI tab**,**notion
            tab**,**个性化**，**标签页**）
          </h1>
          {/* SEO 描述段落 - 视觉上隐藏但对搜索引擎可见 */}
          <p className="sr-only">
            这是一个由江江创作的个性化便签页面，结合了 Claude、Coze、Kiro、Copilot 等AI工具的协助。
            页面设计美观实用，包含多个有趣的彩蛋功能，为用户提供优质的书签管理体验。
          </p>
          {/* 时间组件始终渲染，通过透明度控制显示，避免影响布局 */}
          <TimeDisplay />
          <SearchBar websites={websites} onOpenSettings={() => setShowSettings(true)} />
        </div>

        <div className={classes.cardContainer}>
          <motion.div
            className={classes.gridLayout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {displayWebsites.map((website, idx) => {
              // 当启用自动排序时，需要找到原始数组中的索引
              const originalIndex = autoSortEnabled
                ? websites.findIndex((w) => w.id === website.id)
                : idx;

              return (
                <WebsiteCard
                  key={website.id}
                  {...website}
                  index={originalIndex}
                  moveCard={moveCard}
                  onSave={handleSaveCard}
                  onDelete={(id) => {
                    setWebsites(websites.filter((card) => card.id !== id));
                  }}
                />
              );
            })}
          </motion.div>
        </div>

        {showSettings && (
          <LazySettings
            onClose={() => setShowSettings(false)}
            websites={websites}
            setWebsites={setWebsites}
          />
        )}

        {/* 工作空间触发按钮 - 响应式调整 */}
        <motion.div
          className={classes.workspaceButton}
          animate={{ 
            opacity: isSearchFocused ? 0 : 1,
            scale: isSearchFocused ? 0.8 : 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="relative group">
            <button
              onClick={() => setIsWorkspaceOpen(true)}
              className="flex items-center justify-center transition-all duration-200 cursor-pointer p-2"
            >
              <i
                className={`fa-solid fa-briefcase text-white/70 group-hover:text-white group-hover:drop-shadow-lg transition-all duration-200 ${isMobile ? 'text-sm' : 'text-lg'}`}
              ></i>
            </button>

            {/* 自定义悬停提示 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-gray-900/90 text-white text-xs rounded-lg shadow-lg backdrop-blur-sm border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
              工作空间
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900/90"></div>
            </div>
          </div>
        </motion.div>

        {/* 设置触发按钮 - 右下角 */}
        <motion.div
          className={classes.settingsButton}
          animate={{ 
            opacity: isSearchFocused ? 0 : 1,
            scale: isSearchFocused ? 0.8 : 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <button
            onClick={() => setShowSettings(true)}
            className={`${isMobile ? 'p-2' : 'p-2'} text-white/70 hover:text-white transition-colors`}
            aria-label="设置"
          >
            <i className={`fa-solid fa-sliders ${isMobile ? 'text-base' : 'text-lg'}`}></i>
          </button>
        </motion.div>

        {/* 诗句显示 - 页面下方 */}
        <PoemDisplay />

        {/* 动画猫 - 仅在非移动端显示 */}
        {!isMobile && <AnimatedCat />}

        {/* 工作空间模态框 */}
        <LazyWorkspaceModal isOpen={isWorkspaceOpen} onClose={() => setIsWorkspaceOpen(false)} />
      </div>
    </>
  );
}
