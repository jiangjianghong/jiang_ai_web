import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { workspaceManager, WorkspaceManager } from '@/lib/notionClient';

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

interface WorkspaceContextType {
  // 状态
  isWorkspaceOpen: boolean;
  workspaceItems: WorkspaceItem[];
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  lastSync: string | null;

  // 操作
  setIsWorkspaceOpen: (open: boolean) => void;
  syncWorkspaceData: () => Promise<void>;
  configureNotion: (apiKey: string, databaseId: string, corsProxy?: string) => void;
  testConnection: () => Promise<boolean>;
  clearConfiguration: () => void;
  refreshItems: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [hasAutoSynced, setHasAutoSynced] = useState(false);

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
      setHasAutoSynced(false); // 重置，允许下次自动同步
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

  // 移除自动同步，改为手动触发
  // useEffect(() => {
  //   if (isWorkspaceOpen && isConfigured && workspaceItems.length === 0 && !isLoading && !error && !hasAutoSynced) {
  //     console.log('🎯 触发自动同步');
  //     setHasAutoSynced(true);
  //     syncWorkspaceData();
  //   }
  // }, [isWorkspaceOpen, isConfigured, hasAutoSynced]);

  const value: WorkspaceContextType = {
    // 状态
    isWorkspaceOpen,
    workspaceItems,
    isLoading,
    error,
    isConfigured,
    lastSync,

    // 操作
    setIsWorkspaceOpen,
    syncWorkspaceData,
    configureNotion,
    testConnection,
    clearConfiguration,
    refreshItems,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
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