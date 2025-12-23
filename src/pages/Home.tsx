import { useState, useEffect, useCallback, useMemo } from 'react';
import { WebsiteCard } from '@/components/WebsiteCard';
import { SearchBar } from '@/components/SearchBar';
import { TimeDisplay } from '@/components/TimeDisplay';
import { PoemDisplay } from '@/components/PoemDisplay';
import { AnimatedCat } from '@/components/AnimatedCat';
import CardEditModal from '@/components/CardEditModal';
// 拖拽逻辑已迁移到 WebsiteCard
import { motion } from 'framer-motion';
import { useTransparency } from '@/contexts/TransparencyContext';
import { useAutoSync } from '@/hooks/useAutoSync';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { LazySettings, LazyWorkspaceModal, preloadWorkspaceModal, preloadSettings } from '@/utils/lazyComponents';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { faviconCache } from '@/lib/faviconCache';
import { optimizedWallpaperService } from '@/lib/optimizedWallpaperService';
import { useRAFThrottledMouseMove } from '@/hooks/useRAFThrottle';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { logger } from '@/utils/logger';
import { customWallpaperManager } from '@/lib/customWallpaperManager';
import SnowEffect from '@/components/effects/SnowEffect';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import AnnouncementCenter from '@/components/AnnouncementCenter';
import { isWinterSeason } from '@/utils/solarTerms';
import { shouldApplyOverlay } from '@/utils/imageColorAnalyzer';

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
    isSearchFocused,
    atmosphereEnabled,
    darkOverlayMode,
  } = useTransparency();
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useWorkspace();
  const { isMobile, getGridClasses, getSearchBarLayout } = useResponsiveLayout();

  // 启用自动同步（传递数据初始化状态）
  const { triggerSync } = useAutoSync(websites, dataInitialized);

  // 拖拽排序逻辑
  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    const newWebsites = [...websites];
    const [removed] = newWebsites.splice(dragIndex, 1);
    newWebsites.splice(hoverIndex, 0, removed);
    setWebsites(newWebsites);
  }, [websites, setWebsites]);

  const [bgImage, setBgImage] = useState('');
  const [bgOriginalUrl, setBgOriginalUrl] = useState<string | undefined>(); // 原始URL用于收藏检测
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAlreadyFavorited, setIsAlreadyFavorited] = useState(false);
  const [smartOverlayNeeded, setSmartOverlayNeeded] = useState(false); // 智能模式下是否需要遮罩

  // 阻止空白区域右键菜单
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // 检查是否点击在卡片上（卡片内部会处理自己的右键菜单）
      const target = e.target as HTMLElement;
      const isOnCard = target.closest('[data-website-card]');

      // 如果不是在卡片上，阻止默认右键菜单
      if (!isOnCard) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // 检查当前壁纸是否已收藏
  useEffect(() => {
    const checkIfFavorited = async () => {
      if (!bgOriginalUrl || wallpaperResolution === 'custom') {
        setIsAlreadyFavorited(false);
        return;
      }

      const favorited = await customWallpaperManager.isUrlAlreadyFavorited(bgOriginalUrl);
      setIsAlreadyFavorited(favorited);

      console.log('🔍 [收藏状态检查]', {
        bgOriginalUrl: bgOriginalUrl ? '有原始URL' : '无原始URL',
        isAlreadyFavorited: favorited,
      });
    };

    checkIfFavorited();
  }, [bgOriginalUrl, wallpaperResolution]);

  // 调试：监控状态变化
  useEffect(() => {
    console.log('🔍 [收藏按钮调试]', {
      wallpaperResolution,
      bgImage: bgImage ? '有图片' : '无图片',
      bgOriginalUrl: bgOriginalUrl ? bgOriginalUrl : '无原始URL',
      isSearchFocused,
      shouldShow: wallpaperResolution !== 'custom' && bgImage,
      isAlreadyFavorited,
    });
  }, [wallpaperResolution, bgImage, bgOriginalUrl, isSearchFocused, isAlreadyFavorited]);

  // 收藏当前壁纸
  const handleFavoriteWallpaper = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 如果已经收藏，不允许重复收藏
    if (isFavoriting || !bgOriginalUrl || wallpaperResolution === 'custom' || isAlreadyFavorited) {
      return;
    }

    setIsFavoriting(true);

    try {
      // 使用原始 Unsplash URL 下载并保存壁纸
      const result = await customWallpaperManager.downloadAndSaveFromUrl(
        bgOriginalUrl, // 使用原始URL而不是Blob URL
        `unsplash-${wallpaperResolution}-${Date.now()}.jpg`
      );

      if (result.success) {
        setIsFavorited(true);
        setIsAlreadyFavorited(true); // 标记为已收藏
        logger.debug('✅ 壁纸收藏成功', { id: result.id });

        // 3秒后隐藏"收藏成功"提示（但保持已收藏状态）
        setTimeout(() => {
          setIsFavorited(false);
        }, 3000);
      } else {
        logger.warn('❌ 壁纸收藏失败', result.error);
        // 如果是重复收藏的错误，更新状态
        if (result.error?.includes('已经在你的收藏中')) {
          setIsAlreadyFavorited(true);
        }
        alert(`收藏失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      logger.error('收藏壁纸时出错', error);
      alert('收藏失败，请重试');
    } finally {
      setIsFavoriting(false);
    }
  };

  // 壁纸加载 - 统一处理挂载和分辨率变化
  // 注意：所有日期检测逻辑都在 optimizedWallpaperService 中统一处理
  useEffect(() => {
    const loadWallpaper = async () => {
      try {
        logger.debug('🖼️ 开始加载壁纸，分辨率:', wallpaperResolution);
        setBgImageLoaded(false);

        // 调用壁纸服务获取壁纸（日期检测和缓存逻辑在服务中统一处理）
        const result = await optimizedWallpaperService.getWallpaper(wallpaperResolution);

        if (result.url) {
          logger.debug(result.isFromCache ? '📦 使用缓存壁纸' : '🌐 加载新壁纸', {
            isToday: result.isToday,
            needsUpdate: result.needsUpdate,
          });
          setBgImage(result.url);
          setBgOriginalUrl(result.originalUrl); // 保存原始 URL 用于收藏检测
          setBgImageLoaded(true);

          // 智能遮罩模式：分析壁纸颜色
          if (darkOverlayMode === 'smart') {
            try {
              const needsOverlay = await shouldApplyOverlay(result.url);
              setSmartOverlayNeeded(needsOverlay);
              logger.debug('🎨 智能遮罩检测结果:', needsOverlay ? '需要遮罩' : '不需要遮罩');
            } catch (error) {
              logger.warn('壁纸颜色分析失败:', error);
              setSmartOverlayNeeded(false);
            }
          }

          // 如果缓存的不是今天的壁纸，记录警告
          if (!result.isToday && result.isFromCache) {
            logger.warn('⚠️ 使用的是过期壁纸缓存，后台正在更新');
          }
        } else {
          logger.warn('❌ 无法获取壁纸');
          setBgImage('');
          setBgOriginalUrl(undefined);
          setBgImageLoaded(true);
        }
      } catch (error) {
        logger.warn('获取壁纸失败:', error);
        setBgImage('');
        setBgOriginalUrl(undefined);
        setBgImageLoaded(true);
      }
    };

    loadWallpaper();
  }, [wallpaperResolution]); // 分辨率变化时重新加载

  // 根据设置决定是否自动排序卡片
  const displayWebsites = useMemo(() => {
    return autoSortEnabled
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
  }, [websites, autoSortEnabled]);

  const handleSaveCard = useCallback((updatedCard: {
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
  }, [websites, setWebsites]);

  const handleDelete = useCallback((id: string) => {
    setWebsites(websites.filter((card) => card.id !== id));
  }, [websites, setWebsites]);

  // 壁纸加载已在上方统一处理

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

  // 页面空闲时预加载设置和工作空间组件
  useEffect(() => {
    const preloadComponents = () => {
      // 使用 requestIdleCallback 在浏览器空闲时预加载
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          preloadSettings();
          preloadWorkspaceModal();
        }, { timeout: 3000 }); // 最多等待3秒
      } else {
        // 降级方案：延迟2秒后预加载
        setTimeout(() => {
          preloadSettings();
          preloadWorkspaceModal();
        }, 2000);
      }
    };

    preloadComponents();
  }, []);

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
      container: `relative min-h-screen ${isMobile ? 'pt-[18vh]' : 'pt-[33vh]'}`,
      searchContainer: searchBarLayout.containerClass,
      cardContainer: `${isMobile ? 'pt-4 pb-4' : 'pt-16 pb-8'} px-4 max-w-6xl mx-auto`,
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

      {/* 系统公告横幅 */}
      <AnnouncementBanner />

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

      {/* 黑色遮罩层 - 暗角滤镜效果 */}
      {bgImage && (darkOverlayMode === 'always' || (darkOverlayMode === 'smart' && smartOverlayNeeded)) && (
        <div
          className="fixed top-0 left-0 w-full h-full"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at center, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.15) 40%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.7) 100%)',
            zIndex: -9,
            pointerEvents: 'none',
            transition: 'opacity 0.5s ease-out',
          }}
        />
      )}

      {/* 雪花氛围效果 - 仅在开关开启且处于冬季时显示 */}
      {atmosphereEnabled && isWinterSeason() && <SnowEffect />}

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
                  onDelete={handleDelete}
                  onCardSave={triggerSync}
                  onAddCard={() => setShowAddCardModal(true)}
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
            onSettingsClose={triggerSync}
          />
        )}

        {/* 工作空间触发按钮 - 响应式调整 */}
        <motion.div
          className={classes.workspaceButton}
          animate={{
            opacity: isSearchFocused ? 0 : 1,
            scale: isSearchFocused ? 0.8 : 1
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onMouseEnter={preloadWorkspaceModal} // 鼠标悬停时预加载工作空间组件
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

        {/* 收藏壁纸按钮 - 右上角，仅在搜索框聚焦且不是自定义壁纸时显示 */}
        {wallpaperResolution !== 'custom' && bgImage && (
          <motion.div
            className={isMobile ? 'fixed top-2 right-2 z-40 scale-90' : 'fixed top-4 right-4 z-40'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isSearchFocused ? 1 : 0,
              scale: isSearchFocused ? 1 : 0.8
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="relative group">
              <button
                onClick={handleFavoriteWallpaper}
                disabled={isFavoriting || isAlreadyFavorited}
                className="flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 disabled:cursor-default"
              >
                {isFavoriting ? (
                  <i className="fa-solid fa-spinner fa-spin text-white/80 text-lg drop-shadow-lg"></i>
                ) : (
                  <i
                    className={`fa-${isAlreadyFavorited || isFavorited ? 'solid' : 'regular'} fa-heart transition-all duration-300 drop-shadow-lg ${isAlreadyFavorited || isFavorited
                      ? 'text-red-500 text-xl'
                      : 'text-white/70 hover:text-white text-lg'
                      }`}
                  ></i>
                )}
              </button>

              {/* hover提示文字 - 未收藏时 */}
              {!isFavoriting && !isFavorited && !isAlreadyFavorited && (
                <div className="absolute right-0 top-full mt-2 px-4 py-2 bg-gray-900/90 text-white text-sm rounded-lg shadow-lg backdrop-blur-sm border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                  喜欢此壁纸？点击拿下
                  <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900/90"></div>
                </div>
              )}

              {/* hover提示文字 - 已收藏时 */}
              {!isFavoriting && isAlreadyFavorited && !isFavorited && (
                <div className="absolute right-0 top-full mt-2 px-4 py-2 bg-red-500/90 text-white text-sm rounded-lg shadow-lg backdrop-blur-sm border border-red-400/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                  ❤️ 已收藏
                  <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-red-500/90"></div>
                </div>
              )}

              {/* 收藏成功提示 */}
              {isFavorited && (
                <div className="absolute right-0 top-full mt-2 px-4 py-2 bg-green-500/90 text-white text-sm rounded-lg shadow-lg backdrop-blur-sm border border-green-400/30 whitespace-nowrap z-50">
                  ✅ 已添加到壁纸库
                  <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-green-500/90"></div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 设置触发按钮 - 右下角 */}
        <motion.div
          className={classes.settingsButton}
          animate={{
            opacity: isSearchFocused ? 0 : 1,
            scale: isSearchFocused ? 0.8 : 1
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onMouseEnter={preloadSettings} // 鼠标悬停时预加载设置组件
        >
          <button
            onClick={() => setShowSettings(true)}
            className={`${isMobile ? 'p-2' : 'p-2'} text-white/70 hover:text-white transition-colors`}
            aria-label="设置"
          >
            <i className={`fa-solid fa-sliders ${isMobile ? 'text-base' : 'text-lg'}`}></i>
          </button>
        </motion.div>

        {/* 公告中心入口 - 左下角 */}
        <AnnouncementCenter isVisible={!isSearchFocused} />

        {/* 诗句显示 - 页面下方 */}
        <PoemDisplay />

        {/* 动画猫 - 仅在非移动端显示 */}
        {!isMobile && <AnimatedCat />}

        {/* 工作空间模态框 */}
        <LazyWorkspaceModal isOpen={isWorkspaceOpen} onClose={() => setIsWorkspaceOpen(false)} />

        {/* 新增卡片模态框 */}
        {showAddCardModal && (
          <CardEditModal
            id=""
            name=""
            url=""
            favicon=""
            tags={[]}
            note=""
            onClose={() => setShowAddCardModal(false)}
            onSave={(data) => {
              // 创建新卡片
              const newCard = {
                ...data,
                id: `card-${Date.now()}`,
                visitCount: 0,
                lastVisit: new Date().toISOString().split('T')[0],
              };
              setWebsites([...websites, newCard]);
              setShowAddCardModal(false);
              triggerSync();
            }}
          />
        )}
      </div>
    </>
  );
}
