import { ApiClient } from './ApiClient';
import { NotionApiClient, WorkspaceItem } from './NotionApiClient';
import { CorsProxyService } from '../proxy';

/**
 * Manager for workspace data from Notion
 */
export class WorkspaceManager {
  private notionClient: NotionApiClient | null = null;
  private apiClient: ApiClient;
  private cacheKey = 'workspace-items';
  private configKey = 'workspace-config';

  /**
   * Create a new workspace manager
   * @param proxyService The CORS proxy service to use
   */
  constructor(proxyService: CorsProxyService) {
    this.apiClient = new ApiClient(proxyService);
    this.loadConfig();
  }

  /**
   * Configure the Notion connection
   * @param apiKey The Notion API key
   * @param databaseId The database ID
   */
  configureNotion(apiKey: string, databaseId: string) {
    this.notionClient = new NotionApiClient(this.apiClient, apiKey);

    // Save configuration
    const config = {
      apiKey,
      databaseId,
      lastConfigured: new Date().toISOString(),
    };
    localStorage.setItem(this.configKey, JSON.stringify(config));
  }

  /**
   * Load the configuration from local storage
   */
  private loadConfig() {
    try {
      const config = localStorage.getItem(this.configKey);
      if (config) {
        const { apiKey, databaseId } = JSON.parse(config);
        if (apiKey && databaseId) {
          this.notionClient = new NotionApiClient(this.apiClient, apiKey);
          return { apiKey, databaseId };
        }
      }
    } catch (error) {
      console.warn('加载工作空间配置失败:', error);
    }
    return null;
  }

  /**
   * Get the configuration
   */
  getConfig() {
    try {
      const config = localStorage.getItem(this.configKey);
      return config ? JSON.parse(config) : null;
    } catch {
      return null;
    }
  }

  /**
   * Synchronize workspace data from Notion
   */
  async syncWorkspaceData(): Promise<WorkspaceItem[]> {
    if (!this.notionClient) {
      throw new Error('Notion未配置，请先设置API密钥和数据库ID');
    }

    const config = this.getConfig();
    if (!config?.databaseId) {
      throw new Error('未找到数据库ID配置');
    }

    try {
      // Sync workspace data

      // Get database structure
      // Get database structure
      // const database = await this.notionClient.getDatabase(config.databaseId);

      // Query all pages
      const pages = await this.notionClient.queryDatabase(config.databaseId);

      // Convert to workspace items
      const workspaceItems = this.notionClient.parseWorkspaceItems(pages);

      // Cache data
      this.cacheWorkspaceItems(workspaceItems);

      return workspaceItems;
    } catch (error) {
      console.error('❌ 同步工作空间数据失败:', error);

      // Return cached data as fallback
      const cachedItems = this.getCachedWorkspaceItems();
      if (cachedItems.length > 0) {
        console.warn('⚠️ 使用缓存数据，共 ' + cachedItems.length + ' 个项目');
        return cachedItems;
      }

      throw error;
    }
  }

  /**
   * Cache workspace items
   * @param items The workspace items to cache
   */
  private cacheWorkspaceItems(items: WorkspaceItem[]) {
    try {
      const cacheData = {
        items,
        lastSync: new Date().toISOString(),
        version: '1.0',
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('缓存工作空间数据失败:', error);
    }
  }

  /**
   * Get cached workspace items
   */
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

  /**
   * Get cache information
   */
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

  /**
   * Clear all configuration and cache
   */
  clearAll() {
    localStorage.removeItem(this.configKey);
    localStorage.removeItem(this.cacheKey);
    this.notionClient = null;
  }

  /**
   * Test the connection to Notion
   */
  async testConnection(): Promise<boolean> {
    if (!this.notionClient) return false;
    return await this.notionClient.testConnection();
  }
}
