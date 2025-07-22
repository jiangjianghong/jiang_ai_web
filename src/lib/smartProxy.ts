// 智能代理管理器 - 自动选择最快的可用代理
// 针对中国网络环境优化

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
      name: 'Vercel代理',
      url: '/api/proxy',
      priority: 1,
      available: true,
      speed: 0,
      lastCheck: 0
    },
    {
      name: 'Supabase代理', 
      url: 'https://wxheqargopbsrruootyr.supabase.co/functions/v1/universal-proxy',
      priority: 2,
      available: true,
      speed: 0,
      lastCheck: 0
    },
    {
      name: 'AllOrigins代理',
      url: 'https://api.allorigins.win/get',
      priority: 3,
      available: true,
      speed: 0,
      lastCheck: 0
    },
    {
      name: 'CORS Proxy',
      url: 'https://corsproxy.io',
      priority: 4,
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
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      if (response.ok) {
        const speed = Date.now() - start;
        proxy.speed = speed;
        proxy.available = true;
        proxy.lastCheck = Date.now();
        console.log(`✅ ${proxy.name} 可用，响应时间: ${speed}ms`);
        return speed;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      proxy.available = false;
      proxy.speed = Infinity;
      proxy.lastCheck = Date.now();
      console.warn(`❌ ${proxy.name} 不可用:`, error.message);
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
    console.log('🔍 检测所有代理可用性...');
    
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
    console.log(`📊 代理检测完成: ${available.length}/${this.proxies.length} 可用`);
    
    if (available.length > 0) {
      console.log(`🚀 最快代理: ${available[0].name} (${available[0].speed}ms)`);
    }
  }

  // 获取最佳代理
  getBestProxy(): ProxyConfig | null {
    const available = this.proxies.filter(p => p.available);
    return available.length > 0 ? available[0] : null;
  }

  // 使用最佳代理发送请求
  async request(targetUrl: string, options: RequestInit = {}): Promise<Response> {
    // 定期检查代理状态（每5分钟）
    const now = Date.now();
    const shouldCheck = this.proxies.some(p => now - p.lastCheck > 5 * 60 * 1000);
    
    if (shouldCheck) {
      await this.checkAllProxies();
    }

    const proxy = this.getBestProxy();
    if (!proxy) {
      throw new Error('没有可用的代理服务器');
    }

    const proxyUrl = this.buildProxyUrl(proxy.url, targetUrl);
    console.log(`🔄 使用代理: ${proxy.name}`);

    try {
      const response = await fetch(proxyUrl, {
        ...options,
        headers: {
          ...options.headers,
          // 如果是Notion请求，确保传递认证头
          ...(targetUrl.includes('api.notion.com') && options.headers && {
            'Authorization': (options.headers as any)['Authorization'],
            'Content-Type': 'application/json'
          })
        }
      });

      if (!response.ok && proxy.name === 'AllOrigins代理') {
        // AllOrigins 特殊处理
        const data = await response.json();
        if (data.contents) {
          return new Response(data.contents, {
            status: data.status || 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return response;
    } catch (error) {
      // 标记当前代理为不可用，尝试下一个
      proxy.available = false;
      console.warn(`❌ ${proxy.name} 请求失败，尝试下一个代理`);
      
      const nextProxy = this.getBestProxy();
      if (nextProxy && nextProxy !== proxy) {
        return this.request(targetUrl, options);
      }
      
      throw error;
    }
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

// 自动初始化检测
smartProxy.checkAllProxies().catch(console.error);