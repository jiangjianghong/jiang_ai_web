import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getUserWebsites, getUserSettings, mergeWebsiteData, WebsiteData, UserSettings } from '@/lib/supabaseSync';

interface CloudDataState {
  cloudWebsites: WebsiteData[] | null;
  cloudSettings: UserSettings | null;
  loading: boolean;
  error: string | null;
}

interface UseCloudDataResult extends CloudDataState {
  loadCloudData: () => Promise<void>;
  mergeWithLocalData: (localWebsites: WebsiteData[]) => WebsiteData[];
  hasCloudData: boolean;
}

export function useCloudData(enabled: boolean = true): UseCloudDataResult {
  const { currentUser } = useAuth();
  const [state, setState] = useState<CloudDataState>({
    cloudWebsites: null,
    cloudSettings: null,
    loading: false,
    error: null
  });

  const loadCloudData = async () => {
    if (!currentUser || !currentUser.email_confirmed_at) {
      setState(prev => ({ 
        ...prev, 
        error: '需要登录且验证邮箱才能加载云端数据',
        loading: false 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // 使用 Promise.allSettled 避免一个失败影响另一个
      const [websitesResult, settingsResult] = await Promise.allSettled([
        getUserWebsites(currentUser),
        getUserSettings(currentUser)
      ]);

      const websites = websitesResult.status === 'fulfilled' ? websitesResult.value : null;
      const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;

      setState({
        cloudWebsites: websites,
        cloudSettings: settings,
        loading: false,
        error: null
      });

      console.log('✅ 云端数据加载完成:', { 
        websites: websites?.length || 0, 
        hasSettings: !!settings 
      });
      
      // 如果有失败的操作，记录但不阻塞界面
      if (websitesResult.status === 'rejected') {
        console.warn('云端网站数据加载失败，使用本地数据:', websitesResult.reason);
      }
      if (settingsResult.status === 'rejected') {
        console.warn('云端设置加载失败，使用本地设置:', settingsResult.reason);
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: '加载云端数据失败: ' + (error as Error).message
      }));
      console.error('❌ 加载云端数据失败:', error);
    }
  };

  const mergeWithLocalData = (localWebsites: WebsiteData[]): WebsiteData[] => {
    if (!state.cloudWebsites) {
      return localWebsites;
    }
    return mergeWebsiteData(localWebsites, state.cloudWebsites);
  };

  // 当用户登录状态变化时，自动加载云端数据（仅在启用时）
  useEffect(() => {
    if (enabled && currentUser && currentUser.email_confirmed_at) {
      loadCloudData();
    } else {
      setState({
        cloudWebsites: null,
        cloudSettings: null,
        loading: false,
        error: null
      });
    }
  }, [currentUser, enabled]);

  return {
    ...state,
    loadCloudData,
    mergeWithLocalData,
    hasCloudData: !!state.cloudWebsites || !!state.cloudSettings
  };
}
