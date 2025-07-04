/**
 * Favicon 缓存管理工具（简化版）
 * 提供简单可靠的 favicon 缓存功能
 */

interface FaviconCacheItem {
  url: string;
  cachedUrl: string;
  timestamp: number;
  expiry: number;
}

interface FaviconCacheStorage {
  [domain: string]: FaviconCacheItem;
}

class FaviconCacheManager {
  private cacheKey = 'favicon-cache-simple';
  private defaultExpiry = 7 * 24 * 60 * 60 * 1000; // 7天缓存
  private cache: FaviconCacheStorage = {};
  private loadingPromises: Map<string, Promise<string>> = new Map();

  constructor() {
    this.loadCache();
  }

  /**
   * 从 localStorage 加载缓存
   */
  private loadCache(): void {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        this.cache = JSON.parse(cached);
        this.cleanExpiredCache();
      }
    } catch (error) {
      console.warn('加载 favicon 缓存失败:', error);
      this.cache = {};
    }
  }

  /**
   * 保存缓存到 localStorage
   */
  private saveCache(): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('保存 favicon 缓存失败:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [domain, item] of Object.entries(this.cache)) {
      if (now > item.expiry) {
        toDelete.push(domain);
      }
    }

    toDelete.forEach(domain => {
      delete this.cache[domain];
    });

    if (toDelete.length > 0) {
      this.saveCache();
    }
  }

  /**
   * 从 URL 提取域名
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
  }

  /**
   * 获取 favicon 的备用 URL 列表（简化版）
   */
  private getFaviconUrls(originalUrl: string, domain: string): string[] {
    return [
      originalUrl, // 原始 URL
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://${domain}/favicon.ico`,
      '/icon/icon.jpg' // 默认兜底图标
    ];
  }

  /**
   * 尝试加载 favicon（网络优化版）
   */
  private async tryLoadFavicon(urls: string[]): Promise<string> {
    for (const url of urls) {
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = url;
          // 缩短超时时间到1秒，快速失败
          setTimeout(() => reject(new Error('超时')), 1000);
        });
        console.log(`✅ Favicon 加载成功: ${url}`);
        return url;
      } catch (error) {
        console.log(`❌ Favicon 加载失败: ${url} (${error})`);
        continue;
      }
    }
    
    // 返回默认图标
    console.log(`🔄 所有 favicon 尝试失败，使用默认图标`);
    return '/icon/icon.jpg';
  }

  /**
   * 获取缓存的 favicon URL
   */
  getCachedFavicon(url: string): string | null {
    const domain = this.extractDomain(url);
    const cached = this.cache[domain];
    
    if (cached && Date.now() < cached.expiry) {
      return cached.cachedUrl;
    }
    
    return null;
  }

  /**
   * 异步获取 favicon URL（离线优先版）
   */
  async getFavicon(originalUrl: string, faviconUrl: string): Promise<string> {
    const domain = this.extractDomain(originalUrl);
    
    // 优先检查缓存
    const cached = this.getCachedFavicon(originalUrl);
    if (cached) {
      console.log(`📁 使用缓存 favicon: ${domain} -> ${cached}`);
      return cached;
    }

    // 如果网络不可用，直接返回默认图标
    if (!navigator.onLine) {
      console.log(`🔌 网络不可用，使用默认图标: ${domain}`);
      return '/icon/icon.jpg';
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(domain)) {
      return this.loadingPromises.get(domain)!;
    }

    // 开始加载
    const loadingPromise = this.loadFavicon(originalUrl, faviconUrl, domain);
    this.loadingPromises.set(domain, loadingPromise);

    try {
      const result = await loadingPromise;
      return result;
    } finally {
      this.loadingPromises.delete(domain);
    }
  }

  /**
   * 加载 favicon 并缓存（简化版）
   */
  private async loadFavicon(originalUrl: string, faviconUrl: string, domain: string): Promise<string> {
    const urls = this.getFaviconUrls(faviconUrl, domain);
    
    try {
      const workingUrl = await this.tryLoadFavicon(urls);
      
      // 缓存成功的 URL
      this.cache[domain] = {
        url: originalUrl,
        cachedUrl: workingUrl,
        timestamp: Date.now(),
        expiry: Date.now() + this.defaultExpiry
      };
      
      this.saveCache();
      return workingUrl;
    } catch (error) {
      console.warn(`获取 favicon 失败: ${domain}`, error);
      // 返回默认图标
      return '/icon/icon.jpg';
    }
  }

  /**
   * 增强的获取 favicon 方法（简化版）
   */
  async getFaviconWithIndexedDB(originalUrl: string, faviconUrl: string): Promise<string> {
    // 直接使用简化版的获取方法
    return this.getFavicon(originalUrl, faviconUrl);
  }

  /**
   * 混合缓存策略（简化版）
   */
  async getFaviconWithHybridCache(originalUrl: string, faviconUrl: string): Promise<string> {
    // 直接使用简化版的获取方法
    return this.getFavicon(originalUrl, faviconUrl);
  }

  /**
   * 批量缓存 favicon（简化版）
   */
  async batchCacheFaviconsToIndexedDB(websites: Array<{ url: string; favicon: string }>): Promise<void> {
    console.log(`🚀 开始简单批量缓存 ${websites.length} 个 favicon`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    const BATCH_SIZE = 2;
    
    for (let i = 0; i < websites.length; i += BATCH_SIZE) {
      const batch = websites.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (site, index) => {
        const domain = this.extractDomain(site.url);
        
        try {
          // 检查是否已缓存
          const cached = this.getCachedFavicon(site.url);
          if (cached) {
            skipCount++;
            return;
          }
          
          // 添加延迟
          const delay = (index + 1) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          console.log(`🔄 [${i + index + 1}/${websites.length}] 处理: ${domain}`);
          
          const result = await this.getFavicon(site.url, site.favicon);
          if (result) {
            successCount++;
            console.log(`✅ 缓存成功: ${domain}`);
          } else {
            errorCount++;
          }
          
        } catch (error) {
          errorCount++;
          console.warn(`❌ 批量缓存失败: ${domain}`, error);
        }
      });
      
      await Promise.allSettled(promises);
      
      // 批次间停顿
      if (i + BATCH_SIZE < websites.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ 简单批量 favicon 缓存完成:`);
    console.log(`   成功: ${successCount}, 跳过: ${skipCount}, 失败: ${errorCount}`);
  }

  /**
   * 清理所有缓存
   */
  clearCache(): void {
    this.cache = {};
    this.loadingPromises.clear();
    
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.warn('清理 favicon 缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { total: number; expired: number; size: string } {
    const now = Date.now();
    const total = Object.keys(this.cache).length;
    const expired = Object.values(this.cache).filter(item => now > item.expiry).length;
    
    let size = '0 KB';
    try {
      const sizeBytes = new Blob([JSON.stringify(this.cache)]).size;
      size = `${(sizeBytes / 1024).toFixed(1)} KB`;
    } catch {
      // ignore
    }

    return { total, expired, size };
  }
}

// 导出单例实例
export const faviconCache = new FaviconCacheManager();
