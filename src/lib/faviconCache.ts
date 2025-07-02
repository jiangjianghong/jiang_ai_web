/**
 * Favicon 缓存管理工具
 * 提供 favicon 的缓存、预加载和错误处理功能
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
  private cacheKey = 'favicon-cache-v1';
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
        // 清理过期缓存
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
   * 获取 favicon 的备用 URL 列表
   */
  private getFaviconUrls(originalUrl: string, domain: string): string[] {
    return [
      originalUrl, // 原始 URL
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://favicon.yandex.net/favicon/v2/${domain}?size=120`,
      `https://${domain}/apple-touch-icon.png`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://${domain}/favicon.ico`
    ];
  }

  /**
   * 尝试加载 favicon
   */
  private async tryLoadFavicon(urls: string[]): Promise<string> {
    for (const url of urls) {
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = url;
        });
        return url; // 成功加载
      } catch {
        continue; // 继续尝试下一个 URL
      }
    }
    
    // 所有 URL 都失败，返回最后一个作为兜底
    return urls[urls.length - 1];
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
   * 异步获取 favicon URL（带缓存）
   */
  async getFavicon(originalUrl: string, faviconUrl: string): Promise<string> {
    const domain = this.extractDomain(originalUrl);
    
    // 检查缓存
    const cached = this.getCachedFavicon(originalUrl);
    if (cached) {
      return cached;
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
   * 加载 favicon 并缓存
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
      // 返回第一个 URL 作为兜底
      return urls[0];
    }
  }

  /**
   * 批量预加载 favicon
   */
  async preloadFavicons(websites: Array<{ url: string; favicon: string }>): Promise<void> {
    const uncachedSites = websites.filter(site => !this.getCachedFavicon(site.url));
    
    if (uncachedSites.length === 0) return;

    // 分批加载，避免同时发起太多请求
    const batchSize = 5;
    for (let i = 0; i < uncachedSites.length; i += batchSize) {
      const batch = uncachedSites.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(site => this.getFavicon(site.url, site.favicon))
      );
    }
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
