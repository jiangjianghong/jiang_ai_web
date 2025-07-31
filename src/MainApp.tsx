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
import { useCloudData } from '@/hooks/useCloudData';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWebsiteData } from '@/hooks/useWebsiteData';

// 内部应用组件，可以使用认证上下文
function AppContent() {
  console.log('🏠 MainApp AppContent 组件渲染');

  // 使用页面标题hook
  usePageTitle();

  // 启用资源预加载
  useResourcePreloader();

  // 认证状态
  const { currentUser } = useAuth();

  // 使用统一的网站数据管理
  const { websites, setWebsites } = useWebsiteData();
  
  // 云端数据同步状态
  const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState(false);

  // 始终启用云端数据监听（hook内部会处理用户状态）
  const { cloudWebsites, hasCloudData } = useCloudData(true);

  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // 存储管理已由 useWebsiteData 处理

  // 云端数据同步逻辑（仅在首次登录时执行一次）
  useEffect(() => {
    if (currentUser && currentUser.email_confirmed_at && hasCloudData && cloudWebsites && !hasLoadedFromCloud) {
      console.log('☁️ 首次检测到云端数据，开始同步:', {
        cloudCount: cloudWebsites.length,
        localCount: websites.length,
        hasLoadedFromCloud,
        userEmail: currentUser.email
      });

      // 如果云端有数据，使用云端数据（简化逻辑）
      if (cloudWebsites.length > 0) {
        console.log('📥 使用云端数据');
        setWebsites(cloudWebsites);
        setHasLoadedFromCloud(true);
      } else {
        console.log('📝 云端无数据，保持本地数据');
        setHasLoadedFromCloud(true);
      }
    }
  }, [currentUser, hasCloudData, cloudWebsites, hasLoadedFromCloud, websites.length]);

  // 重置加载状态（当用户登出时）
  useEffect(() => {
    if (!currentUser) {
      setHasLoadedFromCloud(false);
    }
  }, [currentUser]);

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
