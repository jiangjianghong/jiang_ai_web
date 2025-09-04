import { ProxyConfig } from './types';
import { mergeHeaders, transformUrl } from './utils';

/**
 * Special handling for Notion API requests
 */
export function prepareNotionRequest(
  proxyConfig: ProxyConfig,
  url: string,
  options?: RequestInit
): { url: string; options: RequestInit } {
  const headers = new Headers(options?.headers || {});

  // Ensure Notion API version is set
  if (!headers.has('Notion-Version')) {
    headers.set('Notion-Version', '2022-06-28');
  }

  // Ensure content type is set for Notion API
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Create new options with merged headers
  const newOptions: RequestInit = {
    ...options,
    headers: mergeHeaders(proxyConfig, headers),
  };

  return {
    url: transformUrl(proxyConfig, url),
    options: newOptions,
  };
}

/**
 * Special handling for image requests
 */
export function prepareImageRequest(
  proxyConfig: ProxyConfig,
  url: string,
  options?: RequestInit
): { url: string; options: RequestInit } {
  const headers = new Headers(options?.headers || {});

  // Set accept header for images
  if (!headers.has('Accept')) {
    headers.set('Accept', 'image/*');
  }

  // Create new options with merged headers
  const newOptions: RequestInit = {
    ...options,
    headers: mergeHeaders(proxyConfig, headers),
  };

  return {
    url: transformUrl(proxyConfig, url),
    options: newOptions,
  };
}

/**
 * Create a cache key for a request
 */
export function createCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';

  return `${method}:${url}:${body}`;
}

/**
 * Simple in-memory cache for responses
 */
export class ResponseCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a cached response
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();

    if (now - cached.timestamp > this.DEFAULT_TTL) {
      // Expired
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set a cached response
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }
}
