// 自定义壁纸管理器 - 处理用户上传的壁纸（支持多个壁纸）
import { indexedDBCache } from './indexedDBCache';
import { memoryManager } from './memoryManager';
import { logger } from './logger';

// 壁纸元数据接口
export interface WallpaperMetadata {
  id: string;
  name: string;
  size: number;
  uploadTime: number;
  width: number;
  height: number;
}

// 壁纸数据接口（包含原图和缩略图）
export interface WallpaperData {
  metadata: WallpaperMetadata;
  thumbnail: Blob; // 缩略图
  fullImage: Blob; // 原图
}

class CustomWallpaperManager {
  private static instance: CustomWallpaperManager;
  private readonly WALLPAPER_PREFIX = 'custom-wallpaper-';
  private readonly WALLPAPER_LIST_KEY = 'custom-wallpaper-list';
  private readonly CURRENT_WALLPAPER_KEY = 'current-custom-wallpaper-id';
  private readonly THUMBNAIL_PREFIX = 'custom-wallpaper-thumb-';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly THUMBNAIL_SIZE = 300; // 缩略图宽度

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
        error: '仅支持 JPG、PNG、WebP 格式的图片',
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `文件大小不能超过 ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  // 生成唯一ID
  private generateId(): string {
    return `wallpaper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 生成缩略图
  private async generateThumbnail(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          const maxWidth = this.THUMBNAIL_SIZE;
          const maxHeight = this.THUMBNAIL_SIZE;

          let { width, height } = img;
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (thumbnailBlob) => {
              if (thumbnailBlob) {
                resolve(thumbnailBlob);
              } else {
                reject(new Error('缩略图生成失败'));
              }
            },
            'image/jpeg',
            0.7 // 70% 质量
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = URL.createObjectURL(blob);
    });
  }

  // 获取图片尺寸（不压缩）
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('图片加载失败'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // 将 File 转换为 Blob（保持原格式）
  private async fileToBlob(file: File): Promise<Blob> {
    return new Blob([await file.arrayBuffer()], { type: file.type });
  }

  // 获取壁纸列表（存储在 localStorage 中，因为是小型 JSON 数据）
  private async getWallpaperList(): Promise<WallpaperMetadata[]> {
    try {
      const listData = localStorage.getItem(this.WALLPAPER_LIST_KEY);
      return listData ? JSON.parse(listData) : [];
    } catch (error) {
      logger.wallpaper.warn('获取壁纸列表失败', error);
      return [];
    }
  }

  // 保存壁纸列表（存储在 localStorage 中，因为是小型 JSON 数据）
  private async saveWallpaperList(list: WallpaperMetadata[]): Promise<void> {
    try {
      localStorage.setItem(this.WALLPAPER_LIST_KEY, JSON.stringify(list));
    } catch (error) {
      logger.wallpaper.error('保存壁纸列表失败', error);
      throw error;
    }
  }

  // 上传并保存自定义壁纸（保存原图）
  async uploadWallpaper(file: File): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // 验证文件
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      logger.wallpaper.info('开始上传自定义壁纸', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
      });

      // 生成唯一ID
      const id = this.generateId();

      // 获取图片尺寸
      const { width, height } = await this.getImageDimensions(file);

      // 保存原图（不压缩）
      const originalBlob = await this.fileToBlob(file);

      // 生成缩略图（从原图生成）
      const thumbnail = await this.generateThumbnail(originalBlob);

      // 创建元数据
      const metadata: WallpaperMetadata = {
        id,
        name: file.name,
        size: originalBlob.size,
        uploadTime: Date.now(),
        width,
        height,
      };

      // 保存原图到 IndexedDB
      await indexedDBCache.set(
        `${this.WALLPAPER_PREFIX}${id}`,
        originalBlob,
        365 * 24 * 60 * 60 * 1000 // 1年有效期
      );

      // 保存缩略图到 IndexedDB
      await indexedDBCache.set(
        `${this.THUMBNAIL_PREFIX}${id}`,
        thumbnail,
        365 * 24 * 60 * 60 * 1000
      );

      // 更新壁纸列表
      const list = await this.getWallpaperList();
      list.push(metadata);
      await this.saveWallpaperList(list);

      // 设置为当前壁纸
      await this.setCurrentWallpaper(id);

      logger.wallpaper.info('自定义壁纸上传成功（保存原图）', {
        id,
        originalSize: `${(originalBlob.size / 1024 / 1024).toFixed(2)}MB`,
        thumbnailSize: `${(thumbnail.size / 1024).toFixed(2)}KB`,
        dimensions: `${width}×${height}`,
      });

      return { success: true, id };
    } catch (error) {
      logger.wallpaper.error('上传自定义壁纸失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  // 获取所有壁纸（带缩略图）
  async getAllWallpapers(): Promise<
    Array<{ metadata: WallpaperMetadata; thumbnailUrl: string; isActive: boolean }>
  > {
    try {
      const list = await this.getWallpaperList();
      const currentId = await this.getCurrentWallpaperId();

      const wallpapers = await Promise.all(
        list.map(async (metadata) => {
          const thumbnail = (await indexedDBCache.get(
            `${this.THUMBNAIL_PREFIX}${metadata.id}`
          )) as Blob;
          const thumbnailUrl = thumbnail
            ? await memoryManager.createBlobUrl(thumbnail, 'custom-wallpaper-thumb')
            : '';

          return {
            metadata,
            thumbnailUrl,
            isActive: metadata.id === currentId,
          };
        })
      );

      return wallpapers;
    } catch (error) {
      logger.wallpaper.error('获取所有壁纸失败', error);
      return [];
    }
  }

  // 获取当前壁纸ID
  async getCurrentWallpaperId(): Promise<string | null> {
    try {
      const id = localStorage.getItem(this.CURRENT_WALLPAPER_KEY);
      return id;
    } catch (error) {
      return null;
    }
  }

  // 设置当前壁纸
  async setCurrentWallpaper(id: string): Promise<boolean> {
    try {
      localStorage.setItem(this.CURRENT_WALLPAPER_KEY, id);
      logger.wallpaper.info('设置当前壁纸', { id });
      return true;
    } catch (error) {
      logger.wallpaper.error('设置当前壁纸失败', error);
      return false;
    }
  }

  // 获取当前自定义壁纸（返回新的Blob URL）
  async getCurrentWallpaper(): Promise<string | null> {
    try {
      const currentId = await this.getCurrentWallpaperId();
      if (!currentId) {
        return null;
      }

      const blob = (await indexedDBCache.get(`${this.WALLPAPER_PREFIX}${currentId}`)) as Blob;

      if (blob) {
        logger.wallpaper.info('获取当前自定义壁纸成功（原图）', { id: currentId });
        // 每次都生成新的 Blob URL，确保刷新后可用
        return await memoryManager.createBlobUrl(blob, 'custom-wallpaper');
      }

      return null;
    } catch (error) {
      logger.wallpaper.warn('获取当前自定义壁纸失败', error);
      return null;
    }
  }

  // 获取指定壁纸的原图URL（用于预览）
  async getWallpaperFullImage(id: string): Promise<string | null> {
    try {
      const blob = (await indexedDBCache.get(`${this.WALLPAPER_PREFIX}${id}`)) as Blob;

      if (blob) {
        logger.wallpaper.info('获取壁纸原图成功', { id });
        return await memoryManager.createBlobUrl(blob, 'custom-wallpaper-preview');
      }

      return null;
    } catch (error) {
      logger.wallpaper.error('获取壁纸原图失败', error);
      return null;
    }
  }

  // 删除指定壁纸
  async deleteWallpaper(id: string): Promise<boolean> {
    try {
      // 从 IndexedDB 删除原图和缩略图
      await indexedDBCache.delete(`${this.WALLPAPER_PREFIX}${id}`);
      await indexedDBCache.delete(`${this.THUMBNAIL_PREFIX}${id}`);

      // 从列表中移除
      const list = await this.getWallpaperList();
      const newList = list.filter((item) => item.id !== id);
      await this.saveWallpaperList(newList);

      // 如果删除的是当前壁纸，清除当前壁纸设置
      const currentId = await this.getCurrentWallpaperId();
      if (currentId === id) {
        localStorage.removeItem(this.CURRENT_WALLPAPER_KEY);
      }

      // 清理内存中的 Blob URL
      memoryManager.cleanupCategory('custom-wallpaper');
      memoryManager.cleanupCategory('custom-wallpaper-thumb');

      logger.wallpaper.info('删除自定义壁纸成功', { id });
      return true;
    } catch (error) {
      logger.wallpaper.error('删除自定义壁纸失败', error);
      return false;
    }
  }

  // 删除所有自定义壁纸
  async deleteAllWallpapers(): Promise<boolean> {
    try {
      const list = await this.getWallpaperList();

      for (const metadata of list) {
        await indexedDBCache.delete(`${this.WALLPAPER_PREFIX}${metadata.id}`);
        await indexedDBCache.delete(`${this.THUMBNAIL_PREFIX}${metadata.id}`);
      }

      await indexedDBCache.delete(this.WALLPAPER_LIST_KEY);
      localStorage.removeItem(this.CURRENT_WALLPAPER_KEY);

      // 清理内存中的 Blob URL
      memoryManager.cleanupCategory('custom-wallpaper');
      memoryManager.cleanupCategory('custom-wallpaper-thumb');

      logger.wallpaper.info('删除所有自定义壁纸成功');
      return true;
    } catch (error) {
      logger.wallpaper.error('删除所有自定义壁纸失败', error);
      return false;
    }
  }

  // 检查是否有自定义壁纸
  async hasCustomWallpaper(): Promise<boolean> {
    try {
      const list = await this.getWallpaperList();
      return list.length > 0;
    } catch (error) {
      return false;
    }
  }

  // 获取壁纸总数
  async getWallpaperCount(): Promise<number> {
    try {
      const list = await this.getWallpaperList();
      return list.length;
    } catch (error) {
      return 0;
    }
  }

  // 下载壁纸
  async downloadWallpaper(id: string): Promise<boolean> {
    try {
      const blob = (await indexedDBCache.get(`${this.WALLPAPER_PREFIX}${id}`)) as Blob;
      const list = await this.getWallpaperList();
      const metadata = list.find((item) => item.id === id);

      if (!blob || !metadata) {
        return false;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = metadata.name || `wallpaper-${id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.wallpaper.info('下载壁纸成功', { id, name: metadata.name });
      return true;
    } catch (error) {
      logger.wallpaper.error('下载壁纸失败', error);
      return false;
    }
  }

  // 获取壁纸信息（兼容旧版本API）
  async getWallpaperInfo(): Promise<{
    exists: boolean;
    count?: number;
    totalSize?: number;
    currentWallpaper?: WallpaperMetadata;
  }> {
    try {
      const list = await this.getWallpaperList();
      const currentId = await this.getCurrentWallpaperId();

      if (list.length === 0) {
        return { exists: false };
      }

      const totalSize = list.reduce((sum, item) => sum + item.size, 0);
      const currentWallpaper = currentId ? list.find((item) => item.id === currentId) : undefined;

      return {
        exists: true,
        count: list.length,
        totalSize,
        currentWallpaper,
      };
    } catch (error) {
      return { exists: false };
    }
  }
}

// 导出单例
export const customWallpaperManager = CustomWallpaperManager.getInstance();
