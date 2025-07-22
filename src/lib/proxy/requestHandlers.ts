import { ProxyConfig } from './types';
import { prepareImageRequest, prepareNotionRequest } from './apiUtils';
import { isBinaryUrl } from './utils';

/**
 * Prepare a request for a specific API or content type
 */
export function prepareRequest(
  proxyConfig: ProxyConfig,
  url: string,
  options?: RequestInit
): { url: string; options: RequestInit } {
  // Check if this is a Notion API request
  if (url.includes('api.notion.com')) {
    return prepareNotionRequest(proxyConfig, url, options);
  }
  
  // Check if this is an image request
  if (isBinaryUrl(url)) {
    return prepareImageRequest(proxyConfig, url, options);
  }
  
  // Default request preparation
  const headers = new Headers(options?.headers || {});
  
  // Add default headers for JSON API requests
  if (url.includes('/api/') && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Create new options with headers
  const newOptions: RequestInit = {
    ...options,
    headers
  };
  
  return {
    url: proxyConfig.transformRequest ? proxyConfig.transformRequest(url) : `${proxyConfig.url}${url}`,
    options: newOptions
  };
}

/**
 * Process a response based on expected content type
 */
export async function processResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    return await response.json() as T;
  } else if (contentType.startsWith('image/')) {
    return await response.blob() as unknown as T;
  } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
    return await response.text() as unknown as T;
  } else {
    // Try to parse as JSON first, fall back to text
    try {
      return await response.json() as T;
    } catch (e) {
      return await response.text() as unknown as T;
    }
  }
}