import { ProxyConfig } from './types';

/**
 * Configuration for proxy services including Supabase Edge Functions
 * These are ordered by priority (lower number = higher priority)
 */
export const proxyConfigs: ProxyConfig[] = [
  // Supabase代理服务（最高优先级）
  {
    name: 'supabase-notion',
    url: getSupabaseNotionProxyUrl(),
    transformRequest: (url) => {
      // 专门处理Notion API的代理
      if (url.includes('api.notion.com')) {
        const supabaseUrl = getSupabaseNotionProxyUrl();
        const notionPath = url.replace('https://api.notion.com/v1', '');
        return `${supabaseUrl}${notionPath}`;
      }
      return url; // 非Notion API直接返回原URL
    },
    supportsBinary: true,
    priority: 0, // 最高优先级
    isSupabaseProxy: true,
  },
  {
    name: 'corsproxy.io',
    url: 'https://corsproxy.io/',
    transformRequest: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    supportsBinary: true,
    priority: 1,
  },
  {
    name: 'allorigins',
    url: 'https://api.allorigins.win/',
    transformRequest: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    supportsBinary: true,
    priority: 2,
  },
  {
    name: 'thingproxy',
    url: 'https://thingproxy.freeboard.io/fetch/',
    transformRequest: (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
    supportsBinary: false,
    priority: 3,
  },
  {
    name: 'cors-anywhere',
    url: 'https://cors-anywhere.herokuapp.com/',
    transformRequest: (url) => `https://cors-anywhere.herokuapp.com/${url}`,
    supportsBinary: true,
    priority: 4, // Lower priority as it requires demo access
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  },
];

/**
 * 获取Supabase Notion代理URL
 */
function getSupabaseNotionProxyUrl(): string {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  return supabaseUrl ? `${supabaseUrl}/functions/v1/notion-proxy` : '';
}

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
  return proxyConfigs.find((config) => config.name === name);
}
