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

// 改进的背景图片缓存 - 缓存实际图片数据
export const improvedWallpaperCache = {
  // 缓存图片blob数据
  async cacheWallpaperBlob(url: string, cacheKey: string): Promise<string> {
    try {
      // 检查是否已有缓存的blob URL
      const cachedBlobUrl = cacheManager.get<string>(`wallpaper-blob:${cacheKey}`);
      if (cachedBlobUrl) {
        return cachedBlobUrl;
      }

      // 下载图片
      const response = await fetch(url);
      if (!response.ok) throw new Error('下载失败');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // 缓存blob URL (2小时)
      cacheManager.set(`wallpaper-blob:${cacheKey}`, blobUrl, 2 * 60 * 60 * 1000);
      
      // 也缓存原始URL用于引用
      cacheManager.set(`wallpaper-source:${cacheKey}`, url, 2 * 60 * 60 * 1000);
      
      return blobUrl;
    } catch (error) {
      console.error('壁纸缓存失败:', error);
      return url; // 回退到原始URL
    }
  },

  // 预加载当日壁纸
  async preloadTodayWallpapers(): Promise<void> {
    const today = new Date().toDateString();
    const wallpaperSources = [
      { url: 'https://bing.img.run/uhd.php', key: `bing-${today}` },
      { url: 'https://bing.img.run/1920x1080.php', key: `bing-hd-${today}` },
      { url: 'https://source.unsplash.com/1920x1080/?nature', key: `unsplash-${today}` }
    ];

    // 并发预加载，但限制并发数
    const results = await Promise.allSettled(
      wallpaperSources.map(({ url, key }) => this.cacheWallpaperBlob(url, key))
    );

    console.log('📷 壁纸预加载完成:', results.filter(r => r.status === 'fulfilled').length, '/', results.length);
  },

  // 获取缓存的壁纸
  getCachedWallpaper(cacheKey: string): string | null {
    return cacheManager.get<string>(`wallpaper-blob:${cacheKey}`);
  },

  // 清理壁纸缓存
  cleanupWallpaperCache(): void {
    // 清理过期的blob URLs
    const keys = Array.from((cacheManager as any).cache.keys()) as string[];
    keys.filter((key: string) => key.startsWith('wallpaper-blob:')).forEach((key: string) => {
      const blobUrl = cacheManager.get<string>(key);
      if (blobUrl) {
        // 撤销blob URL释放内存
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (e) {
          // 忽略错误
        }
      }
    });
  }
};

// 背景图片预加载和缓存 - 保留原有的简单版本用于兼容
export const preloadBackgroundImages = () => {
  // 使用改进的缓存机制
  improvedWallpaperCache.preloadTodayWallpapers().catch(console.error);
  
  // 原有的简单缓存（用于快速回退）
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
        // 标记为已验证的URL
        cacheManager.set(`wallpaper-verified:${index}`, url, 60 * 60 * 1000);
      };
    }, index * 100);
  });
};
