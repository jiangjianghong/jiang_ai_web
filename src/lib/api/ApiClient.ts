import { CorsProxyService, createCacheKey, ResponseCache } from '../proxy';

/**
 * API client that uses the CORS proxy service
 */
export class ApiClient {
  private proxyService: CorsProxyService;
  private cache: ResponseCache;
  
  /**
   * Create a new API client
   * @param proxyService The CORS proxy service to use
   */
  constructor(proxyService: CorsProxyService) {
    this.proxyService = proxyService;
    this.cache = new ResponseCache();
  }
  
  /**
   * Make a GET request
   * @param url The URL to request
   * @param options Request options
   * @param useCache Whether to use the cache
   */
  async get<T>(url: string, options?: RequestInit, useCache = true): Promise<T> {
    const fetchOptions: RequestInit = {
      method: 'GET',
      ...options
    };
    
    // Check cache first if enabled
    if (useCache) {
      const cacheKey = createCacheKey(url, fetchOptions);
      const cached = this.cache.get<T>(cacheKey);
      
      if (cached) {
        return cached;
      }
    }
    
    const response = await this.proxyService.fetch<T>(url, fetchOptions);
    
    if (response.error) {
      throw response.error;
    }
    
    if (!response.data) {
      throw new Error('No data received from proxy');
    }
    
    // Cache the response if enabled
    if (useCache) {
      const cacheKey = createCacheKey(url, fetchOptions);
      this.cache.set(cacheKey, response.data);
    }
    
    return response.data;
  }
  
  /**
   * Make a POST request
   * @param url The URL to request
   * @param data The data to send
   * @param options Request options
   */
  async post<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    const fetchOptions: RequestInit = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      ...options
    };
    
    const response = await this.proxyService.fetch<T>(url, fetchOptions);
    
    if (response.error) {
      throw response.error;
    }
    
    if (!response.data) {
      throw new Error('No data received from proxy');
    }
    
    return response.data;
  }
  
  /**
   * Make a PUT request
   * @param url The URL to request
   * @param data The data to send
   * @param options Request options
   */
  async put<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    const fetchOptions: RequestInit = {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      ...options
    };
    
    const response = await this.proxyService.fetch<T>(url, fetchOptions);
    
    if (response.error) {
      throw response.error;
    }
    
    if (!response.data) {
      throw new Error('No data received from proxy');
    }
    
    return response.data;
  }
  
  /**
   * Make a DELETE request
   * @param url The URL to request
   * @param options Request options
   */
  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const fetchOptions: RequestInit = {
      method: 'DELETE',
      ...options
    };
    
    const response = await this.proxyService.fetch<T>(url, fetchOptions);
    
    if (response.error) {
      throw response.error;
    }
    
    if (!response.data) {
      throw new Error('No data received from proxy');
    }
    
    return response.data;
  }
  
  /**
   * Clear the response cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get the proxy service
   */
  getProxyService(): CorsProxyService {
    return this.proxyService;
  }
}