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
    console.log('🔍 loadCloudData 被调用:', {
      hasUser: !!currentUser,
      userId: currentUser?.id,
      emailConfirmed: !!currentUser?.email_confirmed_at,
      userEmail: currentUser?.email
    });
    
    if (!currentUser || !currentUser.email_confirmed_at) {
      console.log('❌ 无法加载云端数据 - 用户未登录或邮箱未验证');
      setState(prev => ({ 
        ...prev, 
        error: '需要登录且验证邮箱才能加载云端数据',
        loading: false 
      }));
      return;
    }

    console.log('🚀 开始加载云端数据...');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // 使用 Promise.allSettled 避免一个失败影响另一个
      console.log('📡 正在从Supabase获取数据...');
      const [websitesResult, settingsResult] = await Promise.allSettled([
        getUserWebsites(currentUser),
        getUserSettings(currentUser)
      ]);

      const websites = websitesResult.status === 'fulfilled' ? websitesResult.value : null;
      const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;

      console.log('📊 云端数据获取结果:', {
        websitesStatus: websitesResult.status,
        websitesCount: websites?.length || 0,
        websitesData: websites,
        settingsStatus: settingsResult.status,
        hasSettings: !!settings,
        settingsData: settings
      });

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
      console.error('❌ 加载云端数据异常:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: '加载云端数据失败: ' + (error as Error).message
      }));
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
    console.log('🔍 useCloudData useEffect 触发:', {
      enabled,
      hasUser: !!currentUser,
      emailConfirmed: !!currentUser?.email_confirmed_at,
      userId: currentUser?.id
    });
    
    if (enabled && currentUser && currentUser.email_confirmed_at) {
      console.log('👤 检测到用户登录状态变化，开始加载云端数据...');
      // 每次登录都重置状态并重新加载
      setState({
        cloudWebsites: null,
        cloudSettings: null,
        loading: false,
        error: null
      });
      loadCloudData();
    } else if (!currentUser) {
      console.log('👤 用户已登出或未登录，清除云端数据缓存');
      setState({
        cloudWebsites: null,
        cloudSettings: null,
        loading: false,
        error: null
      });
    } else {
      console.log('⏸️ 云端数据加载条件不满足:', {
        enabled,
        hasUser: !!currentUser,
        emailConfirmed: !!currentUser?.email_confirmed_at
      });
    }
  }, [currentUser?.id, currentUser?.email_confirmed_at, enabled]);
  
  // 首次登录检测
  useEffect(() => {
    if (enabled && currentUser && currentUser.email_confirmed_at && !state.loading && !state.cloudWebsites && !state.error) {
      console.log('🆕 检测到可能是首次登录，主动加载云端数据...');
      loadCloudData();
    }
  }, [enabled, currentUser, state.loading, state.cloudWebsites, state.error]);

  return {
    ...state,
    loadCloudData,
    mergeWithLocalData,
    hasCloudData: !!state.cloudWebsites || !!state.cloudSettings
  };
}
