import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
// import { mockWebsites } from '@/lib/mockData'; // 已删除
import { TransparencyProvider } from '@/contexts/TransparencyContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { WebsiteData } from '@/lib/supabaseSync';
import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useResourcePreloader } from '@/hooks/useResourcePreloader';
import CookieConsent from '@/components/CookieConsent';
import PrivacySettings from '@/components/PrivacySettings';
import { useStorage } from '@/lib/storageManager';

// 内部应用组件，可以使用认证上下文
function AppContent() {
  // 移除调试日志，使用新的日志系统
  
  // 使用页面标题hook
  usePageTitle();
  
  // 启用资源预加载
  useResourcePreloader();
  
  // 存储管理
  const storage = useStorage();
  
  // 优先从存储管理器读取卡片数据
  const [websites, setWebsites] = useState(() => {
    const saved = storage.getItem<WebsiteData[]>('websites');
    if (saved) {
      return saved;
    }
    return []; // 使用空数组替代mockWebsites
  });

  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // 持久化到存储管理器
  useEffect(() => {
    storage.setItem('websites', websites);
  }, [websites, storage]);

  // 移除调试日志，使用新的日志系统

  return (
    <>
      <Routes>
        <Route path="/" element={<Home websites={websites} setWebsites={setWebsites} />} />
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
  // 移除调试日志，使用新的日志系统
  
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
