// 壁纸缓存服务 - 使用 Service Worker 和 Cache API 绕过 CORS 限制
class WallpaperCacheService {
  private dbName = 'WallpaperCache';
  private dbVersion = 1;
  private storeName = 'wallpapers';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  // 初始化 IndexedDB
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // 生成缓存键
  private getCacheKey(resolution: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `wallpaper-${resolution}-${today}`;
  }

  // 使用多种方法下载图片（绕过 CORS）
  private async downloadImageAsBlob(url: string): Promise<Blob> {
    console.log('📥 开始下载图片:', url);
    
    // 方法1: 尝试直接fetch（最快，但可能遇到CORS）
    try {
      console.log('� 尝试方法1: 直接fetch');
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'force-cache',
        headers: { 'Accept': 'image/*' }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('✅ 方法1成功:', `${(blob.size / 1024 / 1024).toFixed(2)}MB`);
        return blob;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (directError) {
      console.log('⚠️ 方法1失败:', directError);
    }

    // 方法2: 使用Canvas绕过CORS（如果图片支持crossOrigin）
    try {
      console.log('🎨 尝试方法2: Canvas转换');
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // 等待图片加载
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('图片加载超时'));
        }, 10000);
        
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

      // 创建Canvas并转换
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建Canvas上下文');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // 转换为Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('✅ 方法2成功:', `${(blob.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(blob);
          } else {
            reject(new Error('Canvas转换失败'));
          }
        }, 'image/jpeg', 0.9);
      });
      
      return blob;
    } catch (canvasError) {
      console.log('⚠️ 方法2失败:', canvasError);
    }

    // 方法3: no-cors模式（最后的选择，但可能得到不透明响应）
    try {
      console.log('🔒 尝试方法3: no-cors模式');
      const response = await fetch(url, { 
        mode: 'no-cors',
        cache: 'force-cache'
      });
      
      const blob = await response.blob();
      if (blob && blob.size > 0) {
        console.log('✅ 方法3成功:', `${(blob.size / 1024 / 1024).toFixed(2)}MB`);
        return blob;
      }
      throw new Error('no-cors模式返回空响应');
    } catch (noCorsError) {
      console.log('⚠️ 方法3失败:', noCorsError);
    }

    // 所有方法都失败，抛出错误
    throw new Error('所有下载方法都失败，无法获取图片数据');
  }

  // 保存壁纸到 IndexedDB
  private async saveToCache(key: string, blob: Blob, originalUrl: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const data = {
        key,
        blob,
        originalUrl,
        timestamp: Date.now(),
        size: blob.size
      };
      
      const request = store.put(data);
      request.onsuccess = () => {
        console.log('💾 壁纸已保存到 IndexedDB:', key);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 从 IndexedDB 获取壁纸
  private async getFromCache(key: string): Promise<{ blob: Blob; url: string } | null> {
    if (!this.db) {
      await this.initDB();
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isValidCache(result.timestamp)) {
          console.log('⚡ 从 IndexedDB 获取壁纸:', key);
          const blobUrl = URL.createObjectURL(result.blob);
          resolve({ blob: result.blob, url: blobUrl });
        } else {
          if (result) {
            console.log('🕐 缓存已过期，需要重新下载');
            this.deleteFromCache(key); // 清理过期缓存
          }
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 检查缓存是否有效（24小时）
  private isValidCache(timestamp: number): boolean {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    return (now - timestamp) < oneDay;
  }

  // 删除过期缓存
  private async deleteFromCache(key: string): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        console.log('🗑️ 已删除过期缓存:', key);
        resolve();
      };
      request.onerror = () => resolve(); // 即使删除失败也继续
    });
  }

  // 主要方法：获取壁纸（优先使用缓存）
  async getWallpaper(resolution: string, sourceUrl: string): Promise<string> {
    const cacheKey = this.getCacheKey(resolution);
    
    try {
      console.log('🔍 检查壁纸缓存:', cacheKey);
      
      // 1. 尝试从缓存获取
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        console.log('⚡ 使用缓存的壁纸');
        return cached.url;
      }
      
      console.log('📥 缓存未命中，开始下载壁纸...');
      
      // 2. 下载新壁纸
      const blob = await this.downloadImageAsBlob(sourceUrl);
      const blobUrl = URL.createObjectURL(blob);
      
      // 3. 异步保存到缓存
      this.saveToCache(cacheKey, blob, sourceUrl).catch(error => {
        console.warn('保存壁纸缓存失败:', error);
      });
      
      console.log('✅ 壁纸下载完成并已缓存');
      return blobUrl;
      
    } catch (error) {
      console.error('获取壁纸失败:', error);
      // 回退到原始 URL
      return sourceUrl;
    }
  }

  // 预加载今日壁纸
  async preloadWallpapers(): Promise<void> {
    const wallpapers = [
      { resolution: '4k', url: 'https://bing.img.run/uhd.php' },
      { resolution: '1080p', url: 'https://bing.img.run/1920x1080.php' },
      { resolution: '720p', url: 'https://bing.img.run/1366x768.php' },
      { resolution: 'mobile', url: 'https://bing.img.run/m.php' }
    ];

    console.log('🚀 开始预加载壁纸...');
    
    const results = await Promise.allSettled(
      wallpapers.map(({ resolution, url }) => 
        this.getWallpaper(resolution, url)
      )
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`📷 壁纸预加载完成: ${successful}/${results.length}`);
  }

  // 清理所有过期缓存
  async cleanup(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      // 获取24小时前的时间戳
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(oneDayAgo);
      
      const request = index.openCursor(range);
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🧹 清理完成，删除了 ${deletedCount} 个过期缓存`);
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // 获取缓存统计信息
  async getCacheStats(): Promise<{ count: number; totalSize: number }> {
    if (!this.db) {
      await this.initDB();
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result;
        const count = results.length;
        const totalSize = results.reduce((sum, item) => sum + (item.size || 0), 0);
        
        console.log(`📊 缓存统计: ${count} 个文件, 总大小: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
        resolve({ count, totalSize });
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// 导出单例实例
export const wallpaperCacheService = new WallpaperCacheService();

// 定期清理过期缓存（每小时执行一次）
setInterval(() => {
  wallpaperCacheService.cleanup().catch(console.error);
}, 60 * 60 * 1000);
