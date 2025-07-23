/**
 * Favicon 文件缓存管理工具
 * 使用 IndexedDB 缓存真正的图标文件，而非 URL
 */

import { indexedDBCache } from './indexedDBCache';

interface FaviconMetadata {
  domain: string;
  originalUrl: string;
  timestamp: number;
  expiry: number;
  size: number;
  type: string;
}

interface FaviconCacheStorage {
  [domain: string]: FaviconMetadata;
}

class FaviconCacheManager {
  private metadataKey = 'favicon-metadata';
  private defaultExpiry = 7 * 24 * 60 * 60 * 1000; // 7天缓存（减少频繁更新）
  private metadata: FaviconCacheStorage = {};
  private loadingPromises: Map<string, Promise<string>> = new Map();

  constructor() {
    this.loadMetadata();
  }

  /**
   * 从 localStorage 加载元数据
   */
  private loadMetadata(): void {
    try {
      const cached = localStorage.getItem(this.metadataKey);
      if (cached) {
        this.metadata = JSON.parse(cached);
        this.cleanExpiredMetadata();
      }
    } catch (error) {
      console.warn('加载 favicon 元数据失败:', error);
      this.metadata = {};
    }
  }

  /**
   * 保存元数据到 localStorage
   */
  private saveMetadata(): void {
    try {
      localStorage.setItem(this.metadataKey, JSON.stringify(this.metadata));
    } catch (error) {
      console.warn('保存 favicon 元数据失败:', error);
    }
  }

  /**
   * 清理过期的元数据
   */
  private cleanExpiredMetadata(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [domain, item] of Object.entries(this.metadata)) {
      if (now > item.expiry) {
        toDelete.push(domain);
        // 同时清理 IndexedDB 中的文件
        this.deleteFaviconFile(domain).catch(console.warn);
      }
    }

    toDelete.forEach(domain => {
      delete this.metadata[domain];
    });

