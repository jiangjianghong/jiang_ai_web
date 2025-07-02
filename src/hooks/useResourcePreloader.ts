import { useEffect } from 'react';
import { resourcePreloader } from '@/lib/resourcePreloader';

/**
 * 资源预加载 Hook
 * 用于预加载关键资源，提升页面性能
 */
export function useResourcePreloader() {
  useEffect(() => {
    // 预加载 FontAwesome 字体
    const fontAwesomeUrls = [
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.woff2',
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-regular-400.woff2',
    ];

    fontAwesomeUrls.forEach(url => {
      resourcePreloader.queuePreload(url);
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
      if (!document.head.querySelector(`link[href="${domain}"]`)) {
        document.head.appendChild(link);
      }
    });

    // 清理函数
    return () => {
      // 可以在这里做一些清理工作
    };
  }, []);

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