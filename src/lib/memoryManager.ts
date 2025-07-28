// 内存管理器 - 管理 Blob URL 生命周期，防止内存泄漏
import { logger } from './logger';

interface BlobUrlInfo {
  url: string;
  size: number;
  createdAt: number;
  category: string;
  refs: number; // 引用计数
}

class MemoryManager {
  private static instance: MemoryManager;
  private blobUrls = new Map<string, BlobUrlInfo>();
  private maxAge = 30 * 60 * 1000; // 30分钟
  private maxTotalSize = 200 * 1024 * 1024; // 200MB
  private cleanupInterval: number;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  constructor() {
    // 定期清理过期的 Blob URL
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 每5分钟清理一次

    // 页面卸载时清理所有 Blob URL
    window.addEventListener('beforeunload', () => {
      this.cleanup(true);
    });

    logger.debug('内存管理器已初始化', {
      maxAge: this.maxAge,
      maxTotalSize: this.maxTotalSize
    });
  }

  // 创建并管理 Blob URL
  createBlobUrl(blob: Blob, category: string = 'general'): string {
    const url = URL.createObjectURL(blob);
    
    const info: BlobUrlInfo = {
      url,
      size: blob.size,
      createdAt: Date.now(),
      category,
      refs: 1
    };

    this.blobUrls.set(url, info);

    logger.debug('创建 Blob URL', {
      category,
      size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      totalUrls: this.blobUrls.size
    });

    // 检查是否需要清理
    this.checkMemoryUsage();

    return url;
  }

  // 增加引用计数
  addRef(url: string): boolean {
    const info = this.blobUrls.get(url);
    if (info) {
      info.refs++;
      logger.debug('增加 Blob URL 引用', { url: url.substring(0, 50), refs: info.refs });
      return true;
    }
    return false;
  }

  // 减少引用计数，当引用为0时释放
  releaseRef(url: string): boolean {
    const info = this.blobUrls.get(url);
    if (info) {
      info.refs--;
      logger.debug('减少 Blob URL 引用', { url: url.substring(0, 50), refs: info.refs });
      
      if (info.refs <= 0) {
        this.revokeBlobUrl(url);
        return true;
      }
    }
    return false;
  }

  // 立即释放 Blob URL
  revokeBlobUrl(url: string): boolean {
    const info = this.blobUrls.get(url);
    if (info) {
      try {
        URL.revokeObjectURL(url);
        this.blobUrls.delete(url);
        
        logger.debug('释放 Blob URL', {
          category: info.category,
          size: `${(info.size / 1024 / 1024).toFixed(2)}MB`,
          age: `${((Date.now() - info.createdAt) / 1000).toFixed(1)}s`,
          totalUrls: this.blobUrls.size
        });
        
        return true;
      } catch (error) {
        logger.warn('释放 Blob URL 失败', { url: url.substring(0, 50), error });
      }
    }
    return false;
  }

  // 检查内存使用情况
  private checkMemoryUsage(): void {
    const stats = this.getStats();
    
    if (stats.totalSize > this.maxTotalSize) {
      logger.warn('内存使用超限，开始清理', {
        currentSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${(this.maxTotalSize / 1024 / 1024).toFixed(2)}MB`
      });
      
      this.cleanup();
    }
  }

  // 清理过期或多余的 Blob URL
  cleanup(forceAll: boolean = false): void {
    const now = Date.now();
    let cleanedCount = 0;
    let cleanedSize = 0;

    // 按创建时间排序，优先清理最旧的
    const sortedUrls = Array.from(this.blobUrls.entries())
      .sort(([, a], [, b]) => a.createdAt - b.createdAt);

    for (const [url, info] of sortedUrls) {
      const age = now - info.createdAt;
      const shouldClean = forceAll || 
                         age > this.maxAge || 
                         (info.refs <= 0 && age > 60000); // 无引用且超过1分钟

      if (shouldClean) {
        if (this.revokeBlobUrl(url)) {
          cleanedCount++;
          cleanedSize += info.size;
        }
      }
    }

    if (cleanedCount > 0) {
      logger.info('内存清理完成', {
        cleanedCount,
        cleanedSize: `${(cleanedSize / 1024 / 1024).toFixed(2)}MB`,
        remainingUrls: this.blobUrls.size,
        forceAll
      });
    }
  }

  // 获取内存使用统计
  getStats(): {
    totalUrls: number;
    totalSize: number;
    byCategory: Record<string, { count: number; size: number }>;
    oldestAge: number;
    averageAge: number;
  } {
    const now = Date.now();
    let totalSize = 0;
    let totalAge = 0;
    let oldestAge = 0;
    const byCategory: Record<string, { count: number; size: number }> = {};

    for (const info of this.blobUrls.values()) {
      totalSize += info.size;
      const age = now - info.createdAt;
      totalAge += age;
      oldestAge = Math.max(oldestAge, age);

      if (!byCategory[info.category]) {
        byCategory[info.category] = { count: 0, size: 0 };
      }
      byCategory[info.category].count++;
      byCategory[info.category].size += info.size;
    }

    return {
      totalUrls: this.blobUrls.size,
      totalSize,
      byCategory,
      oldestAge,
      averageAge: this.blobUrls.size > 0 ? totalAge / this.blobUrls.size : 0
    };
  }

  // 获取特定类别的 URL 列表
  getUrlsByCategory(category: string): string[] {
    return Array.from(this.blobUrls.entries())
      .filter(([, info]) => info.category === category)
      .map(([url]) => url);
  }

  // 清理特定类别的 URL
  cleanupCategory(category: string): number {
    let cleanedCount = 0;
    
    for (const [url, info] of this.blobUrls.entries()) {
      if (info.category === category) {
        if (this.revokeBlobUrl(url)) {
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      logger.info(`清理类别 ${category}`, { cleanedCount });
    }

    return cleanedCount;
  }

  // 销毁管理器
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanup(true);
    logger.info('内存管理器已销毁');
  }
}

// 导出单例实例
export const memoryManager = MemoryManager.getInstance();

// 便利函数
export function createManagedBlobUrl(blob: Blob, category: string = 'general'): string {
  return memoryManager.createBlobUrl(blob, category);
}

export function releaseManagedBlobUrl(url: string): boolean {
  return memoryManager.releaseRef(url);
}

// React Hook 将在单独的文件中实现，避免循环依赖

// 开发环境下暴露到全局对象
if (import.meta.env.DEV) {
  (window as any).memoryManager = memoryManager;
  logger.debug('开发模式：可使用 window.memoryManager 访问内存管理功能');
}