    if (toDelete.length > 0) {
      this.saveMetadata();
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
   * 生成 favicon 缓存键
   */
  private getFaviconCacheKey(domain: string): string {
    return `favicon-file:${domain}`;
  }

  /**
   * 获取 favicon 的 URL（仅使用 Supabase 服务）
   */
  private getFaviconUrls(originalUrl: string, domain: string): string[] {
    // 获取 Supabase URL（从环境变量）
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
    
    if (!supabaseUrl) {
      console.warn('⚠️ Supabase URL 未配置，无法获取图标');
      return [];
    }

    return [
      // 仅使用 Supabase Favicon 服务
      `${supabaseUrl}/functions/v1/favicon-service?domain=${encodeURIComponent(domain)}&size=64`,
      `${supabaseUrl}/functions/v1/favicon-service?domain=${encodeURIComponent(domain)}&size=32`,
    ];
  }

  /**
   * 下载并缓存 favicon 文件
   */
  private async downloadAndCacheFavicon(urls: string[], domain: string): Promise<string> {
    for (const url of urls) {
      try {
        console.log(`🔄 尝试下载 favicon: ${domain} -> ${url}`);
        
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'image/*,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (compatible; FaviconBot/1.0)'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        
        // 验证是否为有效图片
        if (!blob.type.startsWith('image/') || blob.size < 100) {
          throw new Error('无效的图片文件');
        }

        // 保存到 IndexedDB
        const cacheKey = this.getFaviconCacheKey(domain);
        await indexedDBCache.set(cacheKey, blob, this.defaultExpiry);

        // 保存元数据
        this.metadata[domain] = {
          domain,
          originalUrl: url,
          timestamp: Date.now(),
          expiry: Date.now() + this.defaultExpiry,
          size: blob.size,
          type: blob.type
        };
        this.saveMetadata();

        // 创建 Blob URL
        const blobUrl = URL.createObjectURL(blob);
        console.log(`✅ Favicon 文件缓存成功: ${domain} (${(blob.size / 1024).toFixed(1)}KB)`);
        
        return blobUrl;
      } catch (error) {
        console.log(`❌ Favicon 下载失败: ${domain} -> ${url} (${error})`);
        
        // 如果是代理URL失败，记录并继续尝试直接URL
        if (url.includes('api.allorigins.win')) {
          console.log(`🔄 代理服务失败，将尝试直接访问`);
        }
        continue;
      }
    }
    
    // 所有尝试失败，返回默认图标
    console.log(`🔄 所有 favicon 尝试失败，使用默认图标: ${domain}`);
    return '/icon/icon.jpg';
  }

  /**
   * 从缓存中获取 favicon 文件
   */
  private async getCachedFaviconFile(domain: string): Promise<string | null> {
    try {
      // 检查元数据
      const meta = this.metadata[domain];
      if (!meta || Date.now() > meta.expiry) {
        return null;
      }

      // 从 IndexedDB 获取文件
      const cacheKey = this.getFaviconCacheKey(domain);
      const blob = await indexedDBCache.get(cacheKey);
      
      if (blob) {
        console.log(`📁 使用缓存 favicon 文件: ${domain} (${(blob.size / 1024).toFixed(1)}KB)`);
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.warn(`读取 favicon 缓存失败: ${domain}`, error);
    }
    
    return null;
  }

  /**
   * 删除 favicon 文件缓存
   */
  private async deleteFaviconFile(domain: string): Promise<void> {
    try {
      const cacheKey = this.getFaviconCacheKey(domain);
      await indexedDBCache.delete(cacheKey);
      console.log(`🗑️ 删除过期 favicon 缓存: ${domain}`);
    } catch (error) {
      console.warn(`删除 favicon 缓存失败: ${domain}`, error);
    }
  }

  /**
   * 获取缓存的 favicon URL（同步检查）
   */
  getCachedFavicon(url: string): string | null {
    const domain = this.extractDomain(url);
    const meta = this.metadata[domain];
    
    if (meta && Date.now() < meta.expiry) {
      // 有有效的缓存元数据，返回原始URL表示已缓存
      return meta.originalUrl;
    }
    
    return null;
  }

  /**
   * 异步获取 favicon（文件缓存优先版）
   */
  async getFavicon(originalUrl: string, faviconUrl: string): Promise<string> {
    const domain = this.extractDomain(originalUrl);
    
    // 优先检查文件缓存
    const cached = await this.getCachedFaviconFile(domain);
    if (cached) {
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

    // 开始下载和缓存
    const loadingPromise = this.loadAndCacheFavicon(originalUrl, faviconUrl, domain);
    this.loadingPromises.set(domain, loadingPromise);

    try {
      const result = await loadingPromise;
      return result;
    } finally {
      this.loadingPromises.delete(domain);
    }
  }

  /**
   * 下载并缓存 favicon（简化版）
   */
  private async loadAndCacheFavicon(originalUrl: string, faviconUrl: string, domain: string): Promise<string> {
    const urls = this.getFaviconUrls(faviconUrl, domain);
    
    try {
      const result = await this.downloadAndCacheFavicon(urls, domain);
      return result;
    } catch (error) {
      console.warn(`获取 favicon 失败: ${domain}`, error);
      return '/icon/icon.jpg';
    }
  }

  /**
   * 增强的获取 favicon 方法（使用文件缓存）
   */
  async getFaviconWithIndexedDB(originalUrl: string, faviconUrl: string): Promise<string> {
    return this.getFavicon(originalUrl, faviconUrl);
  }

  /**
   * 文件缓存策略
   */
  async getFaviconWithHybridCache(originalUrl: string, faviconUrl: string): Promise<string> {
    return this.getFavicon(originalUrl, faviconUrl);
  }

  /**
   * 批量缓存 favicon（文件缓存版）
   */
  async batchCacheFaviconsToIndexedDB(websites: Array<{ url: string; favicon: string }>): Promise<void> {
    console.log(`🚀 开始批量文件缓存 ${websites.length} 个 favicon`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    const BATCH_SIZE = 3; // 减少并发数，避免过多网络请求
    
    for (let i = 0; i < websites.length; i += BATCH_SIZE) {
      const batch = websites.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (site, index) => {
        const domain = this.extractDomain(site.url);
        
        try {
          // 检查是否已有文件缓存
          const cached = await this.getCachedFaviconFile(domain);
          if (cached) {
            skipCount++;
            return;
          }
          
          // 添加延迟避免请求过于频繁，减少429错误
          const delay = (index + 1) * 1200; // 增加延迟到1.2秒
          await new Promise(resolve => setTimeout(resolve, delay));
          
          console.log(`🔄 [${i + index + 1}/${websites.length}] 处理: ${domain}`);
          
          const result = await this.getFavicon(site.url, site.favicon);
          if (result && result !== '/icon/icon.jpg') {
            successCount++;
            console.log(`✅ 文件缓存成功: ${domain}`);
          } else {
            errorCount++;
          }
          
        } catch (error) {
          errorCount++;
          console.warn(`❌ 批量文件缓存失败: ${domain}`, error);
        }
      });
      
      await Promise.allSettled(promises);
      
      // 批次间停顿
      if (i + BATCH_SIZE < websites.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    console.log(`✅ 批量 favicon 文件缓存完成:`);
    console.log(`   成功: ${successCount}, 跳过: ${skipCount}, 失败: ${errorCount}`);
  }

  /**
   * 清理所有缓存
   */
  async clearCache(): Promise<void> {
    // 清理所有文件缓存
    for (const domain of Object.keys(this.metadata)) {
      await this.deleteFaviconFile(domain);
    }
    
    this.metadata = {};
    this.loadingPromises.clear();
    
    try {
      localStorage.removeItem(this.metadataKey);
    } catch (error) {
      console.warn('清理 favicon 缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { total: number; expired: number; totalSize: string } {
    const now = Date.now();
    const total = Object.keys(this.metadata).length;
    const expired = Object.values(this.metadata).filter(item => now > item.expiry).length;
    
    const totalSize = Object.values(this.metadata)
      .reduce((sum, item) => sum + (item.size || 0), 0);
    
    const sizeStr = totalSize > 1024 * 1024 
      ? `${(totalSize / 1024 / 1024).toFixed(1)} MB`
      : `${(totalSize / 1024).toFixed(1)} KB`;

    return { total, expired, totalSize: sizeStr };
  }
}

// 导出单例实例
export const faviconCache = new FaviconCacheManager();