import { useState, useEffect, useRef, RefObject } from 'react';
import { faviconCache } from '@/lib/faviconCache';
import { isDefaultIcon } from '@/lib/iconPath';
import { releaseManagedBlobUrl } from '@/lib/memoryManager';

interface UseLazyFaviconOptions {
  /** IntersectionObserver root margin (default: '50px') */
  rootMargin?: string;
  /** IntersectionObserver threshold (default: 0.1) */
  threshold?: number;
}

/**
 * 使用 favicon 缓存的 Hook，支持懒加载
 * @param originalUrl 网站原始 URL
 * @param faviconUrl favicon URL
 * @param elementRef 元素引用，用于 IntersectionObserver
 * @param options 懒加载选项
 * @returns { faviconUrl: string, isLoading: boolean, error: boolean }
 */
export function useLazyFavicon(
  originalUrl: string, 
  faviconUrl: string,
  elementRef: RefObject<HTMLElement>,
  options: UseLazyFaviconOptions = {}
) {
  const { rootMargin = '50px', threshold = 0.1 } = options;
  
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string>(() => {
    // 初始化时先检查缓存，优先使用 Blob URL
    const cached = faviconCache.getCachedFavicon(originalUrl);
    if (cached && !isDefaultIcon(cached)) {
      return cached;
    }
    return faviconUrl;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const currentBlobUrlRef = useRef<string | null>(null);
  const hasStartedLoading = useRef(false);

  // 清理当前的 Blob URL
  const cleanupCurrentBlobUrl = () => {
    if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith('blob:')) {
      releaseManagedBlobUrl(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  };

  // 处理 favicon URL，检测并通过代理访问有 CORS 问题的 URL
  const processeFaviconUrl = (url: string): string => {
    const proxyPrefix = 'https://api.allorigins.win/raw?url=';

    if (url.includes('favicon.im') && !url.includes('api.allorigins.win')) {
      const cached = faviconCache.getCachedFavicon(originalUrl);
      if (cached) {
        return url;
      }
      return proxyPrefix + encodeURIComponent(url);
    }
    return url;
  };

  // IntersectionObserver effect
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasStartedLoading.current) {
          setIsVisible(true);
          hasStartedLoading.current = true;
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, rootMargin, threshold]);

  // 立即检查缓存的 effect（只在可见时执行）
  useEffect(() => {
    if (!isVisible) return;

    const checkImmediateCache = async () => {
      const cached = faviconCache.getCachedFavicon(originalUrl);
      if (cached && !isDefaultIcon(cached) && cached !== currentFaviconUrl) {
        const processedUrl = processeFaviconUrl(cached);
        cleanupCurrentBlobUrl();
        setCurrentFaviconUrl(processedUrl);
        currentBlobUrlRef.current = processedUrl.startsWith('blob:') ? processedUrl : null;
        setError(false);
        setIsLoading(false);
      }
    };

    checkImmediateCache();
  }, [originalUrl, isVisible]);

  // 主要的 favicon 加载逻辑（只在可见时执行）
  useEffect(() => {
    if (!isVisible) return;

    const timeoutId = setTimeout(() => {
      const processedFaviconUrl = processeFaviconUrl(faviconUrl);
      const isDefaultIconUrl = isDefaultIcon(faviconUrl);
      const cached = faviconCache.getCachedFavicon(originalUrl);

      if (cached && !isDefaultIcon(cached)) {
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

      if (!isDefaultIcon(currentFaviconUrl) && !cached) {
        return;
      }

      if (currentFaviconUrl !== processedFaviconUrl) {
        cleanupCurrentBlobUrl();
        setCurrentFaviconUrl(processedFaviconUrl);
        currentBlobUrlRef.current = processedFaviconUrl.startsWith('blob:') ? processedFaviconUrl : null;
      }
      setError(false);
      setIsLoading(false);

      if (isDefaultIconUrl && !cached) {
        setIsLoading(true);
        faviconCache.getFavicon(originalUrl, faviconUrl)
          .then((url: string) => {
            if (url !== faviconUrl && !isDefaultIcon(url)) {
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
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [originalUrl, faviconUrl, isVisible]);

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
    isVisible
  };
}