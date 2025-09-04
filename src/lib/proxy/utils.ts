import { ProxyConfig } from './types';

/**
 * Check if a URL is for binary content (images, etc.)
 */
export function isBinaryUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const lowerUrl = url.toLowerCase();

  return (
    imageExtensions.some((ext) => lowerUrl.includes(ext)) ||
    lowerUrl.includes('favicon.im') ||
    lowerUrl.includes('bing.img.run')
  );
}

/**
 * Merge headers with proxy-specific headers
 */
export function mergeHeaders(proxyConfig: ProxyConfig, userHeaders?: HeadersInit): Headers {
  const headers = new Headers(userHeaders || {});

  // Add proxy-specific headers
  if (proxyConfig.headers) {
    Object.entries(proxyConfig.headers).forEach(([key, value]) => {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    });
  }

  return headers;
}

/**
 * Transform a URL for a specific proxy service
 */
export function transformUrl(proxyConfig: ProxyConfig, url: string): string {
  if (proxyConfig.transformRequest) {
    return proxyConfig.transformRequest(url);
  }

  // Default transformation if none provided
  return `${proxyConfig.url}${url}`;
}

/**
 * Check if a proxy service supports binary content
 */
export function canProxyHandleBinary(proxyConfig: ProxyConfig, url: string): boolean {
  if (!isBinaryUrl(url)) {
    return true; // Not binary content, so any proxy can handle it
  }

  return proxyConfig.supportsBinary === true;
}
