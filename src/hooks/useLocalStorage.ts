import { useState, useEffect } from 'react';
import { StorageManager } from '@/lib/storageManager';

/**
 * 统一的本地存储Hook，支持类型安全和错误处理
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  isEssential: boolean = false
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const storage = StorageManager.getInstance();
  const [error, setError] = useState(false);

  // 安全的初始化状态
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage.getItem(key, isEssential);
      if (item === null || item === undefined) {
        return defaultValue;
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(item);
      } catch {
        // 如果解析失败，假设是字符串值
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`读取localStorage键 "${key}" 失败:`, error);
      setError(true);
      return defaultValue;
    }
  });

  // 设置值的函数
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      setError(false);
      
      // 允许传入函数来更新值
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // 保存到localStorage
      const stringValue = typeof valueToStore === 'string' 
        ? valueToStore 
        : JSON.stringify(valueToStore);
        
      const success = storage.setItem(key, stringValue, isEssential);
      if (!success && !isEssential) {
        console.warn(`保存到localStorage失败: ${key} (用户未同意Cookie)`);
      }
    } catch (error) {
      console.error(`设置localStorage键 "${key}" 失败:`, error);
      setError(true);
    }
  };

  // 监听存储变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch {
          setStoredValue(e.newValue as unknown as T);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, error];
}

/**
 * 网站数据的专用Hook
 */
export function useWebsitesStorage() {
  return useLocalStorage<import('@/lib/supabaseSync').WebsiteData[]>('websites', []);
}

/**
 * 透明度设置的专用Hook
 */
export function useTransparencyStorage() {
  const [cardOpacity, setCardOpacity] = useLocalStorage('cardOpacity', 0.1);
  const [searchBarOpacity, setSearchBarOpacity] = useLocalStorage('searchBarOpacity', 0.1);
  const [parallaxEnabled, setParallaxEnabled] = useLocalStorage('parallaxEnabled', true);
  const [wallpaperResolution, setWallpaperResolution] = useLocalStorage<import('@/contexts/TransparencyContext').WallpaperResolution>('wallpaperResolution', '1080p');

  return {
    cardOpacity: Number(cardOpacity),
    searchBarOpacity: Number(searchBarOpacity),
    parallaxEnabled: Boolean(parallaxEnabled),
    wallpaperResolution,
    setCardOpacity: (value: number) => setCardOpacity(value),
    setSearchBarOpacity: (value: number) => setSearchBarOpacity(value),
    setParallaxEnabled: (value: boolean) => setParallaxEnabled(value),
    setWallpaperResolution
  };
}
