// 智能代理管理器 - 自动选择最快的可用代理
// 针对中国网络环境优化
import { getApiPath } from './pathUtils';
import { logger } from './logger';
import { createTimeoutSignal } from './abortUtils';

interface ProxyConfig {
  name: string;
  url: string;
  priority: number; // 优先级，数字越小越优先
  available: boolean;
  speed: number; // 响应时间，毫秒
  lastCheck: number; // 上次检查时间
}

class SmartProxyManager {
  private proxies: ProxyConfig[] = [
    {
      name: 'allorigins',
      url: 'https://api.allorigins.win/raw',
      priority: 1,
      available: true,
      speed: 0,
      lastCheck: 0
    }
  ];

  // 检测代理可用性和速度
  async checkProxy(proxy: ProxyConfig, testUrl: string = 'https://httpbin.org/get'): Promise<number> {
    const start = Date.now();
    
    try {
      const proxyUrl = this.buildProxyUrl(proxy.url, testUrl);
      const response = await fetch(proxyUrl, { 
        method: 'GET',
        signal: createTimeoutSignal(5000) // 5秒超时
      });
      
      if (response.ok) {
        const speed = Date.now() - start;
        proxy.speed = speed;
        proxy.available = true;
        proxy.lastCheck = Date.now();
        logger.debug(`${proxy.name} 可用，响应时间: ${speed}ms`);
        return speed;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      proxy.available = false;
      proxy.speed = Infinity;
      proxy.lastCheck = Date.now();
      logger.warn(`${proxy.name} 不可用`, error.message);
      return Infinity;
    }
  }

  // 构建代理URL
  private buildProxyUrl(proxyBase: string, targetUrl: string): string {
    if (proxyBase.includes('allorigins.win')) {
      return `${proxyBase}?url=${encodeURIComponent(targetUrl)}`;
    } else if (proxyBase.includes('corsproxy.io')) {
      return `${proxyBase}/?${encodeURIComponent(targetUrl)}`;
    } else {
      // Vercel 和 Supabase 格式
      return `${proxyBase}?url=${encodeURIComponent(targetUrl)}`;
    }
  }

  // 检测所有代理
  async checkAllProxies(testUrl?: string): Promise<void> {
    logger.info('检测所有代理可用性');
    
    const results = await Promise.allSettled(
      this.proxies.map(proxy => this.checkProxy(proxy, testUrl))
    );
    
    // 按速度排序
    this.proxies.sort((a, b) => {
      if (!a.available && !b.available) return 0;
      if (!a.available) return 1;
      if (!b.available) return -1;
      return a.speed - b.speed;
    });
    
    const available = this.proxies.filter(p => p.available);
    logger.info(`代理检测完成: ${available.length}/${this.proxies.length} 可用`);
    
    if (available.length > 0) {
      logger.info(`最快代理: ${available[0].name} (${available[0].speed}ms)`);
    }
  }

  // 获取最佳代理
  getBestProxy(): ProxyConfig | null {
    const available = this.proxies.filter(p => p.available);
    return available.length > 0 ? available[0] : null;
  }

  // 使用最佳可用代理发送请求
  async request(targetUrl: string, options: RequestInit = {}): Promise<Response> {
    const availableProxies = this.proxies.filter(p => p.available);
    
    if (availableProxies.length === 0) {
      throw new Error('没有可用的代理服务器');
    }

    let lastError: Error | null = null;

    // 按优先级尝试每个可用的代理
    for (const proxy of availableProxies) {
      try {
        const proxyUrl = this.buildProxyUrl(proxy.url, targetUrl);
        logger.debug(`使用代理: ${proxy.name}`);

        const response = await fetch(proxyUrl, {
          ...options,
          headers: {
            ...options.headers,
            // 如果是Notion请求，确保传递认证头
            ...(targetUrl.includes('api.notion.com') && options.headers && {
              'Authorization': (options.headers as any)['Authorization'],
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            })
          }
        });

        // 如果请求成功，更新代理状态并返回响应
        if (response.ok) {
          proxy.available = true;
          proxy.lastCheck = Date.now();
          logger.debug(`代理请求成功: ${proxy.name}`);
          return response;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        logger.warn(`代理 ${proxy.name} 失败`, error.message);
        proxy.available = false;
        proxy.lastCheck = Date.now();
        lastError = error;
        continue;
      }
    }

    // 所有代理都失败了
    throw lastError || new Error('所有代理服务器都不可用');
  }

  // 获取代理状态
  getStatus() {
    return {
      proxies: this.proxies.map(p => ({
        name: p.name,
        available: p.available,
        speed: p.speed,
        lastCheck: new Date(p.lastCheck).toLocaleString()
      })),
      bestProxy: this.getBestProxy()?.name || '无'
    };
  }
}

// 导出单例
export const smartProxy = new SmartProxyManager();