/**
 * Favicon 处理工具函数
 * 统一管理favicon相关的工具方法，避免代码重复
 */

import { faviconCache } from './faviconCache';

/**
 * 提取域名的辅助函数
 */
export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
};

/**
 * 处理 favicon URL，检测并通过代理访问有 CORS 问题的 URL
 * @param url favicon URL
 * @param originalUrl 网站原始 URL
 * @param faviconUrl 备用的 favicon URL
 * @returns 处理后的 URL
 */
export const processFaviconUrl = (url: string, originalUrl: string, faviconUrl: string): string => {
  // 安全检查：防止对 null/undefined 调用 includes 方法
  if (!url || typeof url !== 'string') {
    console.warn('processFaviconUrl 收到无效参数:', url);
    return faviconUrl; // 返回原始的 faviconUrl 而不是默认图标
  }

  const proxyPrefix = 'https://api.allorigins.win/raw?url=';

  // 检查是否是需要代理的URL
  if (url.includes('favicon.im') && !url.includes('api.allorigins.win')) {
    // 先检查是否已有缓存，如果有缓存则不需要代理
    const cached = faviconCache.getCachedFavicon(originalUrl);

    if (cached) {
      const domain = extractDomain(originalUrl);
      console.log(`📁 已有缓存，跳过代理: ${domain}`);
      return url; // 直接返回原URL，不使用代理
    }

    console.log(`🔄 检测到favicon.im URL，优先尝试代理: ${url}`);
    return proxyPrefix + encodeURIComponent(url);
  }

  return url;
};
