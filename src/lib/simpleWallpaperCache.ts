// 简化版壁纸缓存服务 - 专注于稳定性和实用性
class SimpleWallpaperCache {
  private dbName = 'SimpleWallpaperCache';
  private dbVersion = 1;
  private storeName = 'wallpapers';
  private db: IDBDatabase | null = null;
  private initialized = false;

  constructor() {
    this.initDB();
  }

  // 初始化数据库
  private async initDB(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
      
      this.initialized = true;
      console.log('✅ 简化版缓存数据库初始化成功');
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      this.initialized = false;
    }
  }

  // 生成缓存键
  private getCacheKey(resolution: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `simple-wallpaper-${resolution}-${today}`;
  }

  // 检查URL是否可访问
  private async testUrl(url: string): Promise<boolean> {
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('测试超时'));
        }, 5000);
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('图片加载失败'));
        };
        img.src = url;
      });
      return true;
    } catch {
      return false;
    }
  }

  // 保存URL缓存（更可靠的方式）
  private async saveUrlCache(key: string, url: string): Promise<void> {
    if (!this.initialized || !this.db) return;
    
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const data = {
          key,
          url,
          timestamp: Date.now(),
          type: 'url'
        };
        
        const request = store.put(data);
        request.onsuccess = () => {
          console.log('💾 URL缓存保存成功:', key);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('URL缓存保存失败:', error);
    }
  }

  // 获取URL缓存
  private async getUrlCache(key: string): Promise<string | null> {
    if (!this.initialized || !this.db) return null;
    
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (result && this.isValidCache(result.timestamp)) {
        console.log('⚡ URL缓存命中:', key);
        return result.url;
      } else if (result) {
        console.log('🕐 URL缓存已过期');
        this.deleteCache(key);
      }
      
      return null;
    } catch (error) {
      console.warn('获取URL缓存失败:', error);
      return null;
    }
  }

  // 检查缓存是否有效（24小时）
  private isValidCache(timestamp: number): boolean {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    return (now - timestamp) < oneDay;
  }

  // 删除缓存
  private async deleteCache(key: string): Promise<void> {
    if (!this.initialized || !this.db) return;
    
    try {
      await new Promise<void>((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => {
          console.log('🗑️ 缓存已删除:', key);
          resolve();
        };
        request.onerror = () => resolve(); // 即使删除失败也继续
      });
    } catch (error) {
      console.warn('删除缓存失败:', error);
    }
  }

  // 主要方法：获取壁纸
  async getWallpaper(resolution: string, sourceUrl: string): Promise<string> {
    const cacheKey = this.getCacheKey(resolution);
    
    try {
      // 首先等待数据库初始化
      if (!this.initialized) {
        await this.initDB();
      }
      
      console.log('🔍 检查简化版壁纸缓存:', cacheKey);
      
      // 1. 尝试从缓存获取
      const cachedUrl = await this.getUrlCache(cacheKey);
      if (cachedUrl) {
        // 验证缓存的URL是否仍然有效
        const isValid = await this.testUrl(cachedUrl);
        if (isValid) {
          console.log('⚡ 使用有效的缓存URL');
          return cachedUrl;
        } else {
          console.log('❌ 缓存URL已失效，删除缓存');
          await this.deleteCache(cacheKey);
        }
      }
      
      console.log('📥 缓存未命中，验证源URL...');
      
      // 2. 验证源URL是否可用
      const isSourceValid = await this.testUrl(sourceUrl);
      if (isSourceValid) {
        console.log('✅ 源URL验证成功，保存到缓存');
        await this.saveUrlCache(cacheKey, sourceUrl);
        return sourceUrl;
      } else {
        console.warn('❌ 源URL无法访问');
        return sourceUrl; // 即使无法验证也返回，让浏览器自己处理
      }
      
    } catch (error) {
      console.error('获取壁纸失败:', error);
      return sourceUrl; // 出错时返回原始URL
    }
  }

  // 获取缓存统计
  async getCacheStats(): Promise<{ count: number; urls: string[] }> {
    if (!this.initialized || !this.db) {
      return { count: 0, urls: [] };
    }
    
    try {
      const results = await new Promise<any[]>((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const validCaches = results.filter(item => this.isValidCache(item.timestamp));
      console.log(`📊 简化版缓存统计: ${validCaches.length} 个有效缓存`);
      
      return {
        count: validCaches.length,
        urls: validCaches.map(item => item.url)
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return { count: 0, urls: [] };
    }
  }

  // 清理过期缓存
  async cleanup(): Promise<void> {
    if (!this.initialized || !this.db) return;
    
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(oneDayAgo);
      
      const request = index.openCursor(range);
      let deletedCount = 0;
      
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            console.log(`🧹 简化版缓存清理完成，删除了 ${deletedCount} 个过期缓存`);
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }
}

// 导出单例
export const simpleWallpaperCache = new SimpleWallpaperCache();

// 定期清理
setInterval(() => {
  simpleWallpaperCache.cleanup().catch(console.error);
}, 2 * 60 * 60 * 1000); // 每2小时清理一次
