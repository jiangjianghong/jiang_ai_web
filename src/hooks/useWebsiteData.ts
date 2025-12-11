import { useState, useEffect, useCallback } from 'react';
import { WebsiteData, mergeWebsiteData } from '@/lib/supabaseSync';
// import { mockWebsites } from '@/lib/mockData'; // 已删除
import { StorageManager } from '@/lib/storageManager';

interface UseWebsiteDataOptions {
  enableAutoSync?: boolean;
  syncDelay?: number;
}

interface UseWebsiteDataReturn {
  websites: WebsiteData[];
  allWebsites?: WebsiteData[]; // 包含已删除的数据
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

  // 严格的数据验证函数
  const validateWebsiteData = useCallback((website: any): website is WebsiteData => {
    if (!website) return false;
    if (!website.id || typeof website.id !== 'string') return false;
    if (!website.name || typeof website.name !== 'string') return false;
    if (!website.url || typeof website.url !== 'string') return false;

    // URL 格式验证
    try {
      new URL(website.url);
    } catch (e) {
      return false;
    }

    return true;
  }, []);

  // 安全的缓存读取函数
  const loadFromCache = useCallback((): WebsiteData[] => {
    try {
      const saved = storage.getItem('websites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 过滤掉已删除的网站用于显示，但保留在数据中用于同步
          // 注意：这里我们返回所有有效的网站数据，在UI层或者setWebsites时再决定是否过滤显示
          // 为了保持向后兼容，loadFromCache 返回所有数据
          const validWebsites = parsed.filter(validateWebsiteData);
          if (validWebsites.length > 0) {
            // 只在开发环境下显示日志，避免生产环境重复日志
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ 从缓存加载了 ${validWebsites.length} 个网站数据`);
            }
            return validWebsites;
          }
        }
      }
    } catch (error) {
      console.warn('读取缓存失败:', error);
      setError('读取本地数据失败');
    }
    return []; // 使用空数组替代mockWebsites
  }, [storage]);

  // 初始化网站数据
  const [websites, setWebsitesState] = useState<WebsiteData[]>(() => {
    const cached = loadFromCache();
    setIsLoading(false);
    return cached;
  });

  // 安全的缓存写入函数
  const saveToCache = useCallback(
    (data: WebsiteData[]) => {
      try {
        const success = storage.setItem('websites', JSON.stringify(data));
        if (!success) {
          console.warn('保存到缓存失败：用户未同意Cookie使用');
        }
      } catch (error) {
        console.error('保存到缓存失败:', error);
        setError('保存数据失败');
      }
    },
    [storage]
  );

  // 延迟二次检查缓存（解决存储权限问题）
  useEffect(() => {
    if (!enableAutoSync || !isFirstLoad) return;

    const timer = setTimeout(() => {
      const cached = loadFromCache();
      // 只有在数据明显不同时才更新
      if (
        cached.length !== websites.length ||
        JSON.stringify(cached.map((w) => w.id).sort()) !==
        JSON.stringify(websites.map((w) => w.id).sort())
      ) {
        console.log('🔄 延迟检查发现不同的缓存数据，更新显示');
        setWebsitesState(cached);
      }
      setIsFirstLoad(false);
    }, syncDelay);

    return () => clearTimeout(timer);
  }, [enableAutoSync, syncDelay, isFirstLoad, loadFromCache]); // 移除websites依赖避免循环

  // 自动保存到缓存
  useEffect(() => {
    if (!isFirstLoad && enableAutoSync) {
      saveToCache(websites);
    }
  }, [websites, saveToCache, enableAutoSync, isFirstLoad]);

  // 设置网站数据的包装函数
  const setWebsites = useCallback(
    (updater: WebsiteData[] | ((prev: WebsiteData[]) => WebsiteData[])) => {
      setError(null); // 清除之前的错误
      setWebsitesState(updater);
    },
    []
  );

  // 添加网站
  const addWebsite = useCallback(
    (website: Omit<WebsiteData, 'visitCount' | 'lastVisit'>) => {
      const newWebsite: WebsiteData = {
        ...website,
        visitCount: 0,
        lastVisit: new Date().toISOString().split('T')[0],
        updatedAt: Date.now(),
        deleted: false,
      };
      setWebsites((prev) => [...prev, newWebsite]);
    },
    [setWebsites]
  );

  // 更新网站
  const updateWebsite = useCallback(
    (id: string, updates: Partial<WebsiteData>) => {
      setWebsites((prev) =>
        prev.map((website) => (website.id === id ? { ...website, ...updates, updatedAt: Date.now() } : website))
      );
    },
    [setWebsites]
  );

  // 删除网站
  const deleteWebsite = useCallback(
    (id: string) => {
      // 软删除：标记为删除并更新时间戳
      setWebsites((prev) =>
        prev.map(website =>
          website.id === id
            ? { ...website, deleted: true, updatedAt: Date.now() }
            : website
        )
      );
    },
    [setWebsites]
  );

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
          theme: localStorage.getItem('theme') || 'light',
        },
        exportTime: new Date().toISOString(),
        version: '1.0',
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [websites]);

  // 导入数据
  const importData = useCallback(
    async (data: any): Promise<{ success: boolean; message: string; validCount?: number }> => {
      try {
        // 验证数据格式
        if (!data.websites || !Array.isArray(data.websites)) {
          return { success: false, message: '无效的数据格式：缺少网站数据' };
        }

        // 使用严格的数据验证和清理数据
        const validWebsites = data.websites.filter(validateWebsiteData).map((site: any) => ({
          ...site,
          visitCount: typeof site.visitCount === 'number' ? site.visitCount : 0,
          lastVisit: site.lastVisit || new Date().toISOString().split('T')[0],
          tags: Array.isArray(site.tags) ? site.tags : [],
          note: site.note || '',
        }));

        if (validWebsites.length === 0) {
          return { success: false, message: '导入文件中没有有效的网站数据' };
        }

        // 应用导入的数据
        setWebsites(validWebsites);

        return {
          success: true,
          message: `成功导入 ${validWebsites.length} 个网站`,
          validCount: validWebsites.length,
        };
      } catch (error) {
        return {
          success: false,
          message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    },
    [setWebsites]
  );

  // 对外暴露的网站数据需要过滤掉已删除的项
  const visibleWebsites = websites.filter(w => !w.deleted);

  // 监听来自 useCloudData 的实时更新事件
  useEffect(() => {
    const handleCloudUpdate = (event: CustomEvent) => {
      if (event.detail && Array.isArray(event.detail.websites)) {
        const cloudWebsites = event.detail.websites as WebsiteData[];
        console.log('📥 收到云端数据更新通知，开始合并...', { count: cloudWebsites.length });

        setWebsites(prevWebsites => {
          // 这里的 prevWebsites 包含了所有数据（含已删除）
          // 使用我们的智能合并策略
          // 为了避免循环引用，我们需要引入 mergeWebsiteData，但 useWebsiteData 和 supabaseSync 本身没有直接的循环引用，可以安全引入
          // 但是为了代码整洁，我们在这里重新实现简单的合并调用，或者直接在 useWebsiteData 顶部引入 mergeWebsiteData
          // 由于是在 hook 内部，我们可以使用动态导入或者直接依赖（因为 supabaseSync 是 lib）

          // 暂时使用简单的合并逻辑，因为 supabaseSync.ts 中已经有了 robust 的 mergeWebsiteData
          // 由于闭包问题，我们不能在 hook 内部轻易引入外部函数(如果它依赖其他hook)，但 supabaseSync 是纯函数库，没问题。

          // 使用导入的合并函数
          return mergeWebsiteData(prevWebsites, cloudWebsites);
        });
      }
    };

    window.addEventListener('cloudDataUpdated', handleCloudUpdate as EventListener);
    return () => {
      window.removeEventListener('cloudDataUpdated', handleCloudUpdate as EventListener);
    };
  }, [setWebsites]);

  return {
    websites: visibleWebsites,
    allWebsites: websites, // 暴露所有数据（包含已删除的）给同步模块使用
    setWebsites,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    exportData,
    importData,
    isLoading,
    error,
  };
}
