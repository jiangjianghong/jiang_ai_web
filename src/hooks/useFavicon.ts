import { useState, useEffect } from 'react';
import { faviconCache } from '@/lib/faviconCache';

/**
 * 使用 favicon 缓存的 Hook
 * @param originalUrl 网站原始 URL
 * @param faviconUrl favicon URL
 * @returns { faviconUrl: string, isLoading: boolean, error: boolean }
 */
export function useFavicon(originalUrl: string, faviconUrl: string) {
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string>(() => {
    // 首先尝试从缓存获取
    return faviconCache.getCachedFavicon(originalUrl) || faviconUrl;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 检查是否已经有缓存
    const cached = faviconCache.getCachedFavicon(originalUrl);
    if (cached) {
      setCurrentFaviconUrl(cached);
      return;
    }

    // 没有缓存，异步加载
    setIsLoading(true);
    setError(false);

    faviconCache.getFavicon(originalUrl, faviconUrl)
      .then(url => {
        setCurrentFaviconUrl(url);
        setError(false);
      })
      .catch(err => {
        console.warn('Favicon 加载失败:', err);
        setError(true);
        // 仍然使用原始 URL 作为兜底
        setCurrentFaviconUrl(faviconUrl);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [originalUrl, faviconUrl]);

  return {
    faviconUrl: currentFaviconUrl,
    isLoading,
    error
  };
}
