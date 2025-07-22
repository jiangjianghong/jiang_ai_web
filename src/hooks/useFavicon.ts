import { useState, useEffect } from 'react';
import { faviconCache } from '@/lib/faviconCache';
import { isDefaultIcon } from '@/lib/iconPath';

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

  // 处理 favicon URL，检测并通过代理访问有 CORS 问题的 URL
  const processeFaviconUrl = (url: string): string => {
    const proxyPrefix = '/api/proxy?url=';
    
    // 检查是否是需要代理的URL
    if (url.includes('favicon.im') && !url.includes('/api/proxy')) {
      // 先检查是否已有缓存，如果有缓存则不需要代理
      const cached = faviconCache.getCachedFavicon(originalUrl);
      
      if (cached) {
        const domain = extractDomain(originalUrl);
        console.log(`📁 已有缓存，跳过代理: ${domain}`);
        return url; // 直接返回原URL，不使用代理
      }
      
      console.log(`🔄 检测到favicon.im URL，使用Vercel代理: ${url}`);
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

  // 添加降级处理函数
  const getFallbackUrl = (url: string): string | null => {
    const proxyPrefix = 'https://api.allorigins.win/raw?url=';
    
    // 如果当前是代理URL且失败了，返回直接URL
    if (url.includes('api.allorigins.win') && url.includes('favicon.im')) {
      try {
        const decodedUrl = decodeURIComponent(url.replace(proxyPrefix, ''));
        console.log(`🔄 代理失败，降级到直接访问: ${decodedUrl}`);
        return decodedUrl;
      } catch (error) {
        console.warn('URL解码失败:', error);
      }
    }
    
    return null;
  };

  useEffect(() => {
    // 处理传入的 faviconUrl，如果是有 CORS 问题的 URL 则使用代理
    const processedFaviconUrl = processeFaviconUrl(faviconUrl);
    setCurrentFaviconUrl(processedFaviconUrl);
    setError(false);
    setIsLoading(false);
    
    // 智能缓存策略：只有在以下情况才尝试缓存优化
    // 1. faviconUrl 是默认图标（需要替换）
    // 2. 或者是 Google favicon 服务但没有时间戳参数（说明是旧的自动生成的）
    const isDefaultIconUrl = isDefaultIcon(faviconUrl);
    const isOldGoogleIcon = faviconUrl.includes('google.com/s2/favicons') && !faviconUrl.includes('&t=');
    
    // 先检查是否有缓存
    const cached = faviconCache.getCachedFavicon(originalUrl);
    
    if (cached && !isDefaultIcon(cached)) {
      // 有有效缓存，直接使用
      console.log('📦 使用缓存图标:', originalUrl);
      setCurrentFaviconUrl(processeFaviconUrl(cached));
      return;
    }
    
    // 只有默认图标才尝试异步获取更好的图标（避免过度请求）
    if (isDefaultIconUrl && !cached) {
      setIsLoading(true);
      faviconCache.getFavicon(originalUrl, faviconUrl)
        .then((url: string) => {
          if (url !== faviconUrl && !isDefaultIcon(url)) {
            console.log('✅ 获取到更好的图标:', url);
            setCurrentFaviconUrl(processeFaviconUrl(url));
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
  }, [originalUrl, faviconUrl]);

  return {
    faviconUrl: currentFaviconUrl,
    isLoading,
    error
  };
}
