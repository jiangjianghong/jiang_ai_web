// 轻量级缓存工具
class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // 设置缓存
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // 清除过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // 清除所有缓存
  clear(): void {
    this.cache.clear();
  }

  // 获取缓存大小
  size(): number {
    return this.cache.size;
  }
}

// 导出单例实例
export const cacheManager = CacheManager.getInstance();

// 定期清理过期缓存
setInterval(() => {
  cacheManager.cleanup();
}, 60000); // 每分钟清理一次

// 图标缓存优化
export const optimizedFaviconFetcher = async (url: string): Promise<string> => {
  const cacheKey = `favicon:${url}`;
  const cached = cacheManager.get<string>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const domain = new URL(url).hostname;
    
    // 按优先级尝试不同的favicon服务
    const faviconSources = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      `https://favicon.yandex.net/favicon/v2/${domain}?size=32`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://${domain}/favicon.ico`
    ];

    for (const faviconUrl of faviconSources) {
      try {
        // 尝试加载图片来验证URL是否有效
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = faviconUrl;
        });
        
        // 缓存成功的URL
        cacheManager.set(cacheKey, faviconUrl, 24 * 60 * 60 * 1000); // 24小时
        return faviconUrl;
      } catch {
        continue;
      }
    }

    // 如果都失败了，返回默认图标
    const defaultIcon = '/icon/icon.jpg';
    cacheManager.set(cacheKey, defaultIcon, 60 * 60 * 1000); // 1小时
    return defaultIcon;
    
  } catch (error) {
    console.error('获取favicon失败:', error);
    return '/icon/icon.jpg';
  }
};

// 背景图片预加载和缓存
export const preloadBackgroundImages = () => {
  const wallpapers = [
    'https://bing.img.run/uhd.php',
    'https://bing.img.run/1920x1080.php',
    'https://source.unsplash.com/1920x1080/?nature'
  ];

  wallpapers.forEach((url, index) => {
    setTimeout(() => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        cacheManager.set(`wallpaper:${index}`, url, 60 * 60 * 1000); // 1小时缓存
      };
    }, index * 100); // 错开加载时间
  });
};
