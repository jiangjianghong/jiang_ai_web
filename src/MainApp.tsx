import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TransparencyProvider } from '@/contexts/TransparencyContext';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { WebsiteData } from '@/lib/supabaseSync';
import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useResourcePreloader } from '@/hooks/useResourcePreloader';
import { useCloudData } from '@/hooks/useCloudData';
import CookieConsent from '@/components/CookieConsent';
import PrivacySettings from '@/components/PrivacySettings';
import { useStorage } from '@/lib/storageManager';
import { useTransparency } from '@/contexts/TransparencyContext';

// 内部应用组件，可以使用认证上下文
function AppContent() {
  console.log('🎯 AppContent 开始渲染');
  
  // 使用页面标题hook
  usePageTitle();
  
  // 启用资源预加载
  useResourcePreloader();
  
  // 存储管理
  const storage = useStorage();
  const { currentUser } = useAuth();
  const { 
    setCardOpacity, 
    setSearchBarOpacity, 
    setParallaxEnabled, 
    setWallpaperResolution,
    setCardColor,
    setSearchBarColor,
    setAutoSyncEnabled,
    setAutoSyncInterval
  } = useTransparency();
  
  // 云端数据管理
  const { cloudWebsites, cloudSettings, loading: cloudLoading, mergeWithLocalData } = useCloudData(true);
  
  // 本地数据状态
  const [websites, setWebsites] = useState<WebsiteData[]>(() => {
    const saved = storage.getItem<WebsiteData[]>('websites');
    return saved || [];
  });

  const [dataInitialized, setDataInitialized] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // 数据合并逻辑：当云端数据加载完成时，合并本地和云端数据
  useEffect(() => {
    if (!currentUser || !currentUser.email_confirmed_at) {
      // 用户未登录或邮箱未验证，直接使用本地数据
      setDataInitialized(true);
      return;
    }

    if (cloudLoading) {
      // 云端数据还在加载中
      return;
    }

    // 云端数据加载完成，进行数据合并
    const localWebsites = storage.getItem<WebsiteData[]>('websites') || [];
    
    // 1. 处理网站数据合并
    if (cloudWebsites && cloudWebsites.length > 0) {
      // 有云端数据，进行智能合并
      console.log('🔄 合并本地和云端网站数据', {
        local: localWebsites.length,
        cloud: cloudWebsites.length
      });
      
      const mergedWebsites = mergeWithLocalData(localWebsites);
      setWebsites(mergedWebsites);
      
      // 立即保存合并后的数据到本地
      storage.setItem('websites', mergedWebsites);
    } else if (localWebsites.length > 0) {
      // 没有云端数据但有本地数据，使用本地数据
      console.log('📱 使用本地网站数据（云端无数据）', { count: localWebsites.length });
      setWebsites(localWebsites);
    } else {
      // 既没有云端数据也没有本地数据，使用空数组
      console.log('🆕 新用户，无网站数据');
      setWebsites([]);
    }

    // 2. 处理设置数据合并
    if (cloudSettings) {
      console.log('🔄 应用云端设置数据', cloudSettings);
      
      // 应用云端设置到本地状态
      setCardOpacity(cloudSettings.cardOpacity);
      setSearchBarOpacity(cloudSettings.searchBarOpacity);
      setParallaxEnabled(cloudSettings.parallaxEnabled);
      setWallpaperResolution(cloudSettings.wallpaperResolution);
      setCardColor(cloudSettings.cardColor);
      setSearchBarColor(cloudSettings.searchBarColor);
      setAutoSyncEnabled(cloudSettings.autoSyncEnabled);
      setAutoSyncInterval(cloudSettings.autoSyncInterval);
      
      // 同步主题设置
      if (cloudSettings.theme) {
        localStorage.setItem('theme', cloudSettings.theme);
        // 触发主题变更事件
        document.documentElement.setAttribute('data-theme', cloudSettings.theme);
      }
    } else {
      console.log('📱 使用本地设置数据（云端无设置）');
    }
    
    setDataInitialized(true);
  }, [currentUser, cloudWebsites, cloudLoading, mergeWithLocalData, storage]);

  // 持久化到存储管理器（仅在数据初始化完成后）
  useEffect(() => {
    if (dataInitialized) {
      storage.setItem('websites', websites);
    }
  }, [websites, storage, dataInitialized]);

  console.log('✅ AppContent 渲染完成');

  // 显示加载状态，直到数据初始化完成
  if (!dataInitialized) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">
            {cloudLoading ? '正在加载云端数据...' : '正在初始化数据...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home websites={websites} setWebsites={setWebsites} dataInitialized={dataInitialized} />} />
      </Routes>
      
      <CookieConsent />
      
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
  console.log('🎯 MainApp 开始渲染');
  
  return (
    <DndProvider backend={HTML5Backend}>
      <TransparencyProvider>
        <AuthProvider>
          <SyncProvider>
            <UserProfileProvider>
              <WorkspaceProvider>
                <AppContent />
              </WorkspaceProvider>
            </UserProfileProvider>
          </SyncProvider>
        </AuthProvider>
      </TransparencyProvider>
    </DndProvider>
  );
}
