// IndexedDB 缓存管理器 - 专门用于持久化存储图片等大文件
class IndexedDBCache {
  private static instance: IndexedDBCache;
  private db: IDBDatabase | null = null;
  private dbName = 'WallpaperCache';
  private version = 1;
  private storeName = 'images';

  static getInstance(): IndexedDBCache {
    if (!IndexedDBCache.instance) {
      IndexedDBCache.instance = new IndexedDBCache();
    }
    return IndexedDBCache.instance;
  }

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB 打开失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB 初始化成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建存储空间
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('📦 创建 IndexedDB 存储空间');
        }
      };
    });
  }

  // 确保数据库已初始化
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // 格式化文件大小
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }

  // 保存 Blob 到 IndexedDB
  async set(key: string, blob: Blob, ttl: number = 2 * 60 * 60 * 1000): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const data = {
        key,
        blob,
        timestamp: Date.now(),
        ttl,
        size: blob.size,
        type: blob.type,
      };

      const request = store.put(data);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`💾 IndexedDB 保存成功: ${key} (${this.formatSize(blob.size)})`);
          resolve();
        };
        request.onerror = () => {
          console.error('IndexedDB 保存失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB 保存异常:', error);
      throw error;
    }
  }

  // 从 IndexedDB 获取 Blob
  async get(key: string): Promise<Blob | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          // 检查是否过期
          const now = Date.now();
          if (now - result.timestamp > result.ttl) {
            console.log(`🗑️ IndexedDB 缓存已过期，删除: ${key}`);
            // 异步删除过期项，但不等待完成以避免阻塞读取
            this.delete(key).catch((error) => {
              console.warn('删除过期缓存项失败:', error);
            });
            resolve(null);
            return;
          }

          console.log(
            `✅ IndexedDB 缓存命中: ${key} (${this.formatSize(result.size)})`
          );
          resolve(result.blob);
        };

        request.onerror = () => {
          console.error('IndexedDB 读取失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB 读取异常:', error);
      return null;
    }
  }

  // 检查是否存在缓存（不返回数据，只检查存在性和有效性）
  async has(key: string): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(false);
            return;
          }

          // 检查是否过期
          const now = Date.now();
          if (now - result.timestamp > result.ttl) {
            // 异步删除过期项，但不等待完成以避免阻塞检查
            this.delete(key).catch((error) => {
              console.warn('删除过期缓存项失败:', error);
            });
            resolve(false);
            return;
          }

          resolve(true);
        };

        request.onerror = () => {
          resolve(false);
        };
      });
    } catch (error) {
      return false;
    }
  }

  // 删除缓存
  async delete(key: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`🗑️ IndexedDB 删除成功: ${key}`);
          resolve();
        };
        request.onerror = () => {
          console.error('IndexedDB 删除失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB 删除异常:', error);
    }
  }

  // 清理过期缓存
  async cleanup(): Promise<void> {
    try {
      const db = await this.ensureDB();

      // 第一步：收集需要删除的键
      const keysToDelete: string[] = [];
      const now = Date.now();

      const readTransaction = db.transaction([this.storeName], 'readonly');
      const readStore = readTransaction.objectStore(this.storeName);
      const readRequest = readStore.openCursor();

      await new Promise<void>((resolve, reject) => {
        readRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const data = cursor.value;
            if (now - data.timestamp > data.ttl) {
              keysToDelete.push(data.key);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        readRequest.onerror = () => {
          console.error('IndexedDB 读取过期项失败:', readRequest.error);
          reject(readRequest.error);
        };
      });

      // 第二步：批量删除收集到的键
      if (keysToDelete.length > 0) {
        const deleteTransaction = db.transaction([this.storeName], 'readwrite');
        const deleteStore = deleteTransaction.objectStore(this.storeName);

        for (const key of keysToDelete) {
          deleteStore.delete(key);
        }

        await new Promise<void>((resolve, reject) => {
          deleteTransaction.oncomplete = () => {
            console.log(`🧹 IndexedDB 清理完成，删除 ${keysToDelete.length} 个过期缓存`);
            resolve();
          };

          deleteTransaction.onerror = () => {
            console.error('IndexedDB 批量删除失败:', deleteTransaction.error);
            reject(deleteTransaction.error);
          };
        });
      } else {
        console.log('🧹 IndexedDB 清理完成，没有过期缓存需要删除');
      }
    } catch (error) {
      console.error('IndexedDB 清理异常:', error);
    }
  }

  // 获取所有缓存键
  async getAllKeys(): Promise<string[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const keys = request.result as string[];
          resolve(keys);
        };

        request.onerror = () => {
          console.error('IndexedDB 获取所有键失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB 获取所有键异常:', error);
      return [];
    }
  }

  // 获取缓存统计信息
  async getStats(): Promise<{ count: number; totalSize: number }> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();

      let count = 0;
      let totalSize = 0;

      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const data = cursor.value;
            count++;
            totalSize += data.size || 0;
            cursor.continue();
          } else {
            resolve({ count, totalSize });
          }
        };

        request.onerror = () => {
          console.error('IndexedDB 统计失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB 统计异常:', error);
      return { count: 0, totalSize: 0 };
    }
  }
}

export const indexedDBCache = IndexedDBCache.getInstance();
