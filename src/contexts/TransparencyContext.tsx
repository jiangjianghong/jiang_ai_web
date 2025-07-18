import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WallpaperResolution = '4k' | '1080p' | '720p' | 'mobile';

export type ColorOption = {
  name: string;
  rgb: string; // RGB值，如 "0, 0, 0"
  preview: string; // 预览色，如 "#000000"
};

export const colorOptions: ColorOption[] = [
  { name: '黑色', rgb: '0, 0, 0', preview: '#000000' },
  { name: '白色', rgb: '255, 255, 255', preview: '#ffffff' },
  { name: '红色', rgb: '239, 68, 68', preview: '#ef4444' },
  { name: '黄色', rgb: '245, 158, 11', preview: '#f59e0b' },
  { name: '蓝色', rgb: '59, 130, 246', preview: '#3b82f6' },
  { name: '绿色', rgb: '34, 197, 94', preview: '#22c55e' },
  { name: '紫色', rgb: '147, 51, 234', preview: '#9333ea' },
];

interface TransparencyContextType {
  cardOpacity: number;
  searchBarOpacity: number;
  parallaxEnabled: boolean;
  wallpaperResolution: WallpaperResolution;
  isSettingsOpen: boolean;
  isSearchFocused: boolean;
  cardColor: string; // RGB字符串
  searchBarColor: string; // RGB字符串
  setCardOpacity: (opacity: number) => void;
  setSearchBarOpacity: (opacity: number) => void;
  setParallaxEnabled: (enabled: boolean) => void;
  setWallpaperResolution: (resolution: WallpaperResolution) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsSearchFocused: (focused: boolean) => void;
  setCardColor: (color: string) => void;
  setSearchBarColor: (color: string) => void;
}

const TransparencyContext = createContext<TransparencyContextType | undefined>(undefined);

export function TransparencyProvider({ children }: { children: ReactNode }) {
  const [cardOpacity, setCardOpacity] = useState(() => {
    const saved = localStorage.getItem('cardOpacity');
    let value = saved ? parseFloat(saved) : 0.1; // 默认值设置为 0.1
    if (value > 1) value = value / 100; // 兼容旧数据
    return Math.max(0.05, Math.min(1, value)); // 限制范围
  });
  
  const [searchBarOpacity, setSearchBarOpacity] = useState(() => {
    const saved = localStorage.getItem('searchBarOpacity');
    let value = saved ? parseFloat(saved) : 0.1; // 默认值设置为 0.1
    if (value > 1) value = value / 100; // 兼容旧数据
    return Math.max(0.05, Math.min(1, value)); // 限制范围
  });

  const [parallaxEnabled, setParallaxEnabled] = useState(() => {
    const saved = localStorage.getItem('parallaxEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // 颜色状态管理
  const [cardColor, setCardColor] = useState(() => {
    const saved = localStorage.getItem('cardColor');
    return saved || '255, 255, 255'; // 默认白色
  });

  const [searchBarColor, setSearchBarColor] = useState(() => {
    const saved = localStorage.getItem('searchBarColor');
    return saved || '255, 255, 255'; // 默认白色
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('cardColor', cardColor);
  }, [cardColor]);

  useEffect(() => {
    localStorage.setItem('searchBarColor', searchBarColor);
  }, [searchBarColor]);

  return (
    <TransparencyContext.Provider
      value={{
        cardOpacity,
        searchBarOpacity,
        parallaxEnabled,
        wallpaperResolution,
        isSettingsOpen,
        isSearchFocused,
        cardColor,
        searchBarColor,
        setCardOpacity,
        setSearchBarOpacity,
        setParallaxEnabled,
        setWallpaperResolution,
        setIsSettingsOpen,
        setIsSearchFocused,
        setCardColor,
        setSearchBarColor,
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
