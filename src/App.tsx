import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TransparencyProvider, useTransparency } from '@/contexts/TransparencyContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import DataSyncModal from '@/components/DataSyncModal';
import NetworkStatus from '@/components/NetworkStatus';
import SupabaseErrorBoundary from '@/components/SupabaseErrorBoundary';
import { useCloudData } from '@/hooks/useCloudData';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { saveUserWebsites, WebsiteData } from '@/lib/supabaseSync';
import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useResourcePreloader } from '@/hooks/useResourcePreloader';
import CookieConsent from '@/components/CookieConsent';
import PrivacySettings from '@/components/PrivacySettings';
import { useWebsiteData } from '@/hooks/useWebsiteData';
import { useStableArrayLength } from '@/hooks/useArrayComparison';
import { areDataDifferent } from '@/lib/syncUtils';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

// 内部应用组件，可以使用认证上下文
function AppContent() {
  // 使用页面标题hook
  usePageTitle();
  
  // 使用性能优化hook
  usePerformanceOptimization();
  
  // 使用统一的网站数据管理
  const { 
    websites, 
    setWebsites
  } = useWebsiteData();
  
  const { currentUser } = useAuth();
  
  // 延迟初始化标记
  const [isFirstRenderComplete, setIsFirstRenderComplete] = useState(false);
  
  // 登录用户立即启用云同步，未登录用户等待首屏渲染完成
  const shouldEnableCloudSync = currentUser?.email_confirmed_at ? true : (isFirstRenderComplete && !!currentUser?.email_confirmed_at);
  
  console.log('🔧 云同步启用条件检查:', {
    isFirstRenderComplete,
    hasUser: !!currentUser,
    emailConfirmed: !!currentUser?.email_confirmed_at,
    shouldEnableCloudSync
  });
  
  const { cloudWebsites, cloudSettings, hasCloudData, mergeWithLocalData } = useCloudData(shouldEnableCloudSync);
  
  // 在首屏渲染完成后再启用资源预加载
  useResourcePreloader(isFirstRenderComplete);
  const { 
    setCardOpacity, 
    setSearchBarOpacity, 
    setParallaxEnabled, 
    setWallpaperResolution 
  } = useTransparency();
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncProcessed, setSyncProcessed] = useState(false);
  
  // 当用户登录状态变化时，重置同步状态
  useEffect(() => {
    if (currentUser && currentUser.email_confirmed_at) {
      console.log('👤 用户登录状态变化，重置同步状态');
      setSyncProcessed(false);
    }
  }, [currentUser?.id, currentUser?.email_confirmed_at]);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // 首屏渲染完成后启用数据同步和资源预加载
  useEffect(() => {
    // 使用 setTimeout 确保首屏DOM完全渲染后再启用重型操作
    const timer = setTimeout(() => {
      setIsFirstRenderComplete(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 使用优化的数组长度比较，避免频繁重新执行
  const stableWebsitesLength = useStableArrayLength(websites);

  // 检查是否需要显示数据同步对话框（延迟到云同步启用后）
  useEffect(() => {
    console.log('🔍 App.tsx 同步检查 useEffect 触发:', {
      shouldEnableCloudSync,
      hasUser: !!currentUser,
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      emailConfirmed: !!currentUser?.email_confirmed_at,
      hasCloudData,
      hasCloudWebsites: !!cloudWebsites,
      cloudWebsitesCount: cloudWebsites?.length || 0,
      localWebsitesCount: websites.length,
      syncProcessed
    });
    
    // 添加详细的状态检查
    if (currentUser) {
      console.log('👤 当前用户信息:', {
        id: currentUser.id,
        email: currentUser.email,
        emailConfirmed: currentUser.email_confirmed_at,
        createdAt: currentUser.created_at
      });
    }
    
    if (!shouldEnableCloudSync) {
      console.log('⏸️ 云同步未启用，跳过同步检查');
      return;
    }
    
    if (currentUser && currentUser.email_confirmed_at && hasCloudData && cloudWebsites && !syncProcessed) {
      // 获取当前的本地数据进行比较
      const currentWebsites = websites;
      const localCount = currentWebsites.length;
      const cloudCount = cloudWebsites.length;
      
      console.log(`🔄 检测数据同步需求: 本地${localCount}个，云端${cloudCount}个`);
      
      if (localCount > 0 && cloudCount > 0 && areDataDifferent(currentWebsites, cloudWebsites)) {
        console.log('📊 检测到本地和云端数据差异，显示同步对话框');
        setShowSyncModal(true);
        setSyncProcessed(true); // 避免重复检查
      } else if (cloudCount > 0 && localCount === 0) {
        // 本地无数据，直接使用云端数据
        console.log('🆕 本地无数据，自动同步云端数据');
        setWebsites(cloudWebsites);
        setSyncProcessed(true);
        
        // 触发图标预缓存
        setTimeout(() => {
          console.log('🚀 开始为新同步的网站预缓存图标...');
          import('@/lib/faviconCache').then(({ faviconCache }) => {
            faviconCache.batchCacheFaviconsToIndexedDB(cloudWebsites)
              .then(() => console.log('✅ 登录后图标预缓存完成'))
              .catch(error => console.warn('❌ 登录后图标预缓存失败:', error));
          });
        }, 1000);
      } else if (localCount > 0 && cloudCount === 0) {
        // 云端无数据，本地有数据，但需要验证本地数据的有效性
        console.log('☁️ 云端无数据，检查本地数据有效性后决定是否上传');
        
        // 验证本地数据是否有效（不是空数组或无效数据）
        const validLocalWebsites = currentWebsites.filter(site => 
          site.id && site.name && site.url && 
          typeof site.id === 'string' && 
          typeof site.name === 'string' && 
          typeof site.url === 'string'
        );
        
        if (validLocalWebsites.length > 0) {
          console.log(`📤 本地有 ${validLocalWebsites.length} 个有效网站，上传到云端`);
          import('@/lib/supabaseSync').then(({ saveUserWebsites }) => {
            saveUserWebsites(currentUser, validLocalWebsites)
              .then(() => console.log('✅ 本地数据已自动上传到云端'))
              .catch(error => console.warn('❌ 自动上传失败:', error));
          });
        } else {
          console.log('⚠️ 本地数据无效，跳过自动上传，避免覆盖云端数据');
        }
        setSyncProcessed(true);
      } else if (localCount > 0 && cloudCount > 0) {
        // 每次登录都自动同步云端数据（如果数据相同）
        console.log('🔄 重新登录，自动同步云端数据');
        setWebsites(cloudWebsites);
        setSyncProcessed(true);
        
        // 触发图标预缓存
        setTimeout(() => {
          console.log('🚀 重新登录，开始预缓存图标...');
          import('@/lib/faviconCache').then(({ faviconCache }) => {
            faviconCache.batchCacheFaviconsToIndexedDB(cloudWebsites)
              .then(() => console.log('✅ 重新登录图标预缓存完成'))
              .catch(error => console.warn('❌ 重新登录图标预缓存失败:', error));
          });
        }, 1000);
      } else {
        setSyncProcessed(true);
      }
    }
  }, [shouldEnableCloudSync, currentUser, hasCloudData, cloudWebsites, syncProcessed, setWebsites]);

  // 应用云端设置（延迟到云同步启用后）
  useEffect(() => {
    if (!shouldEnableCloudSync) return;
    
    if (currentUser && currentUser.email_confirmed_at && cloudSettings) {
      console.log('⚙️ 检测到云端设置，开始应用配置');
      
      // 检测本地和云端设置差异
      const localSettings = {
        cardOpacity: parseFloat(localStorage.getItem('cardOpacity') || '0.1'),
        searchBarOpacity: parseFloat(localStorage.getItem('searchBarOpacity') || '0.1'),
        parallaxEnabled: JSON.parse(localStorage.getItem('parallaxEnabled') || 'true'),
        wallpaperResolution: localStorage.getItem('wallpaperResolution') || '1080p',
        theme: localStorage.getItem('theme') || 'light'
      };
      
      let hasConfigDifference = false;
      const differences = [];
      
      // 检测并应用各种设置
      if (typeof cloudSettings.cardOpacity === 'number' && cloudSettings.cardOpacity !== localSettings.cardOpacity) {
        differences.push(`卡片透明度: ${localSettings.cardOpacity} → ${cloudSettings.cardOpacity}`);
        setCardOpacity(cloudSettings.cardOpacity);
        hasConfigDifference = true;
      }
      if (typeof cloudSettings.searchBarOpacity === 'number' && cloudSettings.searchBarOpacity !== localSettings.searchBarOpacity) {
        differences.push(`搜索栏透明度: ${localSettings.searchBarOpacity} → ${cloudSettings.searchBarOpacity}`);
        setSearchBarOpacity(cloudSettings.searchBarOpacity);
        hasConfigDifference = true;
      }
      if (typeof cloudSettings.parallaxEnabled === 'boolean' && cloudSettings.parallaxEnabled !== localSettings.parallaxEnabled) {
        differences.push(`视差效果: ${localSettings.parallaxEnabled} → ${cloudSettings.parallaxEnabled}`);
        setParallaxEnabled(cloudSettings.parallaxEnabled);
        hasConfigDifference = true;
      }
      if (cloudSettings.wallpaperResolution && cloudSettings.wallpaperResolution !== localSettings.wallpaperResolution) {
        differences.push(`壁纸分辨率: ${localSettings.wallpaperResolution} → ${cloudSettings.wallpaperResolution}`);
        setWallpaperResolution(cloudSettings.wallpaperResolution);
        hasConfigDifference = true;
      }
      if (cloudSettings.theme && cloudSettings.theme !== localSettings.theme) {
        differences.push(`主题: ${localSettings.theme} → ${cloudSettings.theme}`);
        localStorage.setItem('theme', cloudSettings.theme);
        hasConfigDifference = true;
      }
      
      if (hasConfigDifference) {
        console.log('🔄 检测到配置差异，已应用云端设置:');
        differences.forEach(diff => console.log(`  - ${diff}`));
      } else {
        console.log('✅ 本地和云端配置一致，无需同步');
      }
    }
  }, [shouldEnableCloudSync, currentUser, cloudSettings, setCardOpacity, setSearchBarOpacity, setParallaxEnabled, setWallpaperResolution]);

  // 处理数据同步选择
  const handleSyncChoice = async (choice: 'local' | 'cloud' | 'merge') => {
    if (!currentUser || !cloudWebsites) return;

    try {
      let finalData: WebsiteData[] = [];

      switch (choice) {
        case 'cloud':
          // 使用云端数据
          finalData = cloudWebsites;
          setWebsites(finalData);
          console.log('☁️ 已应用云端数据');
          break;
          
        case 'local':
          // 使用本地数据，同步到云端
          finalData = websites;
          await saveUserWebsites(currentUser, finalData);
          console.log('📤 已上传本地数据到云端');
          break;
          
        case 'merge':
          // 智能合并数据
          finalData = mergeWithLocalData(websites);
          setWebsites(finalData);
          await saveUserWebsites(currentUser, finalData);
          console.log('🔀 已合并本地和云端数据');
          break;
      }

      setSyncProcessed(true);
      
      // 同步完成后触发图标预缓存
      if (finalData.length > 0) {
        setTimeout(() => {
          console.log('🚀 数据同步完成，开始预缓存图标...');
          import('@/lib/faviconCache').then(({ faviconCache }) => {
            faviconCache.batchCacheFaviconsToIndexedDB(finalData)
              .then(() => console.log('✅ 同步后图标预缓存完成'))
              .catch(error => console.warn('❌ 同步后图标预缓存失败:', error));
          });
        }, 500);
      }
    } catch (error) {
      console.error('❌ 数据同步失败:', error);
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Home websites={websites} setWebsites={setWebsites} />} />
      </Routes>
      
      {showSyncModal && cloudWebsites && (
        <DataSyncModal
          isOpen={showSyncModal}
          onClose={() => {
            setShowSyncModal(false);
            setSyncProcessed(true);
          }}
          localWebsites={websites}
          cloudWebsites={cloudWebsites}
          onChoice={handleSyncChoice}
        />
      )}
      
      {/* Cookie同意横幅 */}
      <CookieConsent 
        onAccept={() => {
          console.log('✅ 用户接受Cookie使用，启用完整功能');
        }}
        onDecline={() => {
          console.log('❌ 用户拒绝Cookie使用，限制数据存储');
        }}
        onCustomize={() => {
          setShowPrivacySettings(true);
        }}
      />
      
      {/* 隐私设置面板 */}
      {showPrivacySettings && (
        <PrivacySettings
          isOpen={showPrivacySettings}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}

      {/* 网络状态监控 */}
      <NetworkStatus />
    </>
  );
}

export default function App() {
  return (
    <SupabaseErrorBoundary>
      <AuthProvider>
        <UserProfileProvider>
          <SyncProvider>
            <TransparencyProvider>
              <WorkspaceProvider>
                <DndProvider backend={HTML5Backend}>
                  <AppContent />
                </DndProvider>
              </WorkspaceProvider>
            </TransparencyProvider>
          </SyncProvider>
        </UserProfileProvider>
      </AuthProvider>
    </SupabaseErrorBoundary>
  );
}
