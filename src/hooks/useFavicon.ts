import { useState, useEffect } from 'react';
import { faviconCache } from '@/lib/faviconCache';

/**
 * 使用 favicon 缓存的 Hook（极简版 - 防止切换）
 * @param originalUrl 网站原始 URL
 * @param faviconUrl favicon URL
 * @returns { faviconUrl: string, isLoading: boolean, error: boolean }
 */
export function useFavicon(originalUrl: string, faviconUrl: string) {
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string>(faviconUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 始终优先使用传入的 faviconUrl
    setCurrentFaviconUrl(faviconUrl);
    setError(false);
    setIsLoading(false);
    
    // 只有在以下情况才尝试缓存优化：
    // 1. faviconUrl 是默认图标
    // 2. 或者是 Google favicon 服务但没有时间戳参数（说明是旧的自动生成的）
    const isDefaultIcon = faviconUrl === '/icon/icon.jpg';
    const isOldGoogleIcon = faviconUrl.includes('google.com/s2/favicons') && !faviconUrl.includes('&t=');
    
    if (isDefaultIcon || isOldGoogleIcon) {
      const cached = faviconCache.getCachedFavicon(originalUrl);
      if (cached && cached !== faviconUrl && cached !== '/icon/icon.jpg') {
        console.log('📦 使用缓存的更好图标:', cached);
        setCurrentFaviconUrl(cached);
        return;
      }
      
      // 如果没有缓存，异步尝试获取更好的图标
      if (isDefaultIcon) { // 只为默认图标异步获取
        setIsLoading(true);
        faviconCache.getFavicon(originalUrl, faviconUrl)
          .then((url: string) => {
            if (url !== faviconUrl && url !== '/icon/icon.jpg') {
              console.log('✅ 获取到更好的图标:', url);
              setCurrentFaviconUrl(url);
            }
            setError(false);
          })
          .catch((err: any) => {
            console.warn('Favicon 优化失败:', err);
            setError(true);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [originalUrl, faviconUrl]);

  return {
    faviconUrl: currentFaviconUrl,
    isLoading,
    error
  };
}
