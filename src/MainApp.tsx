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
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { saveUserWebsites, WebsiteData } from '@/lib/supabaseSync';
import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useResourcePreloader } from '@/hooks/useResourcePreloader';
import CookieConsent from '@/components/CookieConsent';
import PrivacySettings from '@/components/PrivacySettings';
import { useStorage } from '@/lib/storageManager';
import { areDataDifferent } from '@/lib/syncUtils';

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
  const { cloudWebsites, cloudSettings, hasCloudData, mergeWithLocalData } = useCloudData();
  const { 
    setCardOpacity, 
    setSearchBarOpacity, 
    setParallaxEnabled, 
    setWallpaperResolution 
  } = useTransparency();
  
  // 优先从存储管理器读取卡片数据
  const [websites, setWebsites] = useState(() => {
    const saved = storage.getItem<WebsiteData[]>('websites');
    if (saved) {
      return saved;
    }
    return mockWebsites;
  });

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncProcessed, setSyncProcessed] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // 持久化到存储管理器
  useEffect(() => {
    storage.setItem('websites', websites);
  }, [websites, storage]);

  // 检查是否需要显示数据同步对话框
  useEffect(() => {
    if (currentUser && currentUser.email_confirmed_at && hasCloudData && cloudWebsites && !syncProcessed) {
      // 使用优化的数据比较函数
      const localCount = websites.length;
      const cloudCount = cloudWebsites.length;
      
      if (localCount > 0 && cloudCount > 0 && areDataDifferent(websites, cloudWebsites)) {
        setShowSyncModal(true);
      } else if (cloudCount > 0 && localCount === 0) {
        // 本地无数据，直接使用云端数据
        setWebsites(cloudWebsites);
        setSyncProcessed(true);
      } else {
        setSyncProcessed(true);
      }
    }
  }, [currentUser, hasCloudData, cloudWebsites, websites.length, syncProcessed, websites]);

  // 应用云端设置
  useEffect(() => {
    if (currentUser && currentUser.email_confirmed_at && cloudSettings) {
      console.log('🎨 应用云端设置:', cloudSettings);
      
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
  }, [currentUser, cloudSettings, setCardOpacity, setSearchBarOpacity, setParallaxEnabled, setWallpaperResolution]);

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
      console.log(`✅ 数据同步完成 (${choice}):`, finalData.length, '个网站');
    } catch (error) {
      console.error('❌ 数据同步失败:', error);
    }
  };

  console.log('✅ AppContent 渲染完成');

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
              <AppContent />
            </UserProfileProvider>
          </SyncProvider>
        </AuthProvider>
      </TransparencyProvider>
    </DndProvider>
  );
}
