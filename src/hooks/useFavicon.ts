import { useState, useEffect, useRef } from 'react';
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
  const currentBlobUrlRef = useRef<string | null>(null);

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
      
      // 混合架构：公开镜像源 + Supabase 跨域代理
      const domain = extractDomain(originalUrl);
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      
      let proxies: string[] = [];
      
      // 直接使用公开镜像源（优先，速度快）
      proxies.push(
        `https://favicon.im/${domain}?larger=true`,
        `https://favicon.im/${domain}`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      );
      
      // Supabase 作为跨域代理（当直接访问失败时）
      if (supabaseUrl) {
        proxies.push(
          `${supabaseUrl}/functions/v1/favicon-service?domain=${encodeURIComponent(domain)}&size=64`,
          `${supabaseUrl}/functions/v1/favicon-service?domain=${encodeURIComponent(domain)}&size=32`
        );
      }
      
      if (proxies.length === 0) {
        console.warn('⚠️ 没有可用的 favicon 服务');
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
      setFaviconUrl(url);
      setError(false);
      return;
    }
    
    if (retryCount >= 6) { // 增加重试次数，支持公开镜像源 + Supabase 代理
      console.warn('🚨 所有图标服务重试次数过多，使用原始URL:', originalUrl);
      setFaviconUrl(url);
      setError(false);
      return;
    }
    
    // 使用 Image 对象测试加载
    const testImg = new Image();
    testImg.onload = () => {
      console.log(`✅ 图标加载成功 (尝试${retryCount + 1}):`, processedUrl);
      setFaviconUrl(processedUrl);
      setError(false);
    };
    
    testImg.onerror = () => {
      console.warn(`❌ 图标加载失败 (尝试${retryCount + 1}):`, processedUrl);
      // 短暂延迟后重试下一个Supabase服务
      setTimeout(() => retryLoadFavicon(url, retryCount + 1), 500);
    };
    
    testImg.src = processedUrl;
  };

  // 清理Blob URL的函数
  const cleanupBlobUrl = () => {
    if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  };

  // 设置新的favicon URL并清理旧的Blob URL
  const setFaviconUrl = (url: string) => {
    cleanupBlobUrl();
    setCurrentFaviconUrl(url);
    if (url.startsWith('blob:')) {
      currentBlobUrlRef.current = url;
    }
  };

  useEffect(() => {
    setError(false);
    setIsLoading(false);
    
    // 智能缓存策略：只有在以下情况才尝试缓存优化
    const isDefaultIconUrl = isDefaultIcon(faviconUrl);
    
    // 先检查是否有缓存（异步获取Blob URL）
    const checkCacheAndLoad = async () => {
      try {
        // 首先检查同步缓存元数据
        const cachedMeta = faviconCache.getCachedFavicon(originalUrl);
        
        if (cachedMeta && !isDefaultIcon(cachedMeta)) {
          // 有缓存元数据，尝试获取Blob URL
          console.log('📦 发现缓存元数据，获取Blob图标:', originalUrl);
          const cachedBlobUrl = await faviconCache.getFavicon(originalUrl, faviconUrl);
          
          if (cachedBlobUrl && cachedBlobUrl !== '/icon/icon.jpg' && !isDefaultIcon(cachedBlobUrl)) {
            console.log('✅ 成功获取缓存的Blob图标:', originalUrl);
            setFaviconUrl(cachedBlobUrl);
            setError(false);
            return;
          }
        }
        
        // 如果没有有效缓存，使用原始图标URL
        console.log('📦 没有缓存，使用原始图标URL:', faviconUrl);
        retryLoadFavicon(faviconUrl);
        
      } catch (err) {
        console.warn('获取缓存图标失败:', err);
        // 失败时使用原始URL
        retryLoadFavicon(faviconUrl);
      }
    };
    
    // 如果是默认图标，尝试获取更好的图标
    if (isDefaultIconUrl) {
      setIsLoading(true);
      checkCacheAndLoad().finally(() => {
        setIsLoading(false);
      });
    } else {
      // 直接使用传入的图标URL，但仍然检查缓存
      checkCacheAndLoad();
    }
    
    // 清理函数
    return () => {
      cleanupBlobUrl();
    };
  }, [originalUrl, faviconUrl]);

  return {
    faviconUrl: currentFaviconUrl,
    isLoading,
    error
  };
}
