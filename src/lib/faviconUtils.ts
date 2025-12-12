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
    return faviconUrl; // 返回原始的 faviconUrl 而不是默认图标
  }

  const proxyPrefix = 'https://api.allorigins.win/raw?url=';

  // 1. 如果是 HTTP 协议，尝试升级或代理
  if (url.startsWith('http://')) {
    // 开发环境本地调试不处理
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return url;
    }

    // 如果是 favicon.im 或其他已知支持 HTTPS 的服务，直接升级
    if (url.includes('favicon.im') || url.includes('google.com') || url.includes('duckduckgo.com')) {
      return url.replace('http://', 'https://');
    }

    // 其他 HTTP 链接使用代理，避免混合内容警告
    return proxyPrefix + encodeURIComponent(url);
  }

  // 2. 检查是否是需要代理的URL
  if (url.includes('favicon.im') && !url.includes('api.allorigins.win')) {
    // 先检查是否已有缓存，如果有缓存则不需要代理
    const cached = faviconCache.getCachedFavicon(originalUrl);

    if (cached) {
      return url; // 直接返回原URL，不使用代理
    }

    return proxyPrefix + encodeURIComponent(url);
  }

  return url;
};
