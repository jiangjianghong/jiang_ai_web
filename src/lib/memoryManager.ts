// 内存管理器 - 管理 Blob URL 生命周期，防止内存泄漏
import { logger } from './logger';

interface BlobUrlInfo {
  url: string;
  size: number;
  createdAt: number;
  category: string;
  refs: number; // 引用计数
  blobKey: string; // 用于去重的Blob标识
  lastAccessTime: number; // 最后访问时间
}

class MemoryManager {
  private static instance: MemoryManager;
  private blobUrls = new Map<string, BlobUrlInfo>();
  private blobKeyToUrl = new Map<string, string>(); // Blob去重映射
  private maxAge = 30 * 60 * 1000; // 30分钟
  private maxTotalSize = 200 * 1024 * 1024; // 200MB

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  constructor() {
    // 页面卸载时清理所有 Blob URL
    window.addEventListener('beforeunload', () => {
      this.cleanup(true);
    });

    logger.debug('内存管理器已初始化', {
      maxAge: this.maxAge,
      maxTotalSize: this.maxTotalSize
    });
  }

  // 生成Blob的唯一标识（基于大小、类型和内容特征）
  private async generateBlobKey(blob: Blob): Promise<string> {
    try {
      // 读取前1KB用于生成特征
      const sampleSize = Math.min(blob.size, 1024);
      const sample = blob.slice(0, sampleSize);
      const arrayBuffer = await sample.arrayBuffer();
      
      // 简单哈希算法（FNV-1a）
      let hash = 2166136261;
      const bytes = new Uint8Array(arrayBuffer);
      for (let i = 0; i < bytes.length; i++) {
        hash ^= bytes[i];
        hash *= 16777619;
      }
      
      // 组合大小、类型和内容哈希
      return `${blob.size}-${blob.type}-${hash.toString(36)}`;
    } catch (error) {
      // 如果生成失败，使用基本信息
      return `${blob.size}-${blob.type}-${Date.now()}`;
    }
  }

  // 创建并管理 Blob URL（支持去重）
  async createBlobUrl(blob: Blob, category: string = 'general'): Promise<string> {
    // 生成Blob标识
    const blobKey = await this.generateBlobKey(blob);
    
    // 检查是否已存在相同的Blob
    const existingUrl = this.blobKeyToUrl.get(blobKey);
    if (existingUrl && this.blobUrls.has(existingUrl)) {
      // 增加引用计数
      this.addRef(existingUrl);
      logger.debug('复用现有 Blob URL', {
        category,
        blobKey: blobKey.substring(0, 20),
        refs: this.blobUrls.get(existingUrl)!.refs
      });
      return existingUrl;
    }
    
    // 创建新的Blob URL
    const url = URL.createObjectURL(blob);
    
    const info: BlobUrlInfo = {
      url,
      size: blob.size,
      createdAt: Date.now(),
      category,
      refs: 1,
      blobKey,
      lastAccessTime: Date.now()
    };

    this.blobUrls.set(url, info);
    this.blobKeyToUrl.set(blobKey, url);

    logger.debug('创建新 Blob URL', {
      category,
      size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      blobKey: blobKey.substring(0, 20),
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
      info.lastAccessTime = Date.now(); // 更新最后访问时间
      logger.debug('增加 Blob URL 引用', { url: url.substring(0, 50), refs: info.refs });
      return true;
    }
    return false;
  }

  // 标记URL被访问（更新访问时间但不改变引用计数）
  markAccessed(url: string): boolean {
    const info = this.blobUrls.get(url);
    if (info) {
      info.lastAccessTime = Date.now();
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
        
        // 清理去重映射
        this.blobKeyToUrl.delete(info.blobKey);
        
        logger.debug('释放 Blob URL', {
          category: info.category,
          size: `${(info.size / 1024 / 1024).toFixed(2)}MB`,
          age: `${((Date.now() - info.createdAt) / 1000).toFixed(1)}s`,
          blobKey: info.blobKey.substring(0, 20),
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
    
    // 智能清理策略：
    // 1. 强制清理：清理所有
    // 2. 超过最大年龄：清理
    // 3. 无引用且长时间未访问：清理（5分钟）
    // 4. 引用计数为0且创建时间较久：清理（1分钟）

    // 按最后访问时间排序，优先清理最久未访问的
    const sortedUrls = Array.from(this.blobUrls.entries())
      .sort(([, a], [, b]) => a.lastAccessTime - b.lastAccessTime);

    for (const [url, info] of sortedUrls) {
      const age = now - info.createdAt;
      const timeSinceLastAccess = now - info.lastAccessTime;
      
      const shouldClean = forceAll || 
                         age > this.maxAge || // 超过最大年龄
                         (info.refs <= 0 && timeSinceLastAccess > 5 * 60 * 1000) || // 无引用且5分钟未访问
                         (info.refs <= 0 && age > 60 * 1000); // 无引用且创建超过1分钟

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
    this.cleanup(true);
    logger.info('内存管理器已销毁');
  }
}

// 导出单例实例
export const memoryManager = MemoryManager.getInstance();

// 便利函数
export function createManagedBlobUrl(blob: Blob, category: string = 'general'): Promise<string> {
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