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

import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { mockWebsites } from '@/lib/mockData';
import { TransparencyProvider } from '@/contexts/TransparencyContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { useState, useEffect } from 'react';

// 内部应用组件，可以使用认证上下文
function AppContent() {
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

  // 持久化到 localStorage
  useEffect(() => {
    localStorage.setItem('websites', JSON.stringify(websites));
  }, [websites]);

  return (
    <Routes>
      <Route path="/" element={<Home websites={websites} setWebsites={setWebsites} />} />
    </Routes>
  );
}

  return (
    <AuthProvider>
      <UserProfileProvider>
        <SyncProvider>
          <TransparencyProvider>
            <DndProvider backend={HTML5Backend}>
              <Routes>
                <Route path="/" element={<Home websites={websites} setWebsites={setWebsites} />} />
              </Routes>
            </DndProvider>
          </TransparencyProvider>
        </SyncProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
