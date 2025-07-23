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

  // 处理 favicon URL，智能代理切换
  const processeFaviconUrl = (url: string, retryCount: number = 0): string => {
    // 检查是否是需要代理的URL
    if (url.includes('favicon.im')) {
      // 先检查是否已有缓存，如果有缓存则不需要代理
      const cached = faviconCache.getCachedFavicon(originalUrl);
      
      if (cached) {
        const domain = extractDomain(originalUrl);
        console.log(`📁 已有缓存，跳过代理: ${domain}`);
        return url; // 直接返回原URL，不使用代理
      }
      
      // 仅使用 Supabase favicon 服务
      const domain = extractDomain(originalUrl);
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      
      let proxies: string[];
      
      if (supabaseUrl) {
        // 仅使用 Supabase favicon 服务
        proxies = [
          `${supabaseUrl}/functions/v1/favicon-service?domain=${encodeURIComponent(domain)}&size=64`,
          `${supabaseUrl}/functions/v1/favicon-service?domain=${encodeURIComponent(domain)}&size=32`,
        ];
      } else {
        // 没有 Supabase 配置时，不使用任何代理
        console.warn('⚠️ Supabase URL 未配置，无法获取图标');
        proxies = [];
      }
      
      const selectedProxy = proxies[retryCount % proxies.length];
      console.log(`🔄 图标代理 (尝试${retryCount + 1}): ${selectedProxy}`);
      return selectedProxy;
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

  // 智能重试加载图标
  const retryLoadFavicon = (url: string, retryCount: number = 0): void => {
    const processedUrl = processeFaviconUrl(url, retryCount);
    
    // 如果没有可用的代理URL，直接使用原始URL或默认图标
    if (!processedUrl || processedUrl === url) {
      console.log('📦 使用原始图标URL:', url);
      setCurrentFaviconUrl(url);
      setError(false);
      return;
    }
    
    if (retryCount >= 2) { // 减少重试次数，因为只有Supabase服务
      console.warn('🚨 Supabase图标服务重试次数过多，使用原始URL:', originalUrl);
      setCurrentFaviconUrl(url);
      setError(false);
      return;
    }
    
    // 使用 Image 对象测试加载
    const testImg = new Image();
    testImg.onload = () => {
      console.log(`✅ 图标加载成功 (尝试${retryCount + 1}):`, processedUrl);
      setCurrentFaviconUrl(processedUrl);
      setError(false);
    };
    
    testImg.onerror = () => {
      console.warn(`❌ 图标加载失败 (尝试${retryCount + 1}):`, processedUrl);
      // 短暂延迟后重试下一个Supabase服务
      setTimeout(() => retryLoadFavicon(url, retryCount + 1), 500);
    };
    
    testImg.src = processedUrl;
  };

  useEffect(() => {
    setError(false);
    setIsLoading(false);
    
    // 智能缓存策略：只有在以下情况才尝试缓存优化
    const isDefaultIconUrl = isDefaultIcon(faviconUrl);
    
    // 先检查是否有缓存
    const cached = faviconCache.getCachedFavicon(originalUrl);
    
    if (cached && !isDefaultIcon(cached)) {
      // 有有效缓存，使用智能重试加载缓存的图标
      console.log('📦 使用缓存图标:', originalUrl);
      retryLoadFavicon(cached);
      return;
    }
    
    // 如果是默认图标，尝试获取更好的图标
    if (isDefaultIconUrl && !cached) {
      setIsLoading(true);
      faviconCache.getFavicon(originalUrl, faviconUrl)
        .then((url: string) => {
          if (url !== faviconUrl && !isDefaultIcon(url)) {
            console.log('✅ 获取到更好的图标:', url);
            retryLoadFavicon(url);
          } else {
            // 使用默认图标
            retryLoadFavicon(faviconUrl);
          }
          setError(false);
        })
        .catch((err: any) => {
          console.warn('Favicon 优化失败:', err);
          // 失败时使用原始URL
          retryLoadFavicon(faviconUrl);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // 直接使用传入的图标URL
      retryLoadFavicon(faviconUrl);
    }
  }, [originalUrl, faviconUrl]);

  return {
    faviconUrl: currentFaviconUrl,
    isLoading,
    error
  };
}
