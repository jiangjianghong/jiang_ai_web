import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WallpaperResolution = '4k' | '1080p' | '720p' | 'mobile';

interface TransparencyContextType {
  cardOpacity: number;
  searchBarOpacity: number;
  parallaxEnabled: boolean;
  wallpaperResolution: WallpaperResolution;
  isSettingsOpen: boolean;
  setCardOpacity: (opacity: number) => void;
  setSearchBarOpacity: (opacity: number) => void;
  setParallaxEnabled: (enabled: boolean) => void;
  setWallpaperResolution: (resolution: WallpaperResolution) => void;
  setIsSettingsOpen: (open: boolean) => void;
}

const TransparencyContext = createContext<TransparencyContextType | undefined>(undefined);

export function TransparencyProvider({ children }: { children: ReactNode }) {
  const [cardOpacity, setCardOpacity] = useState(() => {
    const saved = localStorage.getItem('cardOpacity');
    return saved ? parseFloat(saved) : 0.1;
  });
  
  const [searchBarOpacity, setSearchBarOpacity] = useState(() => {
    const saved = localStorage.getItem('searchBarOpacity');
    return saved ? parseFloat(saved) : 0.1;
  });

  const [parallaxEnabled, setParallaxEnabled] = useState(() => {
    const saved = localStorage.getItem('parallaxEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // 获取默认壁纸分辨率（根据设备屏幕判断）
  const getDefaultResolution = (): WallpaperResolution => {
    // 检查是否为竖屏设备
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait) {
      return 'mobile';
    }
    
    // 对于宽屏设备，默认使用1080p
    return '1080p';
  };

  const [wallpaperResolution, setWallpaperResolution] = useState<WallpaperResolution>(() => {
    const saved = localStorage.getItem('wallpaperResolution') as WallpaperResolution;
    return saved || getDefaultResolution();
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cardOpacity', cardOpacity.toString());
  }, [cardOpacity]);

  useEffect(() => {
    localStorage.setItem('searchBarOpacity', searchBarOpacity.toString());
  }, [searchBarOpacity]);

  useEffect(() => {
    localStorage.setItem('parallaxEnabled', JSON.stringify(parallaxEnabled));
  }, [parallaxEnabled]);

  useEffect(() => {
    localStorage.setItem('wallpaperResolution', wallpaperResolution);
  }, [wallpaperResolution]);

  return (
    <TransparencyContext.Provider
      value={{
        cardOpacity,
        searchBarOpacity,
        parallaxEnabled,
        wallpaperResolution,
        isSettingsOpen,
        setCardOpacity,
        setSearchBarOpacity,
        setParallaxEnabled,
        setWallpaperResolution,
        setIsSettingsOpen,
      }}
    >
      {children}
    </TransparencyContext.Provider>
  );
}

export function useTransparency() {
  const context = useContext(TransparencyContext);
  if (context === undefined) {
    throw new Error('useTransparency must be used within a TransparencyProvider');
  }
  return context;
}
