import { ApiClient } from './ApiClient';

/**
 * Interface for Notion page objects
 */
export interface NotionPage {
  id: string;
  properties: {
    [key: string]: any;
  };
  url: string;
  created_time: string;
  last_edited_time: string;
}

/**
 * Interface for Notion database objects
 */
export interface NotionDatabase {
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

/**
 * Interface for workspace items
 */
export interface WorkspaceItem {
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

/**
 * Client for interacting with the Notion API
 */
export class NotionApiClient {
  private apiKey: string;
  private baseUrl = 'https://api.notion.com/v1';

  /**
   * Create a new Notion API client
   * @param apiKey The Notion API key
   */
  constructor(_apiClient: ApiClient, apiKey: string) {
    // apiClient parameter kept for compatibility but not used
    this.apiKey = apiKey;
  }

  /**
   * Make a request to the Notion API
   * @param endpoint The API endpoint
   * @param options Request options
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const targetUrl = this.baseUrl + endpoint;

    // Add Notion-specific headers
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.apiKey}`);
    headers.set('Content-Type', 'application/json');
    headers.set('Notion-Version', '2022-06-28');

    // Create new options with headers
    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      // 尝试多个公共CORS代理服务
      const proxyServices = [
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      ];

      let lastError: Error | null = null;

      for (const proxyUrl of proxyServices) {
        try {
          const response = await fetch(proxyUrl, requestOptions);

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
          return data;
        } catch (error) {
          console.warn(
            `❌ 代理服务失败: ${proxyUrl.split('?')[0]}`,
            error instanceof Error ? error.message : error
          );
          lastError = error instanceof Error ? error : new Error(String(error));
          continue;
        }
      }

      // 所有代理都失败了
      throw lastError || new Error('所有CORS代理服务都不可用');
    } catch (error) {
      console.error('❌ Notion API 请求失败:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          throw new Error('请求格式错误。可能是API密钥格式不正确或数据库ID无效');
        } else if (error.message.includes('401')) {
          throw new Error('API密钥无效或已过期，请检查配置');
        } else if (error.message.includes('404')) {
          throw new Error('数据库不存在或Integration未被添加到数据库');
        }
      }

      throw error;
    }
  }

  /**
   * Get information about a database
   * @param databaseId The database ID
   */
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    return await this.makeRequest<NotionDatabase>(`/databases/${databaseId}`);
  }

  /**
   * Query a database
   * @param databaseId The database ID
   * @param filter Optional filter
   * @param sorts Optional sorts
   */
  async queryDatabase(databaseId: string, filter?: any, sorts?: any): Promise<NotionPage[]> {
    let allResults: NotionPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const body: any = {
        page_size: 100, // Maximum 100 per page
      };

      if (filter) body.filter = filter;
      if (sorts) body.sorts = sorts;
      if (startCursor) body.start_cursor = startCursor;

      const response = await this.makeRequest<any>(`/databases/${databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      allResults = allResults.concat(response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return allResults;
  }

  /**
   * Convert Notion pages to workspace items
   * @param pages The Notion pages
   */
  parseWorkspaceItems(pages: NotionPage[]): WorkspaceItem[] {
    return pages
      .filter((page) => page && page.properties)
      .map((page) => {
        const properties = page.properties;

        // Try to extract information from different properties
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
                  case 'created_time':
                    return prop.created_time || '';
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

        return {
          id: `notion-${page.id}`,
          title: title || 'Untitled',
          url: url || page.url,
          description: cleanValue(description),
          category: category || 'Default',
          isActive: true, // 新数据库中所有项目都是激活的
          lastSync: new Date().toISOString(),
          notionId: page.id,
          icon: this.extractIcon(),
          username: username || undefined,
          password: password || undefined,
        };
      });
  }

  /**
   * Extract an icon from a URL
   * @param url The URL
   */
  private extractIcon(): string {
    return ''; // Don't use external icons, use letter icons instead
  }

  /**
   * Test the connection to the Notion API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest<any>('/users/me');
      return true;
    } catch {
      return false;
    }
  }
}
