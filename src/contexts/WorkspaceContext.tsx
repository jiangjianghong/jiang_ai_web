import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { workspaceManager } from '@/lib/notionClient';

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

interface WorkspaceConfig {
  apiKey: string;
  databaseId: string;
  corsProxy?: string;
  lastConfigured: string;
}

// 视图类型
export type ViewType = 'list' | 'card';

// 排序类型
export type SortType = 'title' | 'category' | 'created_time' | 'last_edited';

// 分类信息
interface CategoryInfo {
  name: string;
  count: number;
  icon: string;
}

interface WorkspaceContextType {
  // 基础状态
  isWorkspaceOpen: boolean;
  workspaceItems: WorkspaceItem[];
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  lastSync: string | null;

  // 视图状态
  viewType: ViewType;
  
  // 筛选状态
  selectedCategory: string; // 'all' 或具体分类名
  searchQuery: string;
  searchSuggestions: string[];
  
  // 派生状态
  filteredItems: WorkspaceItem[];
  categories: CategoryInfo[];
  
  // 键盘导航状态
  focusedItemIndex: number;

  // 基础操作
  setIsWorkspaceOpen: (open: boolean) => void;
  syncWorkspaceData: () => Promise<void>;
  configureNotion: (apiKey: string, databaseId: string, corsProxy?: string) => void;
  testConnection: () => Promise<boolean>;
  clearConfiguration: () => void;
  refreshItems: () => Promise<void>;
  getConfiguration: () => WorkspaceConfig | null;
  
  // 视图操作
  setViewType: (type: ViewType) => void;
  
  // 筛选操作
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  
  // 键盘导航操作
  setFocusedItemIndex: (index: number) => void;
  moveFocusUp: () => void;
  moveFocusDown: () => void;
  
  // 工具方法
  openItem: (item: WorkspaceItem) => void;
  copyItemUrl: (item: WorkspaceItem) => Promise<void>;
  copyItemCredentials: (item: WorkspaceItem, type: 'username' | 'password') => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // 基础状态
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // 视图状态
  const [viewType, setViewType] = useState<ViewType>('list');
  
  // 筛选状态
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  
  // 键盘导航状态
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1);

  // 生成分类信息
  const categories: CategoryInfo[] = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    workspaceItems.forEach(item => {
      const category = item.category || 'Default';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const result: CategoryInfo[] = [
      {
        name: 'all',
        count: workspaceItems.length,
        icon: '📁'
      }
    ];

    categoryMap.forEach((count, name) => {
      result.push({
        name,
        count,
        icon: name === '工作链接' ? '🏢' : name === '工具链接' ? '🛠️' : '📄'
      });
    });

    return result;
  }, [workspaceItems]);

  // 过滤后的数据（移除排序）
  const filteredItems = useMemo(() => {
    let filtered = workspaceItems;

    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [workspaceItems, selectedCategory, searchQuery]);

  // 更新搜索建议
  useEffect(() => {
    if (searchQuery.trim()) {
      const suggestions = Array.from(new Set(
        workspaceItems
          .filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(item => item.title)
          .slice(0, 5)
      ));
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, workspaceItems]);

  // 重置焦点当筛选结果变化时
  useEffect(() => {
    setFocusedItemIndex(-1);
  }, [filteredItems]);

  // 初始化时检查配置状态
  useEffect(() => {
    const config = workspaceManager.getConfig();
    setIsConfigured(!!config?.apiKey && !!config?.databaseId);

    // 加载Notion缓存的项目
    const cachedItems = workspaceManager.getCachedWorkspaceItems();
    if (cachedItems.length > 0) {
      setWorkspaceItems(cachedItems);
    }

    // 获取缓存信息
    const cacheInfo = workspaceManager.getCacheInfo();
    setLastSync(cacheInfo?.lastSync || null);
  }, []);

  // 配置Notion连接
  const configureNotion = (apiKey: string, databaseId: string, corsProxy?: string) => {
    try {
      workspaceManager.configureNotion(apiKey, databaseId, corsProxy);
      setIsConfigured(true);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : '配置失败');
      setIsConfigured(false);
    }
  };

  // 同步工作空间数据
  const syncWorkspaceData = async () => {
    if (!isConfigured) {
      setError('请先配置Notion API密钥和数据库ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items = await workspaceManager.syncWorkspaceData();
      setWorkspaceItems(items);
      setLastSync(new Date().toISOString());
      console.log('✅ 工作空间数据同步成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      setError(errorMessage);
      console.error('❌ 工作空间数据同步失败:', errorMessage);

      // 尝试使用缓存数据
      const cachedItems = workspaceManager.getCachedWorkspaceItems();
      if (cachedItems.length > 0) {
        setWorkspaceItems(cachedItems);
        console.warn('使用缓存的工作空间数据');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 测试连接
  const testConnection = async (): Promise<boolean> => {
    if (!isConfigured) return false;

    try {
      const isConnected = await workspaceManager.testConnection();
      if (!isConnected) {
        setError('无法连接到Notion API，请检查API密钥是否正确');
      }
      return isConnected;
    } catch (error) {
      setError('连接测试失败');
      return false;
    }
  };

  // 清除配置
  const clearConfiguration = () => {
    workspaceManager.clearAll();
    setIsConfigured(false);
    setWorkspaceItems([]);
    setError(null);
    setLastSync(null);
  };

  // 刷新项目（重新同步）
  const refreshItems = async () => {
    await syncWorkspaceData();
  };

  // 筛选操作
  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setFocusedItemIndex(-1);
  };

  // 键盘导航操作
  const moveFocusUp = () => {
    setFocusedItemIndex(prev => Math.max(0, prev - 1));
  };

  const moveFocusDown = () => {
    setFocusedItemIndex(prev => Math.min(filteredItems.length - 1, prev + 1));
  };

  // 工具方法
  const openItem = (item: WorkspaceItem) => {
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const copyItemUrl = async (item: WorkspaceItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      console.log('URL 已复制到剪贴板');
    } catch (error) {
      console.error('复制 URL 失败:', error);
    }
  };

  const copyItemCredentials = async (item: WorkspaceItem, type: 'username' | 'password') => {
    try {
      const value = type === 'username' ? item.username : item.password;
      if (value) {
        await navigator.clipboard.writeText(value);
        console.log(`${type === 'username' ? '账号' : '密码'} 已复制到剪贴板`);
      }
    } catch (error) {
      console.error(`复制${type === 'username' ? '账号' : '密码'}失败:`, error);
    }
  };

  const value: WorkspaceContextType = {
    // 基础状态
    isWorkspaceOpen,
    workspaceItems,
    isLoading,
    error,
    isConfigured,
    lastSync,

    // 视图状态
    viewType,
    
    // 筛选状态
    selectedCategory,
    searchQuery,
    searchSuggestions,
    
    // 派生状态
    filteredItems,
    categories,
    
    // 键盘导航状态
    focusedItemIndex,

    // 基础操作
    setIsWorkspaceOpen,
    syncWorkspaceData,
    configureNotion,
    testConnection,
    clearConfiguration,
    refreshItems,
    getConfiguration: () => workspaceManager.getConfig(),
    
    // 视图操作
    setViewType,
    
    // 筛选操作
    setSelectedCategory,
    setSearchQuery,
    clearFilters,
    
    // 键盘导航操作
    setFocusedItemIndex,
    moveFocusUp,
    moveFocusDown,
    
    // 工具方法
    openItem,
    copyItemUrl,
    copyItemCredentials,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

// 导出类型
export type { WorkspaceItem, WorkspaceConfig };
