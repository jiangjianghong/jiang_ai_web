// Notion API 客户端
import { smartProxy } from './smartProxy';
import { getProxyUrl } from './pathUtils';

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
    this.corsProxy = corsProxy || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const targetUrl = this.baseUrl + endpoint;
    
    console.log('🔍 Notion API 请求详情:');
    console.log('- 目标URL:', targetUrl);
    console.log('- 使用智能代理:', !this.corsProxy);
    console.log('- API Key前缀:', this.apiKey.substring(0, 15) + '...');
    console.log('- 请求方法:', options.method || 'GET');

    // 如果有CORS代理，使用特殊处理
    if (this.corsProxy) {
      try {
        // 优先使用 Supabase Edge Functions（支持所有HTTP方法）
        if (this.corsProxy.includes('supabase.co') || this.corsProxy.includes('localhost:54321')) {
          const proxyUrl = this.corsProxy + endpoint;
          console.log('- Supabase代理请求:', options.method || 'GET', proxyUrl);
          
          const response = await fetch(proxyUrl, {
            method: options.method || 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            ...(options.body && { body: options.body }),
          });
          
          console.log('📡 Supabase代理响应状态:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Supabase代理请求失败:', errorText);
            throw new Error(`Supabase代理请求失败: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('✅ Supabase代理请求成功');
          return data;
        }

        // 对于POST和GET请求，统一使用Vercel代理
        const proxyUrl = getProxyUrl(targetUrl);
        console.log('- Vercel代理请求URL:', proxyUrl);
        
        const response = await fetch(proxyUrl, {
          method: options.method || 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
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
        
        if (error.message.includes('Failed to fetch')) {
          throw new Error('无法连接到代理服务器。建议：\n1. 检查网络连接\n2. 尝试关闭代理直连\n3. 使用浏览器CORS插件');
        }
        
        throw error;
      }
    }

    // 智能代理模式 - 自动选择最佳代理
    console.log('- 智能代理请求URL:', targetUrl);

    try {
      // 使用智能代理管理器
      const response = await smartProxy.request(targetUrl, {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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
        
        throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ 智能代理请求成功');
      return data;
    } catch (error) {
      console.error('❌ 智能代理请求失败:', error);
      
      if (error.message.includes('没有可用的代理')) {
        throw new Error(`所有代理服务器都不可用。

建议解决方案：
1. 🔄 刷新页面重试
2. 检查网络连接
3. 使用浏览器CORS插件作为临时方案

代理状态: ${JSON.stringify(smartProxy.getStatus(), null, 2)}`);
      }
      
      throw error;
    }
  }

  // 获取数据库信息
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    return await this.makeRequest(`/databases/${databaseId}`);
  }

  // 查询数据库页面（支持分页）
  async queryDatabase(databaseId: string, filter?: any, sorts?: any): Promise<NotionPage[]> {
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

      const response = await this.makeRequest(`/databases/${databaseId}/query`, {
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
  parseWorkspaceItems(pages: NotionPage[], databaseProperties: any): WorkspaceItem[] {
    return pages.filter(page => page && page.properties).map(page => {
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
              console.warn(`解析属性 ${name} 失败:`, error);
              continue;
            }
          }
        }
        return '';
      };

      const title = getPropertyValue('Name', ['名称', 'Title', '标题']);
      const url = getPropertyValue('URL', ['网址', 'Link', '链接']);
      const description = getPropertyValue('Description', ['描述', '说明', 'Notes']);
      const category = getPropertyValue('Category', ['分类', '类别', 'Type']);
      const isActive = getPropertyValue('Active', ['激活', '启用', 'Enabled']) || true;
      const username = getPropertyValue('Username', ['账号', '用户名', 'Account']);
      const password = getPropertyValue('Password', ['密码', 'Pass', 'Pwd']);

      return {
        id: `notion-${page.id}`,
        title: title || 'Untitled',
        url: url || page.url,
        description,
        category: category || 'Default',
        isActive: typeof isActive === 'boolean' ? isActive : true,
        lastSync: new Date().toISOString(),
        notionId: page.id,
        icon: this.extractIcon(url),
        username: username || undefined,
        password: password || undefined
      };
    });
  }

  // 不提取网站图标，使用简单字母图标
  private extractIcon(url: string): string {
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
    this.notionClient = new NotionClient(apiKey, corsProxy);
    
    // 保存配置
    const config = {
      apiKey,
      databaseId,
      corsProxy,
      lastConfigured: new Date().toISOString()
    };
    localStorage.setItem(this.configKey, JSON.stringify(config));
  }

  // 加载配置
  private loadConfig() {
    try {
      const config = localStorage.getItem(this.configKey);
      if (config) {
        const { apiKey, databaseId, corsProxy } = JSON.parse(config);
        if (apiKey && databaseId) {
          this.notionClient = new NotionClient(apiKey, corsProxy);
          return { apiKey, databaseId, corsProxy };
        }
      }
    } catch (error) {
      console.warn('加载工作空间配置失败:', error);
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
          propertyKeys: pages[0]?.properties ? Object.keys(pages[0].properties) : '无属性'
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
        version: '1.0'
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('缓存工作空间数据失败:', error);
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
      console.warn('读取缓存工作空间数据失败:', error);
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
      console.warn('读取缓存信息失败:', error);
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