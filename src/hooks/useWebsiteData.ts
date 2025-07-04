import { useState, useEffect, useCallback } from 'react';
import { WebsiteData } from '@/lib/firebaseSync';
import { mockWebsites } from '@/lib/mockData';
import { StorageManager } from '@/lib/storageManager';

interface UseWebsiteDataOptions {
  enableAutoSync?: boolean;
  syncDelay?: number;
}

interface UseWebsiteDataReturn {
  websites: WebsiteData[];
  setWebsites: (websites: WebsiteData[] | ((prev: WebsiteData[]) => WebsiteData[])) => void;
  addWebsite: (website: Omit<WebsiteData, 'visitCount' | 'lastVisit'>) => void;
  updateWebsite: (id: string, updates: Partial<WebsiteData>) => void;
  deleteWebsite: (id: string) => void;
  exportData: () => Promise<string>;
  importData: (data: any) => Promise<{ success: boolean; message: string; validCount?: number }>;
  isLoading: boolean;
  error: string | null;
}

/**
 * 统一的网站数据管理Hook
 * 处理缓存、同步、导入导出等所有数据操作
 */
export function useWebsiteData(options: UseWebsiteDataOptions = {}): UseWebsiteDataReturn {
  const { enableAutoSync = true, syncDelay = 100 } = options;
  const storage = StorageManager.getInstance();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // 安全的缓存读取函数
  const loadFromCache = useCallback((): WebsiteData[] => {
    try {
      const saved = storage.getItem('websites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 验证数据结构
          const validWebsites = parsed.filter(site => 
            site.id && site.name && site.url
          );
          if (validWebsites.length > 0) {
            // 只在开发环境下显示日志，避免生产环境重复日志
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ 从缓存加载了 ${validWebsites.length} 个网站`);
            }
            return validWebsites;
          }
        }
      }
    } catch (error) {
      console.warn('读取缓存失败:', error);
      setError('读取本地数据失败');
    }
    return mockWebsites;
  }, [storage]);

  // 初始化网站数据
  const [websites, setWebsitesState] = useState<WebsiteData[]>(() => {
    const cached = loadFromCache();
    setIsLoading(false);
    return cached;
  });

  // 安全的缓存写入函数
  const saveToCache = useCallback((data: WebsiteData[]) => {
    try {
      const success = storage.setItem('websites', JSON.stringify(data));
      if (!success) {
        console.warn('保存到缓存失败：用户未同意Cookie使用');
      }
    } catch (error) {
      console.error('保存到缓存失败:', error);
      setError('保存数据失败');
    }
  }, [storage]);

  // 延迟二次检查缓存（解决存储权限问题）
  useEffect(() => {
    if (!enableAutoSync || !isFirstLoad) return;

    const timer = setTimeout(() => {
      const cached = loadFromCache();
      // 只有在数据明显不同时才更新
      if (cached.length !== websites.length || 
          JSON.stringify(cached.map(w => w.id).sort()) !== JSON.stringify(websites.map(w => w.id).sort())) {
        console.log('🔄 延迟检查发现不同的缓存数据，更新显示');
        setWebsitesState(cached);
      }
      setIsFirstLoad(false);
    }, syncDelay);

    return () => clearTimeout(timer);
  }, [enableAutoSync, syncDelay, isFirstLoad, loadFromCache, websites]);

  // 自动保存到缓存
  useEffect(() => {
    if (!isFirstLoad && enableAutoSync) {
      saveToCache(websites);
    }
  }, [websites, saveToCache, enableAutoSync, isFirstLoad]);

  // 设置网站数据的包装函数
  const setWebsites = useCallback((updater: WebsiteData[] | ((prev: WebsiteData[]) => WebsiteData[])) => {
    setError(null); // 清除之前的错误
    setWebsitesState(updater);
  }, []);

  // 添加网站
  const addWebsite = useCallback((website: Omit<WebsiteData, 'visitCount' | 'lastVisit'>) => {
    const newWebsite: WebsiteData = {
      ...website,
      visitCount: 0,
      lastVisit: new Date().toISOString().split('T')[0]
    };
    setWebsites(prev => [...prev, newWebsite]);
  }, [setWebsites]);

  // 更新网站
  const updateWebsite = useCallback((id: string, updates: Partial<WebsiteData>) => {
    setWebsites(prev => 
      prev.map(website => 
        website.id === id ? { ...website, ...updates } : website
      )
    );
  }, [setWebsites]);

  // 删除网站
  const deleteWebsite = useCallback((id: string) => {
    setWebsites(prev => prev.filter(website => website.id !== id));
  }, [setWebsites]);

  // 导出数据
  const exportData = useCallback(async (): Promise<string> => {
    try {
      const exportData = {
        websites,
        settings: {
          cardOpacity: parseFloat(localStorage.getItem('cardOpacity') || '0.1'),
          searchBarOpacity: parseFloat(localStorage.getItem('searchBarOpacity') || '0.1'),
          parallaxEnabled: JSON.parse(localStorage.getItem('parallaxEnabled') || 'true'),
          wallpaperResolution: localStorage.getItem('wallpaperResolution') || '1080p',
          theme: localStorage.getItem('theme') || 'light'
        },
        exportTime: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [websites]);

  // 导入数据
  const importData = useCallback(async (data: any): Promise<{ success: boolean; message: string; validCount?: number }> => {
    try {
      // 验证数据格式
      if (!data.websites || !Array.isArray(data.websites)) {
        return { success: false, message: '无效的数据格式：缺少网站数据' };
      }

      // 验证和清理数据
      const validWebsites = data.websites.filter((site: any) => {
        return site.id && site.name && site.url && 
               typeof site.id === 'string' && 
               typeof site.name === 'string' && 
               typeof site.url === 'string';
      }).map((site: any) => ({
        ...site,
        visitCount: typeof site.visitCount === 'number' ? site.visitCount : 0,
        lastVisit: site.lastVisit || new Date().toISOString().split('T')[0],
        tags: Array.isArray(site.tags) ? site.tags : [],
        note: site.note || ''
      }));

      if (validWebsites.length === 0) {
        return { success: false, message: '导入文件中没有有效的网站数据' };
      }

      // 应用导入的数据
      setWebsites(validWebsites);

      return { 
        success: true, 
        message: `成功导入 ${validWebsites.length} 个网站`,
        validCount: validWebsites.length 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }, [setWebsites]);

  return {
    websites,
    setWebsites,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    exportData,
    importData,
    isLoading,
    error
  };
}
