import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import AuthCallback from '@/pages/AuthCallback';
import ResetPassword from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';
import { lazy, Suspense } from 'react';

// Admin 页面懒加载 - 包含 Recharts 图表库，延迟加载减少首屏 bundle
const Admin = lazy(() => import('@/pages/Admin'));
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TransparencyProvider } from '@/contexts/TransparencyContext';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { UserProfileProvider, useUserProfile } from '@/contexts/UserProfileContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { WebsiteData, updateUserActiveTime } from '@/lib/supabaseSync';
import { checkUserBanned } from '@/lib/adminUtils';
import { useState, useEffect, useRef } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useResourcePreloader } from '@/hooks/useResourcePreloader';
import { useCloudData } from '@/hooks/useCloudData';
import CookieConsent from '@/components/CookieConsent';
import PrivacySettings from '@/components/PrivacySettings';
import { useStorage } from '@/lib/storageManager';
import { useTransparency } from '@/contexts/TransparencyContext';

import { logger } from '@/utils/logger';

// 内部应用组件，可以使用认证上下文
function AppContent() {
  logger.debug('🎯 AppContent 开始渲染');

  // 获取用户资料
  const { displayName } = useUserProfile();

  // 使用页面标题hook（传入用户名）
  usePageTitle({ displayName });

  // 启用资源预加载
  useResourcePreloader();

  // 存储管理
  const storage = useStorage();
  const { currentUser, logout } = useAuth();
  const {
    setCardOpacity,
    setSearchBarOpacity,
    setParallaxEnabled,
    setWallpaperResolution,
    setCardColor,
    setSearchBarColor,
    setAutoSyncEnabled,
    setAutoSyncInterval,
    setAutoSortEnabled,
  } = useTransparency();

  // 云端数据管理
  const {
    cloudWebsites,
    cloudSettings,
    loading: cloudLoading,
    mergeWithLocalData,
  } = useCloudData(true);

  // 本地数据状态
  const [websites, setWebsites] = useState<WebsiteData[]>(() => {
    const saved = storage.getItem<WebsiteData[]>('websites');
    return saved || [];
  });

  const [dataInitialized, setDataInitialized] = useState(false);
  const [settingsApplied, setSettingsApplied] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [lastMergedDataId, setLastMergedDataId] = useState<string>('');

  // 用于防止重复检查禁用状态
  const banCheckRef = useRef(false);

  // 当用户变化时重置状态
  useEffect(() => {
    setDataInitialized(false);
    setSettingsApplied(false);
    setLastMergedDataId('');
    banCheckRef.current = false;
  }, [currentUser?.id]);

  // 检查用户是否被禁用，如果是则强制登出
  useEffect(() => {
    if (!currentUser || banCheckRef.current) return;

    const checkBan = async () => {
      banCheckRef.current = true;
      const isBanned = await checkUserBanned(currentUser.id);
      if (isBanned) {
        // 显示提示并登出
        alert('您的账户已被禁用，如有疑问请联系管理员。');
        await logout();
      }
    };

    checkBan();
  }, [currentUser, logout]);

  // 后台静默更新用户活跃时间（用于后台显示在线状态）
  useEffect(() => {
    if (!currentUser || !currentUser.email_confirmed_at) return;

    // 使用 requestIdleCallback 在浏览器空闲时执行，不影响页面加载
    const doUpdate = () => {
      updateUserActiveTime(currentUser).catch(() => {
        // 静默失败，不影响用户体验
      });
    };

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(doUpdate, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    } else {
      // 回退方案：使用 setTimeout
      const timer = setTimeout(doUpdate, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // 数据合并逻辑：当云端数据加载完成时，合并本地和云端数据
  useEffect(() => {
    if (!currentUser || !currentUser.email_confirmed_at) {
      // 用户未登录或邮箱未验证，直接使用本地数据
      setDataInitialized(true);
      setSettingsApplied(true); // 重置设置应用标记
      return;
    }

    if (cloudLoading) {
      // 云端数据还在加载中
      return;
    }

    // 云端数据加载完成，进行数据合并
    const localWebsites = storage.getItem<WebsiteData[]>('websites') || [];

    // 创建数据标识，避免重复合并
    const currentDataId = JSON.stringify({
      cloudCount: cloudWebsites?.length || 0,
      localCount: localWebsites.length,
      userId: currentUser?.id,
      cloudData:
        cloudWebsites
          ?.map((w) => w.id)
          .sort()
          .join(',') || '',
      localData: localWebsites
        .map((w) => w.id)
        .sort()
        .join(','),
    });

    // 如果数据标识相同，跳过合并
    if (currentDataId === lastMergedDataId) {
      logger.debug('⏭️ 数据未变化，跳过重复合并');
      setDataInitialized(true);
      return;
    }

    // 检查是否已经初始化过数据（避免覆盖用户的本地修改）
    if (dataInitialized && websites.length > 0) {
      logger.debug('⚠️ 数据已初始化，使用当前状态中的数据，避免覆盖用户修改');
      // 只更新标识，但不重新合并数据
      setLastMergedDataId(currentDataId);
      return;
    }

    // 1. 处理网站数据合并（只在首次初始化时执行）
    if (cloudWebsites && cloudWebsites.length > 0) {
      // 有云端数据，进行智能合并
      logger.debug('🔄 合并本地和云端网站数据', {
        local: localWebsites.length,
        cloud: cloudWebsites.length,
      });

      const mergedWebsites = mergeWithLocalData(localWebsites);
      setWebsites(mergedWebsites);

      // 立即保存合并后的数据到本地
      storage.setItem('websites', mergedWebsites);
    } else if (localWebsites.length > 0) {
      // 没有云端数据但有本地数据，使用本地数据
      logger.debug('📱 使用本地网站数据（云端无数据）', { count: localWebsites.length });
      setWebsites(localWebsites);
    } else {
      // 既没有云端数据也没有本地数据，使用空数组
      logger.debug('🆕 新用户，无网站数据');
      setWebsites([]);
    }

    // 记录已合并的数据标识
    setLastMergedDataId(currentDataId);

    // 2. 处理设置数据合并（只在首次加载时应用）
    if (cloudSettings && !settingsApplied) {
      logger.debug('🔄 应用云端设置数据', cloudSettings);

      // 应用云端设置到本地状态
      setCardOpacity(cloudSettings.cardOpacity);
      setSearchBarOpacity(cloudSettings.searchBarOpacity);
      setParallaxEnabled(cloudSettings.parallaxEnabled);
      setWallpaperResolution(cloudSettings.wallpaperResolution);
      setCardColor(cloudSettings.cardColor);
      setSearchBarColor(cloudSettings.searchBarColor);
      setAutoSyncEnabled(cloudSettings.autoSyncEnabled);
      setAutoSyncInterval(cloudSettings.autoSyncInterval);
      setAutoSortEnabled(cloudSettings.autoSortEnabled ?? false); // 提供默认值

      // 同步主题设置
      if (cloudSettings.theme) {
        localStorage.setItem('theme', cloudSettings.theme);
        // 触发主题变更事件
        document.documentElement.setAttribute('data-theme', cloudSettings.theme);
      }

      setSettingsApplied(true);
    } else if (!cloudSettings && !settingsApplied) {
      logger.debug('📱 使用本地设置数据（云端无设置）');
      setSettingsApplied(true);
    }

    setDataInitialized(true);
  }, [
    currentUser,
    cloudWebsites,
    cloudSettings,
    cloudLoading,
    storage,
    settingsApplied,
    lastMergedDataId,
    mergeWithLocalData,
    setCardOpacity,
    setSearchBarOpacity,
    setParallaxEnabled,
    setWallpaperResolution,
    setCardColor,
    setSearchBarColor,
    setAutoSyncEnabled,
    setAutoSyncInterval,
    setAutoSortEnabled,
  ]);

  // 持久化到存储管理器（仅在数据初始化完成后）
  useEffect(() => {
    if (dataInitialized) {
      storage.setItem('websites', websites);
    }
  }, [websites, storage, dataInitialized]);

  logger.debug('✅ AppContent 渲染完成');

  // 注释掉加载状态，直接显示应用内容
  // if (!dataInitialized) {
  //   return (
  //     <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
  //         <p className="text-white/80 text-lg">
  //           {cloudLoading ? '正在加载云端数据...' : '正在初始化数据...'}
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Home websites={websites} setWebsites={setWebsites} dataInitialized={dataInitialized} />
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/80">加载管理后台...</p>
              </div>
            </div>
          }>
            <Admin />
          </Suspense>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <CookieConsent
        onCustomize={() => setShowPrivacySettings(true)}
      />

      {showPrivacySettings && (
        <PrivacySettings
          isOpen={showPrivacySettings}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}
    </>
  );
}

// 主应用组件，包含所有Provider
export default function MainApp() {
  logger.debug('🎯 MainApp 开始渲染');

  return (
    <DndProvider backend={HTML5Backend}>
      <TransparencyProvider>
        <AuthProvider>
          <SyncProvider>
            <UserProfileProvider>
              <AdminProvider>
                <WorkspaceProvider>
                  <AppContent />
                </WorkspaceProvider>
              </AdminProvider>
            </UserProfileProvider>
          </SyncProvider>
        </AuthProvider>
      </TransparencyProvider>
    </DndProvider>
  );
}
