// Notion API 客户端

interface NotionPage {
  id: string;
  properties: {
    [key: string]: any;
  };
  url: string;
  created_time: string;
  last_edited_time: string;
}

interface NotionDatabase {
  id: string;
  title: { plain_text: string }[];
  properties: {
    [key: string]: {
      id: string;
      name: string;
      type: string;
    };
  };
}

interface WorkspaceItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  category: string;
  isActive: boolean;
  lastSync: string;
  notionId: string;
  username?: string;
  password?: string;
}

export class NotionClient {
  private apiKey: string;
  private baseUrl = 'https://api.notion.com/v1';
  private corsProxy: string;

  constructor(apiKey: string, corsProxy?: string) {
    this.apiKey = apiKey;
    // 默认使用 Supabase Edge Functions 代理
    this.corsProxy = corsProxy || this.getDefaultSupabaseProxy();
  }

  // 获取默认的 Supabase 代理 URL
  private getDefaultSupabaseProxy(): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/notion-proxy`;
    }
    return ''; // 如果没有配置 Supabase URL，则使用公共代理
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const targetUrl = this.baseUrl + endpoint;

    console.log('🔍 Notion API 请求详情:');
    console.log('- 目标URL:', targetUrl);
    console.log('- 使用智能代理:', !this.corsProxy);
    console.log('- API Key前缀:', this.apiKey.substring(0, 15) + '...');
    console.log('- 请求方法:', options.method || 'GET');

    // 优先使用 Supabase Edge Functions 代理
    if (this.corsProxy) {
      try {
        // 检查是否为 Supabase 代理
        if (this.corsProxy.includes('supabase.co') || this.corsProxy.includes('localhost:54321')) {
          const proxyUrl = this.corsProxy + endpoint;
          console.log('🚀 使用 Supabase Edge Functions 代理:', options.method || 'GET', proxyUrl);
          console.log('🔑 认证头:', this.apiKey.substring(0, 20) + '...');

          const response = await fetch(proxyUrl, {
            method: options.method || 'GET',
            headers: {
              Authorization: this.apiKey.startsWith('Bearer ')
                ? this.apiKey
                : `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28',
            },
            ...(options.body && { body: options.body }),
          });

          console.log('📡 Supabase 代理响应状态:', response.status, response.statusText);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Supabase 代理请求失败:', errorText);

            // 提供更具体的错误信息
            if (response.status === 401) {
              throw new Error('API密钥无效或已过期，请检查配置');
            } else if (response.status === 404) {
              throw new Error('数据库不存在或Integration未被添加到数据库');
            } else {
              throw new Error(`Supabase 代理请求失败: ${response.status} ${response.statusText}`);
            }
          }

          const data = await response.json();
          console.log('✅ Supabase 代理请求成功');
          console.log('📋 返回数据:', data);
          return data;
        }

        // 使用公共CORS代理服务
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        console.log('- 公共代理请求URL:', proxyUrl);

        const response = await fetch(proxyUrl, {
          method: options.method || 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          ...(options.body && { body: options.body }),
        });
        console.log('📡 Vercel代理响应状态:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Vercel代理请求失败:', errorText);

          // 提供更具体的错误信息
          if (response.status === 400) {
            throw new Error('请求格式错误。可能是API密钥格式不正确或数据库ID无效');
          } else if (response.status === 401) {
            throw new Error('API密钥无效或已过期，请检查配置');
          } else if (response.status === 404) {
            throw new Error('数据库不存在或Integration未被添加到数据库');
          } else {
            throw new Error(`Vercel代理请求失败: ${response.status} ${response.statusText}`);
          }
        }

        // 检查响应内容类型
        const contentType = response.headers.get('content-type') || '';
        console.log('响应内容类型:', contentType);

        if (!contentType.includes('application/json')) {
          const text = await response.text();
          console.error('收到非JSON响应:', text.substring(0, 200));
          throw new Error('服务器返回了非JSON响应，可能是认证失败或配置错误');
        }

        const data = await response.json();
        console.log('✅ Vercel代理请求成功');
        return data;
      } catch (error) {
        console.error('❌ 代理请求失败:', error);

        if (error instanceof Error && error.message.includes('Failed to fetch')) {
          throw new Error(
            '无法连接到代理服务器。建议：\n1. 检查网络连接\n2. 尝试关闭代理直连\n3. 使用浏览器CORS插件'
          );
        }

        throw error instanceof Error ? error : new Error(String(error));
      }
    }

    // 使用公共CORS代理服务作为默认方案
    console.log('- 使用公共CORS代理请求URL:', targetUrl);

    try {
      // 尝试多个公共CORS代理服务
      const proxyServices = [
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      ];

      let lastError: Error | null = null;

      for (const proxyUrl of proxyServices) {
        try {
          console.log('🔄 尝试代理服务:', proxyUrl.split('?')[0]);

          const response = await fetch(proxyUrl, {
            method: options.method || 'GET',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28',
            },
            ...(options.body && { body: options.body }),
          });

          console.log('📡 响应状态:', response.status, response.statusText);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Notion API错误详情:');
            console.error('状态码:', response.status);
            console.error('响应内容:', errorText);

            // 提供更具体的错误信息
            if (response.status === 400) {
              throw new Error('请求格式错误。可能是API密钥格式不正确或数据库ID无效');
            } else if (response.status === 401) {
              throw new Error('API密钥无效或已过期，请检查配置');
            } else if (response.status === 404) {
              throw new Error('数据库不存在或Integration未被添加到数据库');
            } else {
              throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
            }
          }

          const data = await response.json();
          console.log('✅ 公共代理请求成功');
          return data;
        } catch (error) {
          console.warn(
            `❌ 代理服务失败: ${proxyUrl.split('?')[0]}`,
            error instanceof Error ? error.message : String(error)
          );
          lastError = error instanceof Error ? error : new Error(String(error));
          continue;
        }
      }

      // 所有代理都失败了
      throw lastError || new Error('所有CORS代理服务都不可用');
    } catch (error) {
      console.error('❌ 公共代理请求失败:', error);

      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error(
          '无法连接到代理服务器。建议：\n1. 检查网络连接\n2. 尝试使用浏览器CORS插件\n3. 稍后重试'
        );
      }

      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  // 获取数据库信息
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    // 清理数据库 ID，确保不包含查询参数
    const cleanId = databaseId.split('?')[0].split('#')[0].trim();
    return await this.makeRequest(`/databases/${cleanId}`);
  }

  // 查询数据库页面（支持分页）
  async queryDatabase(databaseId: string, filter?: any, sorts?: any): Promise<NotionPage[]> {
    // 清理数据库 ID，确保不包含查询参数
    const cleanId = databaseId.split('?')[0].split('#')[0].trim();
    let allResults: NotionPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const body: any = {
        page_size: 100, // 每页最多100条
      };

      if (filter) body.filter = filter;
      if (sorts) body.sorts = sorts;
      if (startCursor) body.start_cursor = startCursor;

      const response = await this.makeRequest(`/databases/${cleanId}/query`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      allResults = allResults.concat(response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return allResults;
  }

  // 将Notion页面转换为工作空间项目
  parseWorkspaceItems(pages: NotionPage[], _databaseProperties?: any): WorkspaceItem[] {
    return pages
      .filter((page) => page && page.properties)
      .map((page) => {
        const properties = page.properties;

        // 尝试从不同属性中提取信息
        const getPropertyValue = (propName: string, fallbackNames: string[] = []) => {
          const allNames = [propName, ...fallbackNames];
          for (const name of allNames) {
            const prop = properties[name];
            if (prop && prop.type) {
              try {
                switch (prop.type) {
                  case 'title':
                    return prop.title?.[0]?.plain_text || '';
                  case 'rich_text':
                    return prop.rich_text?.[0]?.plain_text || '';
                  case 'url':
                    return prop.url || '';
                  case 'select':
                    return prop.select?.name || '';
                  case 'checkbox':
                    return prop.checkbox !== undefined ? prop.checkbox : false;
                  case 'multi_select':
                    return prop.multi_select?.[0]?.name || '';
                  default:
                    return prop.plain_text || prop.name || '';
                }
              } catch (error) {
                console.warn(
                  `解析属性 ${name} 失败:`,
                  error instanceof Error ? error.message : String(error)
                );
                continue;
              }
            }
          }
          return '';
        };

        // 数据清理函数 - 过滤无效值
        const cleanValue = (value: string) => {
          if (!value) return '';
          const cleanedValue = value.trim();
          // 过滤常见的无效值
          if (cleanedValue.toLowerCase() === 'null' || 
              cleanedValue.toLowerCase() === 'undefined' ||
              cleanedValue === '') {
            return '';
          }
          return cleanedValue;
        };

        // 根据新数据库结构映射字段
        const title = getPropertyValue('名称', ['Name', 'Title', '标题']);
        const url = getPropertyValue('网址', ['URL', 'Link', '链接']);
        const description = getPropertyValue('描述', ['Description', '说明', 'Notes']);
        const category = getPropertyValue('Select', ['Category', '分类', '类别', 'Type']);
        const username = cleanValue(getPropertyValue('账号', ['Username', '用户名', 'Account']));
        const password = cleanValue(getPropertyValue('密码', ['Password', 'Pass', 'Pwd']));

        // 调试：输出解析结果
        console.log('🔍 页面解析结果:', {
          pageId: page.id,
          title,
          url,
          description: cleanValue(description),
          category,
          username,
          password: password ? '***' : undefined,
          availableProperties: Object.keys(properties),
        });

        return {
          id: `notion-${page.id}`,
          title: title || 'Untitled',
          url: url || page.url,
          description: cleanValue(description),
          category: category || 'Default',
          isActive: true, // 新数据库中所有项目都是激活的
          lastSync: new Date().toISOString(),
          notionId: page.id,
          icon: this.extractIcon(url),
          username: username || undefined,
          password: password || undefined,
        };
      });
  }

  // 不提取网站图标，使用简单字母图标
  private extractIcon(_url?: string): string {
    return ''; // 不使用外部图标，统一使用字母图标
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/users/me');
      return true;
    } catch {
      return false;
    }
  }
}

