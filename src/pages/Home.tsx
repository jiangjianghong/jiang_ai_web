import { useState, useEffect } from 'react';
import { WebsiteCard } from '@/components/WebsiteCard';
import { SearchBar } from '@/components/SearchBar';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useTransparency } from '@/contexts/TransparencyContext';
import Settings from '@/pages/Settings';

interface HomeProps {
  websites: any[];
  setWebsites: (websites: any[]) => void;
}

export default function Home({ websites, setWebsites }: HomeProps) {
  const { theme } = useTheme();
  const { parallaxEnabled } = useTransparency();
  const { drag, drop, isDragging } = useDragAndDrop(websites, setWebsites);
  const [bgImage, setBgImage] = useState('https://bing.img.run/uhd.php');
  const [bgLoaded, setBgLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleSaveCard = (updatedCard: {
    id: string;
    name: string;
    url: string;
    favicon: string;
    tags: string[];
    note?: string;
  }) => {
    setWebsites(
      websites.map(card =>
        card.id === updatedCard.id ? { ...card, ...updatedCard } : card
      )
    );
  };

  // 计算视差变换 - 基于博客思路优化
  const calculateParallaxTransform = () => {
    // 如果视差被禁用，返回默认值
    if (!parallaxEnabled || !mousePosition.x || !mousePosition.y) {
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
    const translateX = xValue * 0.3;
    const translateY = -yValue * 0.3;
    
    return `translate(${translateX}px, ${translateY}px)`;
  };

  useEffect(() => {
    const wallpapers = [
      'https://bing.img.run/uhd.php',
      'https://bing.img.run/1920x1080.php',
      'https://bing.img.run/1366x768.php',
      'https://bing.img.run/m.php'
    ];

    const tryLoadWallpaper = (index = 0) => {
      if (index >= wallpapers.length) {
        setBgImage('https://source.unsplash.com/random/1920x1080/?nature');
        return;
      }

      const img = new Image();
      img.src = wallpapers[index];
      img.onload = () => {
        setBgLoaded(true);
        setBgImage(img.src);
      };
      img.onerror = () => {
        tryLoadWallpaper(index + 1);
      };
    };

    tryLoadWallpaper();
  }, []);

  // 监听鼠标移动 - 根据视差开关决定是否启用
  useEffect(() => {
    // 如果视差被禁用，不添加鼠标监听器
    if (!parallaxEnabled) {
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
  }, [parallaxEnabled]);

    return (
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
          {websites.map((website) => (
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

      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-white/70 hover:text-white transition-colors"
          aria-label="设置"
        >
          <i className="fa-solid fa-sliders text-lg"></i>
        </button>
      </div>
      </div>
    </div>
  );
}