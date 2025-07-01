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

// 内部应用组件，可以使用认证上下文
function AppContent() {
  const { currentUser } = useAuth();
  const { cloudWebsites, hasCloudData, mergeWithLocalData } = useCloudData();
  
  // 优先从 localStorage 读取卡片数据
  const [websites, setWebsites] = useState(() => {
    const saved = localStorage.getItem('websites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return mockWebsites;
      }
    }
    return mockWebsites;
  });

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncProcessed, setSyncProcessed] = useState(false);

  // 持久化到 localStorage
  useEffect(() => {
    localStorage.setItem('websites', JSON.stringify(websites));
  }, [websites]);

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
