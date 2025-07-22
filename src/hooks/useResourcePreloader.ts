import { useEffect } from 'react';
import { resourcePreloader } from '@/lib/resourcePreloader';

/**
 * 资源预加载 Hook
 * 用于预加载关键资源，提升页面性能
 * @param enabled 是否启用预加载，用于延迟初始化避免阻塞首屏
 */
export function useResourcePreloader(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 延迟预加载，避免阻塞首屏渲染
    const delayedPreload = setTimeout(() => {
      // 预连接到第三方域名
      const preconnectDomains = [
        'https://www.bing.com',
        'https://source.unsplash.com',
        'https://www.google.com',
        'https://icons.duckduckgo.com',
        'https://favicon.im'
      ];

      preconnectDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        if (!document.head.querySelector(`link[href="${domain}"]`)) {
          document.head.appendChild(link);
        }
      });

      // 只有当页面包含图标时才预加载默认图标
      const hasIcons = document.querySelector('.fa, .fas, .far, .fab, [class*="fa-"]');
      if (hasIcons) {
        // 延迟预加载FontAwesome字体（只在需要时）
        const fontAwesomeUrls = [
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.woff2',
        ];

        fontAwesomeUrls.forEach(url => {
          resourcePreloader.queuePreload(url);
        });
      }
    }, 2000); // 延迟2秒，确保首屏渲染完成

    // 清理函数
    return () => {
      clearTimeout(delayedPreload);
    };
  }, [enabled]);

  /**
   * 预加载网站 favicon
   */
  const preloadFavicons = (websites: Array<{ url: string; favicon: string }>) => {
    const faviconUrls = websites.map(site => site.favicon);
    resourcePreloader.preloadImages(faviconUrls);
  };

  /**
   * 预加载单个图片
   */
  const preloadImage = (url: string) => {
    resourcePreloader.queuePreload(url);
  };

  /**
   * 获取预加载统计
   */
  const getPreloadStats = () => {
    return resourcePreloader.getStats();
  };

  return {
    preloadFavicons,
    preloadImage,
    getPreloadStats
  };
}