import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserWebsites, getUserSettings, mergeWebsiteData, WebsiteData, UserSettings } from '@/lib/firebaseSync';

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

export function useCloudData(): UseCloudDataResult {
  const { currentUser } = useAuth();
  const [state, setState] = useState<CloudDataState>({
    cloudWebsites: null,
    cloudSettings: null,
    loading: false,
    error: null
  });

  const loadCloudData = async () => {
    if (!currentUser || !currentUser.emailVerified) {
      setState(prev => ({ 
        ...prev, 
        error: '需要登录且验证邮箱才能加载云端数据',
        loading: false 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [websites, settings] = await Promise.all([
        getUserWebsites(currentUser),
        getUserSettings(currentUser)
      ]);

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

  // 当用户登录状态变化时，自动加载云端数据
  useEffect(() => {
    if (currentUser && currentUser.emailVerified) {
      loadCloudData();
    } else {
      setState({
        cloudWebsites: null,
        cloudSettings: null,
        loading: false,
        error: null
      });
    }
  }, [currentUser]);

  return {
    ...state,
    loadCloudData,
    mergeWithLocalData,
    hasCloudData: !!state.cloudWebsites || !!state.cloudSettings
  };
}
