import { ProxyConfig, ProxyResponse } from './types';
import { getSortedProxyConfigs } from './config';
import { canProxyHandleBinary, mergeHeaders, transformUrl } from './utils';

/**
 * Service for handling CORS proxy requests with fallback mechanism
 */
export class CorsProxyService {
  private proxyConfigs: ProxyConfig[];
  private workingProxies: Set<string>;
  private failedProxies: Map<string, number>; // proxy name -> timestamp of failure
  private readonly RETRY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Create a new CorsProxyService
   * @param configs Optional proxy configurations (uses default if not provided)
   */
  constructor(configs?: ProxyConfig[]) {
    this.proxyConfigs = configs || getSortedProxyConfigs();
    this.workingProxies = new Set(this.proxyConfigs.map((config) => config.name));
    this.failedProxies = new Map();
  }

  /**
   * Fetch data through a CORS proxy
   * @param url The target URL to fetch
   * @param options Fetch options
   * @returns The response data and metadata
   */
  async fetch<T>(url: string, options?: RequestInit): Promise<ProxyResponse<T>> {
    // Reset failed proxies that have exceeded the retry timeout
    this.resetFailedProxies();

    // Get available proxies sorted by priority
    const availableProxies = this.getAvailableProxies(url);

    if (availableProxies.length === 0) {
      throw new Error('No suitable proxy services available');
    }

    // Try each proxy in order
    return this.tryNextProxy<T>(url, availableProxies, options);
  }

  /**
   * Try to fetch using the next available proxy
   */
  private async tryNextProxy<T>(
    url: string,
    proxies: ProxyConfig[],
    options?: RequestInit,
    attempts = 0
  ): Promise<ProxyResponse<T>> {
    if (attempts >= proxies.length) {
      // All proxies failed
      throw new Error('All proxy services failed');
    }

    const proxy = proxies[attempts];

    try {
      // Log retained for debugging proxy services

      // Transform URL for this proxy
      const proxyUrl = transformUrl(proxy, url);

      // Merge headers
      const headers = mergeHeaders(proxy, options?.headers);

      // Create fetch options
      const fetchOptions: RequestInit = {
        ...options,
        headers,
      };

      // Make the request
      const response = await fetch(proxyUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`Proxy ${proxy.name} returned status ${response.status}`);
      }

      // Parse response based on content type
      const contentType = response.headers.get('content-type') || '';
      let data: T;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.startsWith('image/')) {
        // For binary data like images
        const blob = await response.blob();
        data = blob as unknown as T;
      } else {
        // Default to text
        const text = await response.text();
        data = text as unknown as T;
      }

      // Mark this proxy as working
      this.workingProxies.add(proxy.name);
      this.failedProxies.delete(proxy.name);

      return {
        data,
        error: null,
        source: proxy.name,
      };
    } catch (error) {
      // Log retained for debugging proxy services

      // Mark this proxy as failed
      this.workingProxies.delete(proxy.name);
      this.failedProxies.set(proxy.name, Date.now());

      // Try the next proxy
      return this.tryNextProxy<T>(url, proxies, options, attempts + 1);
    }
  }

  /**
   * Get available proxies that can handle the given URL
   */
  private getAvailableProxies(url: string): ProxyConfig[] {
    return this.proxyConfigs
      .filter((proxy) => this.workingProxies.has(proxy.name))
      .filter((proxy) => canProxyHandleBinary(proxy, url))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Reset failed proxies that have exceeded the retry timeout
   */
  private resetFailedProxies(): void {
    const now = Date.now();

    for (const [proxyName, failureTime] of this.failedProxies.entries()) {
      if (now - failureTime > this.RETRY_TIMEOUT) {
        // Reset this proxy
        this.failedProxies.delete(proxyName);
        this.workingProxies.add(proxyName);
        // Log retained for debugging proxy services
      }
    }
  }

  /**
   * Check if a proxy is currently working
   */
  async isProxyWorking(proxyName: string): Promise<boolean> {
    const proxy = this.proxyConfigs.find((p) => p.name === proxyName);

    if (!proxy) {
      return false;
    }

    try {
      // Use a simple test URL
      const testUrl = 'https://httpbin.org/status/200';
      const proxyUrl = transformUrl(proxy, testUrl);

      const response = await fetch(proxyUrl, {
        method: 'HEAD',
        headers: mergeHeaders(proxy),
      });

      return response.ok;
    } catch (error) {
      // Log retained for debugging proxy services
      return false;
    }
  }

  /**
   * Get the current status of all proxy services
   */
  getProxyStatus(): Record<string, 'working' | 'failed'> {
    const status: Record<string, 'working' | 'failed'> = {};

    for (const proxy of this.proxyConfigs) {
      status[proxy.name] = this.workingProxies.has(proxy.name) ? 'working' : 'failed';
    }

    return status;
  }
}
