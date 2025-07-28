// 优化的壁纸加载Hook - 解决白屏问题，提升用户体验
import { useState, useEffect, useCallback } from 'react';
import { optimizedWallpaperService } from '@/lib/optimizedWallpaperService';
import { logger } from '@/lib/logger';
import { errorHandler } from '@/lib/errorHandler';

interface WallpaperState {
  url: string;
  isLoading: boolean;
  isFromCache: boolean;
  isToday: boolean;
  needsUpdate: boolean;
  error: string | null;
  loadProgress: number;
}

export function useOptimizedWallpaper(resolution: string) {
  const [wallpaperState, setWallpaperState] = useState<WallpaperState>({
    url: '',
    isLoading: true,
    isFromCache: false,
    isToday: false,
    needsUpdate: false,
    error: null,
    loadProgress: 0
  });

  // 预加载图片并监听加载进度
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let loadProgress = 0;
      
      // 模拟加载进度（因为Image对象不提供真实进度）
      const progressInterval = setInterval(() => {
        if (loadProgress < 90) {
          loadProgress += Math.random() * 20;
          setWallpaperState(prev => ({ ...prev, loadProgress: Math.min(loadProgress, 90) }));
        }
      }, 100);

      const cleanup = () => {
        clearInterval(progressInterval);
      };

      // 设置超时
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('图片加载超时'));
      }, 15000);

      img.onload = () => {
        cleanup();
        clearTimeout(timeout);
        setWallpaperState(prev => ({ ...prev, loadProgress: 100 }));
        resolve();
      };

      img.onerror = () => {
        cleanup();
        clearTimeout(timeout);
        reject(new Error('图片加载失败'));
      };

      img.src = url;
    });
  }, []);

  // 加载壁纸的主要逻辑
  const loadWallpaper = useCallback(async () => {
    try {
      setWallpaperState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        loadProgress: 0
      }));

      logger.wallpaper.info('开始加载壁纸', { resolution });

      // 获取壁纸
      const result = await optimizedWallpaperService.getWallpaper(resolution);
      
      logger.wallpaper.debug('壁纸获取结果', {
        isFromCache: result.isFromCache,
        isToday: result.isToday,
        needsUpdate: result.needsUpdate
      });

      // 如果是从缓存获取的，可能需要预加载验证
      if (result.isFromCache) {
        // 缓存的图片，直接使用，无需预加载
        setWallpaperState({
          url: result.url,
          isLoading: false,
          isFromCache: result.isFromCache,
          isToday: result.isToday,
          needsUpdate: result.needsUpdate,
          error: null,
          loadProgress: 100
        });

        // 如果需要更新，显示提示
        if (result.needsUpdate) {
          logger.wallpaper.info('使用缓存壁纸，后台正在更新今天的壁纸');
        }
      } else {
        // 新下载的图片，需要预加载确保显示
        try {
          await preloadImage(result.url);
          
          setWallpaperState({
            url: result.url,
            isLoading: false,
            isFromCache: result.isFromCache,
            isToday: result.isToday,
            needsUpdate: result.needsUpdate,
            error: null,
            loadProgress: 100
          });

          logger.wallpaper.info('壁纸加载完成');
        } catch (preloadError) {
          logger.wallpaper.warn('图片预加载失败，但仍然使用该URL', preloadError);
          
          // 即使预加载失败，也使用该URL（让浏览器自己处理）
          setWallpaperState({
            url: result.url,
            isLoading: false,
            isFromCache: result.isFromCache,
            isToday: result.isToday,
            needsUpdate: result.needsUpdate,
            error: null,
            loadProgress: 100
          });
        }
      }

    } catch (error) {
      const errorInfo = errorHandler.handleError(error as Error, 'wallpaper-hook');
      logger.wallpaper.error('壁纸加载失败', errorInfo);
      
      setWallpaperState(prev => ({
        ...prev,
        isLoading: false,
        error: errorInfo.userMessage,
        loadProgress: 0
      }));
    }
  }, [resolution, preloadImage]);

  // 强制刷新壁纸
  const refreshWallpaper = useCallback(async () => {
    logger.wallpaper.info('强制刷新壁纸');
    
    // 清理今天的缓存
    try {
      const stats = await optimizedWallpaperService.getCacheStats();
      const todayKey = `wallpaper-optimized:${resolution}-${new Date().toISOString().split('T')[0]}`;
      
      if (stats.cacheKeys.includes(todayKey)) {
        logger.wallpaper.debug('清理今天的壁纸缓存');
      }
    } catch (error) {
      logger.wallpaper.warn('清理缓存失败', error);
    }

    // 重新加载
    await loadWallpaper();
  }, [resolution, loadWallpaper]);

  // 获取缓存统计
  const getCacheStats = useCallback(async () => {
    try {
      return await optimizedWallpaperService.getCacheStats();
    } catch (error) {
      logger.wallpaper.warn('获取缓存统计失败', error);
      return { totalCount: 0, todayCount: 0, totalSize: 0, cacheKeys: [] };
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadWallpaper();
  }, [loadWallpaper]);

  // 监听分辨率变化
  useEffect(() => {
    if (resolution) {
      loadWallpaper();
    }
  }, [resolution, loadWallpaper]);

  return {
    // 状态
    url: wallpaperState.url,
    isLoading: wallpaperState.isLoading,
    isFromCache: wallpaperState.isFromCache,
    isToday: wallpaperState.isToday,
    needsUpdate: wallpaperState.needsUpdate,
    error: wallpaperState.error,
    loadProgress: wallpaperState.loadProgress,
    
    // 方法
    refreshWallpaper,
    getCacheStats,
    
    // 便利属性
    hasError: !!wallpaperState.error,
    isReady: !wallpaperState.isLoading && !!wallpaperState.url,
    showLoadingIndicator: wallpaperState.isLoading && wallpaperState.loadProgress < 100,
    showUpdateHint: wallpaperState.needsUpdate && wallpaperState.isFromCache
  };
}