// 工作空间数据管理
export class WorkspaceManager {
  private notionClient: NotionClient | null = null;
  private cacheKey = 'workspace-items';
  private configKey = 'workspace-config';

  constructor() {
    this.loadConfig();
  }

  // 配置Notion连接
  configureNotion(apiKey: string, databaseId: string, corsProxy?: string) {
    // 如果没有指定代理，使用默认的 Supabase 代理
    const finalProxy = corsProxy || this.getDefaultSupabaseProxy();
    this.notionClient = new NotionClient(apiKey, finalProxy);

    // 保存配置
    const config = {
      apiKey,
      databaseId,
      corsProxy: finalProxy,
      lastConfigured: new Date().toISOString(),
    };
    localStorage.setItem(this.configKey, JSON.stringify(config));
  }

  // 获取默认的 Supabase 代理 URL
  private getDefaultSupabaseProxy(): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/notion-proxy`;
    }
    return ''; // 如果没有配置 Supabase URL，则使用公共代理
  }

  // 加载配置
  private loadConfig() {
    try {
      const config = localStorage.getItem(this.configKey);
      if (config) {
        const { apiKey, databaseId, corsProxy } = JSON.parse(config);
        if (apiKey && databaseId) {
          // 如果没有保存的代理配置，使用默认的 Supabase 代理
          const finalProxy = corsProxy || this.getDefaultSupabaseProxy();
          this.notionClient = new NotionClient(apiKey, finalProxy);
          return { apiKey, databaseId, corsProxy: finalProxy };
        }
      }
    } catch (error) {
      console.warn('加载工作空间配置失败:', error instanceof Error ? error.message : String(error));
    }
    return null;
  }

  // 获取配置信息
  getConfig() {
    try {
      const config = localStorage.getItem(this.configKey);
      return config ? JSON.parse(config) : null;
    } catch {
      return null;
    }
  }

  // 同步工作空间数据
  async syncWorkspaceData(): Promise<WorkspaceItem[]> {
    if (!this.notionClient) {
      throw new Error('Notion未配置，请先设置API密钥和数据库ID');
    }

    const config = this.getConfig();
    if (!config?.databaseId) {
      throw new Error('未找到数据库ID配置');
    }

    try {
      console.log('🔄 开始同步工作空间数据...');

      // 获取数据库结构
      const database = await this.notionClient.getDatabase(config.databaseId);
      console.log('📊 数据库信息获取成功:', database.title?.[0]?.plain_text || '未知数据库');

      // 查询所有页面
      const pages = await this.notionClient.queryDatabase(config.databaseId);
      console.log(`📄 获取到 ${pages.length} 个页面`);

      // 调试：检查页面数据结构
      if (pages.length > 0) {
        console.log('🔍 第一个页面数据示例:', {
          id: pages[0]?.id,
          hasProperties: !!pages[0]?.properties,
          propertyKeys: pages[0]?.properties ? Object.keys(pages[0].properties) : '无属性',
        });
      }

      // 转换为工作空间项目
      const workspaceItems = this.notionClient.parseWorkspaceItems(pages, database.properties);

      // 缓存数据
      this.cacheWorkspaceItems(workspaceItems);

      console.log(`✅ 同步完成，获取到 ${workspaceItems.length} 个工作空间项目`);
      return workspaceItems;
    } catch (error) {
      console.error('❌ 同步工作空间数据失败:', error);

      // 返回缓存数据作为备用
      const cachedItems = this.getCachedWorkspaceItems();
      if (cachedItems.length > 0) {
        console.warn('⚠️ 使用缓存数据，共 ' + cachedItems.length + ' 个项目');
        return cachedItems;
      }

      throw error;
    }
  }

  // 缓存工作空间项目
  private cacheWorkspaceItems(items: WorkspaceItem[]) {
    try {
      const cacheData = {
        items,
        lastSync: new Date().toISOString(),
        version: '1.0',
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('缓存工作空间数据失败:', error instanceof Error ? error.message : String(error));
    }
  }

  // 获取缓存的工作空间项目
  getCachedWorkspaceItems(): WorkspaceItem[] {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const { items } = JSON.parse(cached);
        return items || [];
      }
    } catch (error) {
      console.warn(
        '读取缓存工作空间数据失败:',
        error instanceof Error ? error.message : String(error)
      );
    }
    return [];
  }

  // 获取缓存信息
  getCacheInfo() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const { lastSync, version } = JSON.parse(cached);
        return { lastSync, version };
      }
    } catch (error) {
      console.warn('读取缓存信息失败:', error instanceof Error ? error.message : String(error));
    }
    return null;
  }

  // 清除配置和缓存
  clearAll() {
    localStorage.removeItem(this.configKey);
    localStorage.removeItem(this.cacheKey);
    this.notionClient = null;
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    if (!this.notionClient) return false;
    return await this.notionClient.testConnection();
  }
}

// 导出单例实例
export const workspaceManager = new WorkspaceManager();
