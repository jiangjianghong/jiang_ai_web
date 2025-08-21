// 优化的壁纸服务 - 解决白屏问题，提升加载体验
// 使用浏览器原生 Blob API 处理图片数据
import { indexedDBCache } from './indexedDBCache';
import { logger } from './logger';
import { errorHandler } from './errorHandler';
import { memoryManager } from './memoryManager';
import { createWallpaperRequest } from './requestManager';
import { createTimeoutSignal } from './abortUtils';
import { customWallpaperManager } from './customWallpaperManager';

// 移除未使用的接口

class OptimizedWallpaperService {
  private static instance: OptimizedWallpaperService;
  private loadingPromises = new Map<string, Promise<string>>();
  private fallbackImage = '/icon/favicon.png'; // 本地备用图片

  static getInstance(): OptimizedWallpaperService {
    if (!OptimizedWallpaperService.instance) {
      OptimizedWallpaperService.instance = new OptimizedWallpaperService();
    }
    return OptimizedWallpaperService.instance;
  }

  // 获取今天的缓存键
  private getTodayCacheKey(resolution: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `wallpaper-optimized:${resolution}-${today}`;
  }

  // 获取昨天的缓存键（用于降级）
  private getYesterdayCacheKey(resolution: string): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `wallpaper-optimized:${resolution}-${yesterday.toISOString().split('T')[0]}`;
  }

  // 移除未使用的方法

  // 获取Supabase壁纸URL
  private async getWallpaperUrl(resolution: string): Promise<string> {
    try {
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

      if (supabaseUrl) {
        const resolutionMap = {
          '4k': 'uhd',
          '1080p': '1920x1080',
          '720p': '1366x768',
          'mobile': 'mobile'
        };

        const targetResolution = resolutionMap[resolution as keyof typeof resolutionMap] || '1920x1080';
        return `${supabaseUrl}/functions/v1/wallpaper-service?resolution=${targetResolution}`;
      }
    } catch (error) {
      logger.wallpaper.warn('Supabase壁纸服务访问失败', error);
    }

    return this.fallbackImage;
  }

  // 智能获取缓存（今天 > 昨天 > 更早）
  private async getSmartCache(resolution: string): Promise<{ url: string; isToday: boolean } | null> {
    try {
      // 1. 优先尝试今天的缓存
      const todayKey = this.getTodayCacheKey(resolution);
      const todayCache = await indexedDBCache.get(todayKey) as Blob;

      if (todayCache) {
        logger.wallpaper.info('使用今天的壁纸缓存');
        return {
          url: memoryManager.createBlobUrl(todayCache, 'wallpaper'),
          isToday: true
        };
      }

      // 2. 尝试昨天的缓存作为降级
      const yesterdayKey = this.getYesterdayCacheKey(resolution);
      const yesterdayCache = await indexedDBCache.get(yesterdayKey) as Blob;

      if (yesterdayCache) {
        logger.wallpaper.info('使用昨天的壁纸缓存作为降级');
        return {
          url: memoryManager.createBlobUrl(yesterdayCache, 'wallpaper'),
          isToday: false
        };
      }

      // 3. 尝试任何可用的壁纸缓存
      const allKeys = await indexedDBCache.getAllKeys();
      const wallpaperKeys = allKeys.filter(key =>
        key.startsWith('wallpaper-optimized:') && key.includes(resolution)
      );

      if (wallpaperKeys.length > 0) {
        // 按时间排序，使用最新的
        wallpaperKeys.sort().reverse();
        const latestKey = wallpaperKeys[0];
        const latestCache = await indexedDBCache.get(latestKey) as Blob;

        if (latestCache) {
          logger.wallpaper.info('使用最新可用的壁纸缓存', { key: latestKey });
          return {
            url: memoryManager.createBlobUrl(latestCache, 'wallpaper'),
            isToday: false
          };
        }
      }

    } catch (error) {
      logger.wallpaper.warn('获取智能缓存失败', error);
    }

    return null;
  }

  // 下载并缓存壁纸
  private async downloadAndCache(url: string, resolution: string): Promise<string> {
    try {
      logger.wallpaper.info('开始下载壁纸', { url: url.substring(0, 50) });

      // 使用代理处理CORS
      const proxyUrl = url.includes('bing.com') || url.includes('unsplash.com')
        ? `https://corsproxy.io/?${encodeURIComponent(url)}`
        : url;

      // 使用请求管理器下载
      const response = await createWallpaperRequest(proxyUrl, {
        mode: 'cors',
        headers: { 'Accept': 'image/*' },
        signal: createTimeoutSignal(12000) // 12秒超时
      });

      const blob = await response.blob();
      const blobUrl = memoryManager.createBlobUrl(blob, 'wallpaper');

      // 异步缓存到IndexedDB
      const cacheKey = this.getTodayCacheKey(resolution);
      indexedDBCache.set(cacheKey, blob, 48 * 60 * 60 * 1000) // 48小时缓存
        .then(() => logger.wallpaper.info('壁纸已缓存到IndexedDB'))
        .catch(error => logger.wallpaper.warn('缓存壁纸失败', error));

      logger.wallpaper.info('壁纸下载完成', {
        size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`
      });
      return blobUrl;

    } catch (error) {
      logger.wallpaper.error('下载壁纸失败', error);
      throw error;
    }
  }

  // 主要方法：获取壁纸（优化的加载策略）
  async getWallpaper(resolution: string): Promise<{
    url: string;
    isFromCache: boolean;
    isToday: boolean;
    needsUpdate: boolean;
  }> {
    const cacheKey = `loading-${resolution}`;

    // 防止重复加载
    if (this.loadingPromises.has(cacheKey)) {
      const url = await this.loadingPromises.get(cacheKey)!;
      return { url, isFromCache: true, isToday: true, needsUpdate: false };
    }

    const loadingPromise = this._getWallpaperInternal(resolution);
    this.loadingPromises.set(cacheKey, loadingPromise.then(result => result.url));

    try {
      const result = await loadingPromise;
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  private async _getWallpaperInternal(resolution: string): Promise<{
    url: string;
    isFromCache: boolean;
    isToday: boolean;
    needsUpdate: boolean;
  }> {
    try {
      // 0. 如果是自定义壁纸，直接返回
      if (resolution === 'custom') {
        const customUrl = await customWallpaperManager.getCustomWallpaper();
        if (customUrl) {
          logger.wallpaper.info('使用自定义壁纸');
          return {
            url: customUrl,
            isFromCache: true,
            isToday: true,
            needsUpdate: false
          };
        } else {
          // 没有自定义壁纸，使用备用图片
          logger.wallpaper.warn('未找到自定义壁纸，使用备用图片');
          return {
            url: this.fallbackImage,
            isFromCache: false,
            isToday: true,
            needsUpdate: false
          };
        }
      }

      // 1. 首先尝试智能缓存
      const cachedResult = await this.getSmartCache(resolution);

      if (cachedResult) {
        // 有缓存，立即返回，但可能需要后台更新
        const result = {
          url: cachedResult.url,
          isFromCache: true,
          isToday: cachedResult.isToday,
          needsUpdate: !cachedResult.isToday
        };

        // 如果不是今天的缓存，后台更新
        if (!cachedResult.isToday) {
          logger.wallpaper.info('后台更新今天的壁纸');
          this.updateWallpaperInBackground(resolution).catch(error => {
            logger.wallpaper.warn('后台更新壁纸失败', error);
          });
        }

        return result;
      }

      // 2. 无缓存，需要下载
      logger.wallpaper.info('无可用缓存，开始下载新壁纸');
      const wallpaperUrl = await this.getWallpaperUrl(resolution);

      if (wallpaperUrl === this.fallbackImage) {
        // 使用本地备用图片
        return {
          url: wallpaperUrl,
          isFromCache: false,
          isToday: true,
          needsUpdate: false
        };
      }

      const downloadedUrl = await this.downloadAndCache(wallpaperUrl, resolution);

      return {
        url: downloadedUrl,
        isFromCache: false,
        isToday: true,
        needsUpdate: false
      };

    } catch (error) {
      const errorInfo = errorHandler.handleError(error as Error, 'wallpaper-load');
      logger.wallpaper.error('获取壁纸失败，使用备用图片', errorInfo);

      return {
        url: this.fallbackImage,
        isFromCache: false,
        isToday: true,
        needsUpdate: false
      };
    }
  }

  // 后台更新壁纸
  private async updateWallpaperInBackground(resolution: string): Promise<void> {
    try {
      const wallpaperUrl = await this.getWallpaperUrl(resolution);
      if (wallpaperUrl !== this.fallbackImage) {
        await this.downloadAndCache(wallpaperUrl, resolution);
        logger.wallpaper.info('后台壁纸更新完成');
      }
    } catch (error) {
      logger.wallpaper.warn('后台壁纸更新失败', error);
    }
  }

  // 预加载壁纸（在空闲时间）
  async preloadWallpapers(): Promise<void> {
    if (!('requestIdleCallback' in window)) {
      return; // 不支持空闲回调的浏览器跳过预加载
    }

    const resolutions = ['1080p', '720p', '4k', 'mobile'];

    for (const resolution of resolutions) {
      await new Promise<void>((resolve) => {
        requestIdleCallback(async () => {
          try {
            const cached = await this.getSmartCache(resolution);
            if (!cached || !cached.isToday) {
              logger.wallpaper.debug(`预加载 ${resolution} 壁纸`);
              await this.getWallpaper(resolution);
            }
          } catch (error) {
            logger.wallpaper.warn(`预加载 ${resolution} 壁纸失败`, error);
          }
          resolve();
        });
      });
    }
  }

  // 清理过期缓存
  async cleanupExpiredCache(): Promise<void> {
    try {
      const allKeys = await indexedDBCache.getAllKeys();
      const wallpaperKeys = allKeys.filter(key => key.startsWith('wallpaper-optimized:'));

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const cutoffDate = threeDaysAgo.toISOString().split('T')[0];

      let deletedCount = 0;

      for (const key of wallpaperKeys) {
        const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch && dateMatch[1] < cutoffDate) {
          await indexedDBCache.delete(key);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.wallpaper.info(`清理了 ${deletedCount} 个过期壁纸缓存`);
      }
    } catch (error) {
      logger.wallpaper.warn('清理过期缓存失败', error);
    }
  }

  // 获取缓存统计
  async getCacheStats(): Promise<{
    totalCount: number;
    todayCount: number;
    totalSize: number;
    cacheKeys: string[];
  }> {
    try {
      const allKeys = await indexedDBCache.getAllKeys();
      const wallpaperKeys = allKeys.filter(key => key.startsWith('wallpaper-optimized:'));

      const today = new Date().toISOString().split('T')[0];
      const todayKeys = wallpaperKeys.filter(key => key.includes(today));

      let totalSize = 0;
      for (const key of wallpaperKeys) {
        try {
          const blob = await indexedDBCache.get(key) as Blob;
          if (blob) {
            totalSize += blob.size;
          }
        } catch (error) {
          // 忽略单个文件的错误
        }
      }

      return {
        totalCount: wallpaperKeys.length,
        todayCount: todayKeys.length,
        totalSize,
        cacheKeys: wallpaperKeys
      };
    } catch (error) {
      logger.wallpaper.warn('获取缓存统计失败', error);
      return { totalCount: 0, todayCount: 0, totalSize: 0, cacheKeys: [] };
    }
  }
}

// 导出单例
export const optimizedWallpaperService = OptimizedWallpaperService.getInstance();

// 定期清理过期缓存（每6小时）
setInterval(() => {
  optimizedWallpaperService.cleanupExpiredCache().catch(error => {
    logger.wallpaper.error('定期清理缓存失败', error);
  });
}, 6 * 60 * 60 * 1000);

// 页面空闲时预加载壁纸
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  requestIdleCallback(() => {
    optimizedWallpaperService.preloadWallpapers().catch(error => {
      logger.wallpaper.error('预加载壁纸失败', error);
    });
  });
}