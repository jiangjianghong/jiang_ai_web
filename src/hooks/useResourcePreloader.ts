import { useEffect, useState } from 'react';

// 预加载重要资源的Hook
export function useResourcePreloader() {
  useEffect(() => {
    // 预加载关键字体
    const fontLinks = [
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.woff2',
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-regular-400.woff2'
    ];

    fontLinks.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
      document.head.appendChild(link);
    });

    // 预加载常用图标服务
    const iconServices = [
      'https://www.google.com/s2/favicons?domain=github.com&sz=32',
      'https://favicon.yandex.net/favicon/v2/github.com?size=32'
    ];

    iconServices.forEach(url => {
      const img = new Image();
      img.src = url;
    });

    // 预连接到第三方域名
    const preconnectDomains = [
      'https://bing.img.run',
      'https://source.unsplash.com',
      'https://www.google.com',
      'https://favicon.yandex.net',
      'https://icons.duckduckgo.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });

    return () => {
      // 清理预加载的link标签
      const preloadLinks = document.querySelectorAll('link[rel="preload"], link[rel="preconnect"]');
      preloadLinks.forEach(link => {
        if (link.getAttribute('data-preloader') !== 'manual') {
          link.remove();
        }
      });
    };
  }, []);
}

// 图片懒加载Hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsError(false);
    };
    img.onerror = () => {
      setIsError(true);
      setIsLoaded(false);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { imageSrc, isLoaded, isError };
}

// 内存中的资源缓存
const resourceCache = new Map<string, any>();

export function useResourceCache<T>(key: string, fetcher: () => Promise<T> | T): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: resourceCache.has(key) ? resourceCache.get(key) : null,
    loading: !resourceCache.has(key),
    error: null
  });

  useEffect(() => {
    if (resourceCache.has(key)) {
      setState(prev => ({
        ...prev,
        data: resourceCache.get(key),
        loading: false
      }));
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        const result = await fetcher();
        if (!cancelled) {
          resourceCache.set(key, result);
          setState({
            data: result,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error as Error
          });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}
