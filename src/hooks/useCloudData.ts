import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  getUserWebsites,
  getUserSettings,
  mergeWebsiteData,
  WebsiteData,
  UserSettings,
  supabase,
} from '@/lib/supabaseSync';
import { logger } from '@/lib/logger';

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
    error: null,
  });

  // 使用ref跟踪加载状态，避免useEffect循环
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const hasInitialLoadRef = useRef(false);

  const loadCloudData = useCallback(async () => {
    // 防止重复加载
    if (loadingRef.current) {
      logger.debug('⏸️ 已有加载任务进行中，跳过重复加载');
      return;
    }

    logger.debug('🔍 loadCloudData 被调用:', {
      hasUser: !!currentUser,
      userId: currentUser?.id,
      emailConfirmed: !!currentUser?.email_confirmed_at,
    });

    if (!currentUser) {
      logger.debug('无法加载云端数据 - 用户未登录');
      setState((prev) => ({
        ...prev,
        error: '需要登录才能加载云端数据',
        loading: false,
      }));
      return;
    }

    if (!currentUser.email_confirmed_at) {
      logger.debug('无法加载云端数据 - 邮箱未验证');
      setState((prev) => ({
        ...prev,
        error: '需要验证邮箱才能加载云端数据',
        loading: false,
      }));
      return;
    }

    logger.debug('🚀 开始加载云端数据...');
    loadingRef.current = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 使用 Promise.allSettled 避免一个失败影响另一个
      const [websitesResult, settingsResult] = await Promise.allSettled([
        getUserWebsites(currentUser),
        getUserSettings(currentUser),
      ]);

      const websites = websitesResult.status === 'fulfilled' ? websitesResult.value : null;
      const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;

      logger.debug('云端数据获取结果:', {
        websitesCount: websites?.length || 0,
        hasSettings: !!settings,
      });

      // 如果网站数据获取失败，记录详细错误
      if (websitesResult.status === 'rejected') {
        logger.error('网站数据获取失败:', websitesResult.reason);
      }
      if (settingsResult.status === 'rejected') {
        logger.error('设置数据获取失败:', settingsResult.reason);
      }

      setState({
        cloudWebsites: websites,
        cloudSettings: settings,
        loading: false,
        error: null,
      });

      hasInitialLoadRef.current = true;

      logger.debug('云端数据加载完成:', {
        websites: websites?.length || 0,
        hasSettings: !!settings,
      });

      // 如果有失败的操作，记录但不阻塞界面
      if (websitesResult.status === 'rejected') {
        logger.warn('云端网站数据加载失败，使用本地数据:', websitesResult.reason);
      }
      if (settingsResult.status === 'rejected') {
        logger.warn('云端设置加载失败，使用本地设置:', settingsResult.reason);
      }
    } catch (error) {
      logger.error('加载云端数据异常:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: '加载云端数据失败: ' + (error as Error).message,
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [currentUser]);

  const mergeWithLocalData = useCallback(
    (localWebsites: WebsiteData[]): WebsiteData[] => {
      if (!state.cloudWebsites) {
        return localWebsites;
      }
      return mergeWebsiteData(localWebsites, state.cloudWebsites);
    },
    [state.cloudWebsites]
  );

  // 当用户登录状态变化时，自动加载云端数据（仅在启用时）
  useEffect(() => {
    const currentUserId = currentUser?.id;
    const isEmailConfirmed = !!currentUser?.email_confirmed_at;

    logger.debug('🔍 useCloudData useEffect 触发:', {
      enabled,
      hasUser: !!currentUser,
      emailConfirmed: isEmailConfirmed,
      userId: currentUserId,
      lastUserId: lastUserIdRef.current,
      hasInitialLoad: hasInitialLoadRef.current,
      isLoading: loadingRef.current,
    });

    // 检查用户是否发生变化
    const userChanged = lastUserIdRef.current !== currentUserId;

    if (enabled && currentUser && isEmailConfirmed) {
      // 只有在用户真正变化或者从未加载过数据时才触发加载
      if (userChanged || (!hasInitialLoadRef.current && !loadingRef.current)) {
        logger.debug('👤 检测到用户登录状态变化，开始加载云端数据...');
        // 重置状态
        setState({
          cloudWebsites: null,
          cloudSettings: null,
          loading: false,
          error: null,
        });
        hasInitialLoadRef.current = false;

        // 添加小延迟确保认证状态稳定
        setTimeout(() => {
          loadCloudData();
        }, 100);
      } else {
        logger.debug('⏸️ 跳过重复的数据加载请求');
      }
      lastUserIdRef.current = currentUserId || null;
    } else if (!currentUser) {
      logger.debug('👤 用户已登出或未登录，清除云端数据缓存');
      setState({
        cloudWebsites: null,
        cloudSettings: null,
        loading: false,
        error: null,
      });
      lastUserIdRef.current = null;
      hasInitialLoadRef.current = false;
    } else {
      logger.debug('⏸️ 云端数据加载条件不满足:', {
        enabled,
        hasUser: !!currentUser,
        emailConfirmed: isEmailConfirmed,
        emailConfirmedAt: currentUser?.email_confirmed_at,
      });
      // 确保在条件不满足时也设置 loading 为 false
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, [currentUser?.id, currentUser?.email_confirmed_at, enabled]); // 移除 loadCloudData 依赖避免循环

  // 监听用户登录事件，立即触发数据加载（始终监听，不依赖enabled）
  useEffect(() => {
    const handleUserSignedIn = (event: CustomEvent) => {
      const user = event.detail?.user;
      logger.debug('📨 收到用户登录事件:', {
        hasUser: !!user,
        emailConfirmed: !!user?.email_confirmed_at,
        userEmail: user?.email,
      });

      if (user && user.email_confirmed_at) {
        logger.debug('🚀 收到用户登录事件，立即加载云端数据');

        // 使用事件中的用户信息创建专门的加载函数，避免闭包问题
        const loadWithEventUser = async () => {
          if (loadingRef.current) {
            logger.debug('⏸️ 已有加载任务进行中，跳过重复加载');
            return;
          }

          logger.debug('🔍 loadCloudData 被调用 (来自事件):', {
            hasUser: !!user,
            userId: user?.id,
            emailConfirmed: !!user?.email_confirmed_at,
            userEmail: user?.email,
            emailConfirmedAt: user?.email_confirmed_at,
          });

          logger.debug('🚀 开始加载云端数据...');
          loadingRef.current = true;
          setState((prev) => ({ ...prev, loading: true, error: null }));

          try {
            logger.debug('📡 正在从Supabase获取数据...', {
              userId: user.id,
              userEmail: user.email,
              emailConfirmed: user.email_confirmed_at,
              createdAt: user.created_at,
            });

            const [websitesResult, settingsResult] = await Promise.allSettled([
              getUserWebsites(user),
              getUserSettings(user),
            ]);

            const websites = websitesResult.status === 'fulfilled' ? websitesResult.value : null;
            const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;

            logger.debug('📊 云端数据获取结果:', {
              websitesStatus: websitesResult.status,
              websitesCount: websites?.length || 0,
              websitesData: websites,
              settingsStatus: settingsResult.status,
              hasSettings: !!settings,
              settingsData: settings,
            });

            setState({
              cloudWebsites: websites,
              cloudSettings: settings,
              loading: false,
              error: null,
            });

            hasInitialLoadRef.current = true;

            logger.debug('✅ 云端数据加载完成:', {
              websites: websites?.length || 0,
              hasSettings: !!settings,
            });
          } catch (error) {
            logger.error('❌ 加载云端数据异常:', error);
            setState((prev) => ({
              ...prev,
              loading: false,
              error: '加载云端数据失败: ' + (error as Error).message,
            }));
          } finally {
            loadingRef.current = false;
          }
        };

        loadWithEventUser();
      } else {
        logger.debug('⏸️ 用户登录事件条件不满足，跳过数据加载');
      }
    };

    logger.debug('🎧 注册用户登录事件监听器');
    window.addEventListener('userSignedIn', handleUserSignedIn as EventListener);
    return () => {
      logger.debug('🔇 移除用户登录事件监听器');
      window.removeEventListener('userSignedIn', handleUserSignedIn as EventListener);
    };
  }, []); // 移除所有依赖，避免闭包问题

  // 监听 Supabase Realtime 实时更新
  useEffect(() => {
    // 只有在启用且已登录时才监听
    if (!enabled || !currentUser || !currentUser.email_confirmed_at) {
      return;
    }

    logger.debug('🔌 初始化 Realtime 订阅...');

    // 订阅 user_websites 表的变更
    const channelCallback = (payload: any) => {
      logger.debug('⚡ 收到 Realtime 更新:', payload);

      if (payload.eventType === 'UPDATE' && payload.new && payload.new.websites) {
        if (payload.new.id === currentUser.id) {
          logger.sync.debug('🔄 收到新的网站数据 (Realtime)，准备合并...', {
            newCount: payload.new.websites?.length
          });

          // 验证并清理数据，防止非法数据导致应用崩溃
          const rawWebsites = payload.new.websites;
          if (!Array.isArray(rawWebsites)) {
            logger.sync.warn('Realtime 收到无效的 websites 数据格式', rawWebsites);
            return;
          }

          // 这里我们简单转换，让 mergeWebsiteData 处理更细致的校验
          const newCloudWebsites = rawWebsites as WebsiteData[];

          setState((prev) => ({
            ...prev,
            cloudWebsites: newCloudWebsites,
          }));

          // 发送自定义事件通知上层组件
          window.dispatchEvent(
            new CustomEvent('cloudDataUpdated', {
              detail: { websites: newCloudWebsites, source: 'realtime' }
            })
          );
        }
      }
    };

    const channel = supabase
      .channel('public:user_websites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_websites',
          filter: `id=eq.${currentUser.id}`,
        },
        channelCallback
      )
      .subscribe((status) => {
        logger.debug('📡 Realtime 订阅状态:', status);
      });

    return () => {
      logger.debug('🔌 取消 Realtime 订阅');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, enabled]);

  return {
    ...state,
    loadCloudData,
    mergeWithLocalData,
    hasCloudData: !!state.cloudWebsites || !!state.cloudSettings,
  };
}
