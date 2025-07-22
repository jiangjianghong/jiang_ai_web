import { ProxyConfig } from './types';

/**
 * Configuration for multiple public CORS proxy services
 * These are ordered by priority (lower number = higher priority)
 */
export const proxyConfigs: ProxyConfig[] = [
  {
    name: 'corsproxy.io',
    url: 'https://corsproxy.io/',
    transformRequest: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    supportsBinary: true,
    priority: 1
  },
  {
    name: 'allorigins',
    url: 'https://api.allorigins.win/',
    transformRequest: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    supportsBinary: true,
    priority: 2
  },
  {
    name: 'thingproxy',
    url: 'https://thingproxy.freeboard.io/fetch/',
    transformRequest: (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
    supportsBinary: false,
    priority: 3
  },
  {
    name: 'cors-anywhere',
    url: 'https://cors-anywhere.herokuapp.com/',
    transformRequest: (url) => `https://cors-anywhere.herokuapp.com/${url}`,
    supportsBinary: true,
    priority: 4, // Lower priority as it requires demo access
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  }
];

/**
 * Get proxy configurations sorted by priority
 */
export function getSortedProxyConfigs(): ProxyConfig[] {
  return [...proxyConfigs].sort((a, b) => a.priority - b.priority);
}

/**
 * Get a proxy configuration by name
 */
export function getProxyConfigByName(name: string): ProxyConfig | undefined {
  return proxyConfigs.find(config => config.name === name);
}