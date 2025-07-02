import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { mockWebsites } from '@/lib/mockData';
import { TransparencyProvider } from '@/contexts/TransparencyContext';
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
  
  // 启用资源预加载
  useResourcePreloader();
  
  // 存储管理
  const storage = useStorage();
  
  const { currentUser } = useAuth();
  const { cloudWebsites, hasCloudData, mergeWithLocalData } = useCloudData();
  
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
  }, [currentUser, hasCloudData, cloudWebsites, websites.length, syncProcessed]);

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
