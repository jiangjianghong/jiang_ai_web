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
import { useResourcePreloader } from '@/hooks/useResourcePreloader';

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
  
  // 启用资源预加载
  useResourcePreloader();

  // 壁纸相关工具函数
  // 获取今天的日期字符串（格式：YYYY-MM-DD）
  const getTodayKey = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  // 根据分辨率获取对应的壁纸URL
  const getWallpaperUrl = (resolution: string) => {
    const wallpapers: Record<string, string> = {
      '4k': 'https://bing.img.run/uhd.php',
      '1080p': 'https://bing.img.run/1920x1080.php',
      '720p': 'https://bing.img.run/1366x768.php',
      'mobile': 'https://bing.img.run/m.php'
    };
    return wallpapers[resolution] || wallpapers['4k'];
  };
  // 从 localStorage 获取缓存壁纸数据（包含日期、URL、分辨率）
  const getCachedWallpaper = (): { date: string; url: string; resolution: string } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem('bing-wallpaper-cache');
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // 忽略错误
    }
    return null;
  };
  // 默认壁纸URL
  const defaultWallpaperUrl = getWallpaperUrl(wallpaperResolution);

  const { drag, drop, isDragging } = useDragAndDrop(websites, setWebsites);
  const [bgImage, setBgImage] = useState(defaultWallpaperUrl);
  const [showSettings, setShowSettings] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGreeting, setShowGreeting] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 按日期和分辨率加载和缓存壁纸
  useEffect(() => {
    const todayKey = getTodayKey();
    const cacheObj = getCachedWallpaper();
    if (cacheObj && cacheObj.date === todayKey && cacheObj.resolution === wallpaperResolution) {
      setBgImage(cacheObj.url);
    } else {
      const img = new Image();
      img.src = defaultWallpaperUrl;
      img.onload = () => {
        setBgImage(img.src);
        try {
          localStorage.setItem('bing-wallpaper-cache', JSON.stringify({ date: todayKey, url: img.src, resolution: wallpaperResolution }));
        } catch {}
      };
      img.onerror = () => {
        const fbUrl = 'https://source.unsplash.com/random/1920x1080/?nature';
        setBgImage(fbUrl);
        try {
          localStorage.setItem('bing-wallpaper-cache', JSON.stringify({ date: todayKey, url: fbUrl, resolution: wallpaperResolution }));
        } catch {}
      };
    }
  }, [wallpaperResolution, defaultWallpaperUrl]);

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


    return (
    <>
      {/* 邮箱验证横幅 */}
      <EmailVerificationBanner />
      
      <div 
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url(${bgImage})`, // 显示90%的背景
          backgroundSize: '105% 105%', // 稍微放大，为视差移动留出空间
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
          transform: calculateParallaxTransform(),
          transition: 'transform 0.1s ease-out' // 使用transform的过渡，更流畅
        }}
      >
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
    </div>
    </>
  );
}