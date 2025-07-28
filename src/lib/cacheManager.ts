import { indexedDBCache } from './indexedDBCache';

// 轻量级缓存工具
class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number; lastAccessed: number }>();
  private readonly MAX_CACHE_SIZE = 100; // 最大缓存项数量
  private readonly MAX_MEMORY_SIZE = 50 * 1024 * 1024; // 50MB内存限制

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // 估算数据大小（字节）
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // 粗略估算（UTF-16）
    } catch {
      return 1024; // 默认1KB
    }
  }

  // 获取当前内存使用量
  private getCurrentMemoryUsage(): number {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += this.estimateSize(item.data);
    }
    return totalSize;
  }

  // LRU淘汰策略
  private evictLRU(): void {
    if (this.cache.size === 0) return;
    
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ LRU淘汰缓存项: ${oldestKey}`);
    }
  }

  // 容量控制
  private enforceCapacityLimits(): void {
    // 检查数量限制
    while (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU();
    }
    
    // 检查内存限制
    while (this.getCurrentMemoryUsage() > this.MAX_MEMORY_SIZE && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  // 设置缓存
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    const now = Date.now();
    
    // 先执行容量控制
    this.enforceCapacityLimits();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      lastAccessed: now
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

    // 更新访问时间（LRU策略）
    item.lastAccessed = now;

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


// 注意：壁纸缓存功能已迁移到 optimizedWallpaperService.ts
// 这里只保留基础的内存缓存管理器

