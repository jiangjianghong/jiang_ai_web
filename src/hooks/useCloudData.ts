import { useEffect, useState, useRef, useCallback } from 'react';
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

  // 使用ref跟踪加载状态，避免useEffect循环
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const hasInitialLoadRef = useRef(false);

  const loadCloudData = useCallback(async () => {
    // 防止重复加载
    if (loadingRef.current) {
      console.log('⏸️ 已有加载任务进行中，跳过重复加载');
      return;
    }

    console.log('🔍 loadCloudData 被调用:', {
      hasUser: !!currentUser,
      userId: currentUser?.id,
      emailConfirmed: !!currentUser?.email_confirmed_at,
      userEmail: currentUser?.email,
      emailConfirmedAt: currentUser?.email_confirmed_at,
      userObject: currentUser
    });

    if (!currentUser) {
      console.log('❌ 无法加载云端数据 - 用户未登录');
      setState(prev => ({
        ...prev,
        error: '需要登录才能加载云端数据',
        loading: false
      }));
      return;
    }

    if (!currentUser.email_confirmed_at) {
      console.log('❌ 无法加载云端数据 - 邮箱未验证', {
        email: currentUser.email,
        emailConfirmedAt: currentUser.email_confirmed_at,
        createdAt: currentUser.created_at
      });
      setState(prev => ({
        ...prev,
        error: '需要验证邮箱才能加载云端数据',
        loading: false
      }));
      return;
    }

    console.log('🚀 开始加载云端数据...');
    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 使用 Promise.allSettled 避免一个失败影响另一个
      console.log('📡 正在从Supabase获取数据...', {
        userId: currentUser.id,
        userEmail: currentUser.email,
        emailConfirmed: currentUser.email_confirmed_at,
        createdAt: currentUser.created_at
      });
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

      // 如果网站数据获取失败，记录详细错误
      if (websitesResult.status === 'rejected') {
        console.error('❌ 网站数据获取失败:', {
          error: websitesResult.reason,
          userId: currentUser.id,
          userEmail: currentUser.email
        });
      }
      if (settingsResult.status === 'rejected') {
        console.error('❌ 设置数据获取失败:', {
          error: settingsResult.reason,
          userId: currentUser.id,
          userEmail: currentUser.email
        });
      }

      setState({
        cloudWebsites: websites,
        cloudSettings: settings,
        loading: false,
        error: null
      });

      hasInitialLoadRef.current = true;

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
    } finally {
      loadingRef.current = false;
    }
  }, [currentUser]);

  const mergeWithLocalData = useCallback((localWebsites: WebsiteData[]): WebsiteData[] => {
    if (!state.cloudWebsites) {
      return localWebsites;
    }
    return mergeWebsiteData(localWebsites, state.cloudWebsites);
  }, [state.cloudWebsites]);

  // 当用户登录状态变化时，自动加载云端数据（仅在启用时）
  useEffect(() => {
    const currentUserId = currentUser?.id;
    const isEmailConfirmed = !!currentUser?.email_confirmed_at;

    console.log('🔍 useCloudData useEffect 触发:', {
      enabled,
      hasUser: !!currentUser,
      emailConfirmed: isEmailConfirmed,
      userId: currentUserId,
      lastUserId: lastUserIdRef.current,
      hasInitialLoad: hasInitialLoadRef.current,
      isLoading: loadingRef.current
    });

    // 检查用户是否发生变化
    const userChanged = lastUserIdRef.current !== currentUserId;

    if (enabled && currentUser && isEmailConfirmed) {
      // 只有在用户真正变化或者从未加载过数据时才触发加载
      if (userChanged || (!hasInitialLoadRef.current && !loadingRef.current)) {
        console.log('👤 检测到用户登录状态变化，开始加载云端数据...');
        // 重置状态
        setState({
          cloudWebsites: null,
          cloudSettings: null,
          loading: false,
          error: null
        });
        hasInitialLoadRef.current = false;
        
        // 添加小延迟确保认证状态稳定
        setTimeout(() => {
          loadCloudData();
        }, 100);
      } else {
        console.log('⏸️ 跳过重复的数据加载请求');
      }
      lastUserIdRef.current = currentUserId || null;
    } else if (!currentUser) {
      console.log('👤 用户已登出或未登录，清除云端数据缓存');
      setState({
        cloudWebsites: null,
        cloudSettings: null,
        loading: false,
        error: null
      });
      lastUserIdRef.current = null;
      hasInitialLoadRef.current = false;
    } else {
      console.log('⏸️ 云端数据加载条件不满足:', {
        enabled,
        hasUser: !!currentUser,
        emailConfirmed: isEmailConfirmed,
        emailConfirmedAt: currentUser?.email_confirmed_at
      });
      // 确保在条件不满足时也设置 loading 为 false
      setState(prev => ({
        ...prev,
        loading: false
      }));
    }
  }, [currentUser?.id, currentUser?.email_confirmed_at, enabled]); // 移除 loadCloudData 依赖避免循环

  // 监听用户登录事件，立即触发数据加载（始终监听，不依赖enabled）
  useEffect(() => {
    const handleUserSignedIn = (event: CustomEvent) => {
      const user = event.detail?.user;
      console.log('📨 收到用户登录事件:', {
        hasUser: !!user,
        emailConfirmed: !!user?.email_confirmed_at,
        userEmail: user?.email
      });

      if (user && user.email_confirmed_at) {
        console.log('🚀 收到用户登录事件，立即加载云端数据');
        
        // 使用事件中的用户信息创建专门的加载函数，避免闭包问题
        const loadWithEventUser = async () => {
          if (loadingRef.current) {
            console.log('⏸️ 已有加载任务进行中，跳过重复加载');
            return;
          }

          console.log('🔍 loadCloudData 被调用 (来自事件):', {
            hasUser: !!user,
            userId: user?.id,
            emailConfirmed: !!user?.email_confirmed_at,
            userEmail: user?.email,
            emailConfirmedAt: user?.email_confirmed_at
          });

          console.log('🚀 开始加载云端数据...');
          loadingRef.current = true;
          setState(prev => ({ ...prev, loading: true, error: null }));

          try {
            console.log('📡 正在从Supabase获取数据...', {
              userId: user.id,
              userEmail: user.email,
              emailConfirmed: user.email_confirmed_at,
              createdAt: user.created_at
            });
            
            const [websitesResult, settingsResult] = await Promise.allSettled([
              getUserWebsites(user),
              getUserSettings(user)
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

            hasInitialLoadRef.current = true;

            console.log('✅ 云端数据加载完成:', {
              websites: websites?.length || 0,
              hasSettings: !!settings
            });

          } catch (error) {
            console.error('❌ 加载云端数据异常:', error);
            setState(prev => ({
              ...prev,
              loading: false,
              error: '加载云端数据失败: ' + (error as Error).message
            }));
          } finally {
            loadingRef.current = false;
          }
        };
        
        loadWithEventUser();
      } else {
        console.log('⏸️ 用户登录事件条件不满足，跳过数据加载');
      }
    };

    console.log('🎧 注册用户登录事件监听器');
    window.addEventListener('userSignedIn', handleUserSignedIn as EventListener);
    return () => {
      console.log('🔇 移除用户登录事件监听器');
      window.removeEventListener('userSignedIn', handleUserSignedIn as EventListener);
    };
  }, []); // 移除所有依赖，避免闭包问题

  return {
    ...state,
    loadCloudData,
    mergeWithLocalData,
    hasCloudData: !!state.cloudWebsites || !!state.cloudSettings
  };
}
