// 自定义壁纸管理器 - 处理用户上传的壁纸
import { indexedDBCache } from './indexedDBCache';
import { memoryManager } from './memoryManager';
import { logger } from './logger';

class CustomWallpaperManager {
  private static instance: CustomWallpaperManager;
  private readonly CUSTOM_WALLPAPER_KEY = 'custom-wallpaper';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  static getInstance(): CustomWallpaperManager {
    if (!CustomWallpaperManager.instance) {
      CustomWallpaperManager.instance = new CustomWallpaperManager();
    }
    return CustomWallpaperManager.instance;
  }

  // 验证文件
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: '仅支持 JPG、PNG、WebP 格式的图片'
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `文件大小不能超过 ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  }

  // 上传并保存自定义壁纸
  async uploadWallpaper(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // 验证文件
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      logger.wallpaper.info('开始上传自定义壁纸', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      });

      // 压缩图片（可选）
      const processedBlob = await this.processImage(file);

      // 保存到 IndexedDB
      await indexedDBCache.set(
        this.CUSTOM_WALLPAPER_KEY,
        processedBlob,
        365 * 24 * 60 * 60 * 1000 // 1年有效期
      );

      // 创建 Blob URL
      const blobUrl = memoryManager.createBlobUrl(processedBlob, 'custom-wallpaper');

      logger.wallpaper.info('自定义壁纸上传成功', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        processedSize: `${(processedBlob.size / 1024 / 1024).toFixed(2)}MB`
      });

      return { success: true, url: blobUrl };

    } catch (error) {
      logger.wallpaper.error('上传自定义壁纸失败', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '上传失败' 
      };
    }
  }

  // 获取自定义壁纸
  async getCustomWallpaper(): Promise<string | null> {
    try {
      const blob = await indexedDBCache.get(this.CUSTOM_WALLPAPER_KEY) as Blob;
      
      if (blob) {
        logger.wallpaper.info('获取自定义壁纸成功');
        return memoryManager.createBlobUrl(blob, 'custom-wallpaper');
      }

      return null;
    } catch (error) {
      logger.wallpaper.warn('获取自定义壁纸失败', error);
      return null;
    }
  }

  // 删除自定义壁纸
  async deleteCustomWallpaper(): Promise<boolean> {
    try {
      await indexedDBCache.delete(this.CUSTOM_WALLPAPER_KEY);
      
      // 清理内存中的 Blob URL
      memoryManager.cleanupCategory('custom-wallpaper');
      
      logger.wallpaper.info('删除自定义壁纸成功');
      return true;
    } catch (error) {
      logger.wallpaper.error('删除自定义壁纸失败', error);
      return false;
    }
  }

  // 检查是否有自定义壁纸
  async hasCustomWallpaper(): Promise<boolean> {
    try {
      const blob = await indexedDBCache.get(this.CUSTOM_WALLPAPER_KEY);
      return !!blob;
    } catch (error) {
      return false;
    }
  }

  // 图片处理（压缩和优化）
  private async processImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // 计算合适的尺寸（最大4K）
          const maxWidth = 3840;
          const maxHeight = 2160;
          
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          // 绘制图片
          ctx?.drawImage(img, 0, 0, width, height);

          // 转换为 Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('图片处理失败'));
              }
            },
            'image/jpeg',
            0.85 // 85% 质量
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 获取自定义壁纸信息
  async getWallpaperInfo(): Promise<{
    exists: boolean;
    size?: number;
    sizeText?: string;
  }> {
    try {
      const blob = await indexedDBCache.get(this.CUSTOM_WALLPAPER_KEY) as Blob;
      
      if (blob) {
        return {
          exists: true,
          size: blob.size,
          sizeText: `${(blob.size / 1024 / 1024).toFixed(2)}MB`
        };
      }

      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }
}

// 导出单例
export const customWallpaperManager = CustomWallpaperManager.getInstance();