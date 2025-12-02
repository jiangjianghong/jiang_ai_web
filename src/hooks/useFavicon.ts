import { useState, useEffect, useRef } from 'react';
import { faviconCache } from '@/lib/faviconCache';
import { isDefaultIcon } from '@/lib/iconPath';
import { releaseManagedBlobUrl } from '@/lib/memoryManager';
import { processFaviconUrl } from '@/lib/faviconUtils';

/**
 * 使用 favicon 缓存的 Hook（极简版 - 防止切换）
 * @param originalUrl 网站原始 URL
 * @param faviconUrl favicon URL
 * @returns { faviconUrl: string, isLoading: boolean, error: boolean }
 */
export function useFavicon(originalUrl: string, faviconUrl: string) {
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string>(() => {
    // 初始化时先检查缓存，优先使用 Blob URL
    const cached = faviconCache.getCachedFavicon(originalUrl);
    if (cached && !isDefaultIcon(cached)) {
      console.log(`🚀 初始化使用缓存图标: ${originalUrl} -> ${cached.substring(0, 50)}...`);
      return cached;
    }
    return processFaviconUrl(faviconUrl, originalUrl, faviconUrl);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const currentBlobUrlRef = useRef<string | null>(null);

  // 清理当前的 Blob URL
  const cleanupCurrentBlobUrl = () => {
    if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith('blob:')) {
      releaseManagedBlobUrl(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  };

  // 立即检查缓存的 effect（无防抖）
  useEffect(() => {
    const checkImmediateCache = async () => {
      const cached = faviconCache.getCachedFavicon(originalUrl);
      if (cached && !isDefaultIcon(cached) && cached !== currentFaviconUrl) {
        console.log(`⚡ 立即使用缓存图标: ${originalUrl}`);
        const processedUrl = processFaviconUrl(cached, originalUrl, faviconUrl);
        cleanupCurrentBlobUrl();
        setCurrentFaviconUrl(processedUrl);
        currentBlobUrlRef.current = processedUrl.startsWith('blob:') ? processedUrl : null;
        setError(false);
        setIsLoading(false);
      }
    };

    checkImmediateCache();
  }, [originalUrl]); // 只依赖 originalUrl，避免频繁触发

  useEffect(() => {
    // 防抖：避免在短时间内频繁更新
    const timeoutId = setTimeout(() => {
      // 处理传入的 faviconUrl，如果是有 CORS 问题的 URL 则使用代理
      const processedFaviconUrl = processFaviconUrl(faviconUrl, originalUrl, faviconUrl);

      // 智能缓存策略：只有在以下情况才尝试缓存优化
      // 1. faviconUrl 是默认图标（需要替换）
      // 2. 或者是 Google favicon 服务但没有时间戳参数（说明是旧的自动生成的）
      const isDefaultIconUrl = isDefaultIcon(faviconUrl);

      // 先检查是否有缓存
      const cached = faviconCache.getCachedFavicon(originalUrl);

      if (cached && !isDefaultIcon(cached)) {
        // 有有效缓存，直接使用
        console.log('📦 使用缓存图标:', originalUrl);
        const cachedProcessedUrl = processFaviconUrl(cached, originalUrl, faviconUrl);
        if (currentFaviconUrl !== cachedProcessedUrl) {
          cleanupCurrentBlobUrl();
          setCurrentFaviconUrl(cachedProcessedUrl);
          currentBlobUrlRef.current = cachedProcessedUrl.startsWith('blob:')
            ? cachedProcessedUrl
            : null;
        }
        setError(false);
        setIsLoading(false);
        return;
      }

      // 如果当前URL已经不是默认图标，且没有更好的缓存，就不要改变
      if (!isDefaultIcon(currentFaviconUrl) && !cached) {
        return;
      }

      // 更新当前URL（如果需要）
      if (currentFaviconUrl !== processedFaviconUrl) {
        cleanupCurrentBlobUrl();
        setCurrentFaviconUrl(processedFaviconUrl);
        currentBlobUrlRef.current = processedFaviconUrl.startsWith('blob:')
          ? processedFaviconUrl
          : null;
      }
      setError(false);
      setIsLoading(false);

      // 只有默认图标才尝试异步获取更好的图标（避免过度请求）
      if (isDefaultIconUrl && !cached) {
        setIsLoading(true);
        faviconCache
          .getFavicon(originalUrl, faviconUrl)
          .then((url: string) => {
            if (url !== faviconUrl && !isDefaultIcon(url)) {
              console.log('✅ 获取到更好的图标:', url);
              const processedUrl = processFaviconUrl(url, originalUrl, faviconUrl);
              cleanupCurrentBlobUrl();
              setCurrentFaviconUrl(processedUrl);
              currentBlobUrlRef.current = processedUrl.startsWith('blob:') ? processedUrl : null;
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
    }, 100); // 100ms 防抖

    return () => clearTimeout(timeoutId);
  }, [originalUrl, faviconUrl]);

  // 组件卸载时清理 Blob URL
  useEffect(() => {
    return () => {
      cleanupCurrentBlobUrl();
    };
  }, []);

  return {
    faviconUrl: currentFaviconUrl,
    isLoading,
    error,
  };
}
