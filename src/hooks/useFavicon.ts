import { useState, useEffect, useRef } from 'react';
import { faviconCache } from '@/lib/faviconCache';
import { isDefaultIcon } from '@/lib/iconPath';
import { releaseManagedBlobUrl } from '@/lib/memoryManager';

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
    return faviconUrl;
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

  // 处理 favicon URL，检测并通过代理访问有 CORS 问题的 URL
  const processeFaviconUrl = (url: string): string => {
    // 安全检查：确保 url 是有效字符串
    if (!url || typeof url !== 'string') {
      return '/icon/favicon.png';
    }
    
    const proxyPrefix = 'https://api.allorigins.win/raw?url=';

    // 检查是否是需要代理的URL
    if (url.includes('favicon.im') && !url.includes('api.allorigins.win')) {
      // 先检查是否已有缓存，如果有缓存则不需要代理
      const cached = faviconCache.getCachedFavicon(originalUrl);

      if (cached) {
        const domain = extractDomain(originalUrl);
        console.log(`📁 已有缓存，跳过代理: ${domain}`);
        return url; // 直接返回原URL，不使用代理
      }

      console.log(`🔄 检测到favicon.im URL，优先尝试代理: ${url}`);
      return proxyPrefix + encodeURIComponent(url);
    }

    return url;
  };

  // 提取域名的辅助函数
  const extractDomain = (url: string): string => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
  };



  // 立即检查缓存的 effect（无防抖）
  useEffect(() => {
    const checkImmediateCache = async () => {
      const cached = faviconCache.getCachedFavicon(originalUrl);
      if (cached && !isDefaultIcon(cached) && cached !== currentFaviconUrl) {
        console.log(`⚡ 立即使用缓存图标: ${originalUrl}`);
        const processedUrl = processeFaviconUrl(cached);
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
      const processedFaviconUrl = processeFaviconUrl(faviconUrl);

      // 智能缓存策略：只有在以下情况才尝试缓存优化
      // 1. faviconUrl 是默认图标（需要替换）
      // 2. 或者是 Google favicon 服务但没有时间戳参数（说明是旧的自动生成的）
      const isDefaultIconUrl = isDefaultIcon(faviconUrl);

      // 先检查是否有缓存
      const cached = faviconCache.getCachedFavicon(originalUrl);

      if (cached && !isDefaultIcon(cached)) {
        // 有有效缓存，直接使用
        console.log('📦 使用缓存图标:', originalUrl);
        const cachedProcessedUrl = processeFaviconUrl(cached);
        if (currentFaviconUrl !== cachedProcessedUrl) {
          cleanupCurrentBlobUrl();
          setCurrentFaviconUrl(cachedProcessedUrl);
          currentBlobUrlRef.current = cachedProcessedUrl.startsWith('blob:') ? cachedProcessedUrl : null;
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
        currentBlobUrlRef.current = processedFaviconUrl.startsWith('blob:') ? processedFaviconUrl : null;
      }
      setError(false);
      setIsLoading(false);

      // 只有默认图标才尝试异步获取更好的图标（避免过度请求）
      if (isDefaultIconUrl && !cached) {
        setIsLoading(true);
        faviconCache.getFavicon(originalUrl, faviconUrl)
          .then((url: string) => {
            if (url !== faviconUrl && !isDefaultIcon(url)) {
              console.log('✅ 获取到更好的图标:', url);
              const processedUrl = processeFaviconUrl(url);
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
    error
  };
}
