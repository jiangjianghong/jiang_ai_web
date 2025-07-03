import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { mockWebsites } from '@/lib/mockData';
import { TransparencyProvider, useTransparency } from '@/contexts/TransparencyContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import DataSyncModal from '@/components/DataSyncModal';
import { useCloudData } from '@/hooks/useCloudData';
import { useAuth } from '@/contexts/AuthContext';
import { saveUserWebsites, WebsiteData } from '@/lib/firebaseSync';
import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useResourcePreloader } from '@/hooks/useResourcePreloader';
import CookieConsent from '@/components/CookieConsent';
import PrivacySettings from '@/components/PrivacySettings';
import { useStorage } from '@/lib/storageManager';

// 内部应用组件，可以使用认证上下文
function AppContent() {
  // 使用页面标题hook
  usePageTitle();
  
  // 存储管理
  const storage = useStorage();
  
  const { currentUser } = useAuth();
  
  // 延迟初始化标记
  const [isFirstRenderComplete, setIsFirstRenderComplete] = useState(false);
  
  // 延迟启用云数据和资源预加载，避免阻塞首屏渲染
  const shouldEnableCloudSync = isFirstRenderComplete && currentUser?.emailVerified;
  const { cloudWebsites, cloudSettings, hasCloudData, mergeWithLocalData } = useCloudData(shouldEnableCloudSync);
  
  // 在首屏渲染完成后再启用资源预加载
  useResourcePreloader(isFirstRenderComplete);
  const { 
    setCardOpacity, 
    setSearchBarOpacity, 
    setParallaxEnabled, 
    setWallpaperResolution 
  } = useTransparency();
  
  // 优先使用轻量级初始数据，避免首屏同步读取大量存储数据
  const [websites, setWebsites] = useState<WebsiteData[]>(() => {
    // 首屏只显示基础数据，避免同步读取存储
    return mockWebsites.slice(0, 6); // 只显示前6个网站，减少首屏渲染负担
  });

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncProcessed, setSyncProcessed] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // 首屏渲染完成后启用数据同步和资源预加载
  useEffect(() => {
    // 使用 setTimeout 确保首屏DOM完全渲染后再启用重型操作
    const timer = setTimeout(() => {
      setIsFirstRenderComplete(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 延迟加载完整的本地数据 - 避免循环更新
  useEffect(() => {
    if (isFirstRenderComplete) {
      const saved = storage.getItem<WebsiteData[]>('websites');
      if (saved && saved.length > 0) {
        // 静默加载本地数据
        setWebsites(saved);
      } else {
        // 使用默认数据并保存
        setWebsites(mockWebsites);
        storage.setItem('websites', mockWebsites); // 立即保存避免后续循环
      }
    }
  }, [isFirstRenderComplete]); // 移除 storage 依赖避免循环

  // 持久化到存储管理器 - 但跳过初始化阶段
  useEffect(() => {
    if (isFirstRenderComplete) {
      storage.setItem('websites', websites);
    }
  }, [websites, storage, isFirstRenderComplete]);

  // 检查是否需要显示数据同步对话框（延迟到云同步启用后）
  useEffect(() => {
    if (!shouldEnableCloudSync) return;
    
    if (currentUser && currentUser.emailVerified && hasCloudData && cloudWebsites && !syncProcessed) {
      // 检查本地数据是否与云端数据不同
      const localCount = websites.length;
      const cloudCount = cloudWebsites.length;
      
      if (localCount > 0 && cloudCount > 0 && localCount !== cloudCount) {
        setShowSyncModal(true);
      } else if (cloudCount > 0 && localCount === 0) {
        // 本地无数据，直接使用云端数据
        setWebsites(cloudWebsites);
        setSyncProcessed(true);
      } else {
        setSyncProcessed(true);
      }
    }
  }, [shouldEnableCloudSync, currentUser, hasCloudData, cloudWebsites, websites.length, syncProcessed]);

  // 应用云端设置（延迟到云同步启用后）
  useEffect(() => {
    if (!shouldEnableCloudSync) return;
    
    if (currentUser && currentUser.emailVerified && cloudSettings) {
      // 静默应用云端设置
      
      // 应用各种设置
      if (typeof cloudSettings.cardOpacity === 'number') {
        setCardOpacity(cloudSettings.cardOpacity);
      }
      if (typeof cloudSettings.searchBarOpacity === 'number') {
        setSearchBarOpacity(cloudSettings.searchBarOpacity);
      }
      if (typeof cloudSettings.parallaxEnabled === 'boolean') {
        setParallaxEnabled(cloudSettings.parallaxEnabled);
      }
      if (cloudSettings.wallpaperResolution) {
        setWallpaperResolution(cloudSettings.wallpaperResolution);
      }
      if (cloudSettings.theme) {
        localStorage.setItem('theme', cloudSettings.theme);
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
          break;
          
        case 'local':
          // 使用本地数据，同步到云端
          finalData = websites;
          await saveUserWebsites(currentUser, finalData);
          break;
          
        case 'merge':
          // 智能合并数据
          finalData = mergeWithLocalData(websites);
          setWebsites(finalData);
          await saveUserWebsites(currentUser, finalData);
          break;
      }

      setSyncProcessed(true);
      // 静默记录同步完成
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
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <SyncProvider>
          <TransparencyProvider>
            <DndProvider backend={HTML5Backend}>
              <AppContent />
            </DndProvider>
          </TransparencyProvider>
        </SyncProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
