import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSyncStatus } from '@/contexts/SyncContext';
import { useTransparency } from '@/contexts/TransparencyContext';
import { autoSync, UserSettings, WebsiteData } from '@/lib/supabaseSync';

export function useAutoSync(websites: WebsiteData[]) {
  const { currentUser } = useAuth();
  const { updateSyncStatus } = useSyncStatus();
  const { 
    cardOpacity, 
    searchBarOpacity, 
    parallaxEnabled, 
    wallpaperResolution,
    autoSyncEnabled,
    autoSyncInterval
  } = useTransparency();
  
  // 用于存储上次同步的数据指纹，避免重复同步
  const lastSyncDataRef = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncInProgressRef = useRef<boolean>(false);

  // 同步函数
  const performSync = useCallback((force = false) => {
    // 防止并发同步
    if (syncInProgressRef.current && !force) {
      console.log('🔒 同步正在进行中，跳过重复请求');
      return;
    }

    // 检查网络连接状态
    if (!navigator.onLine) {
      updateSyncStatus({ 
        syncInProgress: false,
        syncError: '网络连接断开，无法同步数据',
        pendingChanges: 1
      });
      return;
    }

    // 只有登录且邮箱已验证的用户才能同步数据
    if (!currentUser || !currentUser.email_confirmed_at) {
      if (currentUser && !currentUser.email_confirmed_at) {
        updateSyncStatus({ 
          syncInProgress: false,
          syncError: '请先验证邮箱才能同步数据到云端',
          pendingChanges: 1
        });
      }
      return;
    }

    // 检查是否有编辑模态框打开，避免在用户编辑时同步
    const hasOpenModal = document.querySelector('[role="dialog"]') || 
                        document.querySelector('.modal') ||
                        document.querySelector('[data-modal]');
    
    if (hasOpenModal && !force) {
      console.log('🛑 检测到编辑窗口打开，延迟同步');
      // 延迟5秒后重试
      setTimeout(() => performSync(false), 5000);
      return;
    }

    const settings: UserSettings = {
      cardOpacity,
      searchBarOpacity,
      parallaxEnabled,
      wallpaperResolution,
      theme: localStorage.getItem('theme') || 'light',
      lastSync: new Date().toISOString()
    };

    console.log(force ? '⏰ 强制执行数据同步...' : '🚀 开始执行数据同步...');
    
    // 标记同步进行中
    syncInProgressRef.current = true;

    // 验证网站数据有效性，避免上传空数据覆盖云端
    const validWebsites = websites.filter(site => 
      site.id && site.name && site.url && 
      typeof site.id === 'string' && 
      typeof site.name === 'string' && 
      typeof site.url === 'string'
    );
    
    // 如果没有有效数据，跳过同步
    if (validWebsites.length === 0 && websites.length === 0) {
      console.log('⚠️ 没有有效的网站数据，跳过自动同步');
      syncInProgressRef.current = false;
      return;
    }
    
    // 自动同步数据
    autoSync(currentUser, validWebsites, settings, {
      onSyncStart: () => {
        updateSyncStatus({ 
          syncInProgress: true, 
          syncError: null,
          pendingChanges: 0
        });
      },
      onSyncSuccess: (message) => {
        // 更新数据指纹，标记为已同步
        const currentDataFingerprint = JSON.stringify({
          websites: websites.map(w => ({ id: w.id, name: w.name, url: w.url, visitCount: w.visitCount })),
          settings: { cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution, theme: settings.theme }
        });
        lastSyncDataRef.current = currentDataFingerprint;
        
        // 重置同步状态
        syncInProgressRef.current = false;
        
        updateSyncStatus({ 
          syncInProgress: false, 
          lastSyncTime: new Date(),
          syncError: null,
          pendingChanges: 0
        });
        console.log('✅ 同步成功:', message);
      },
      onSyncError: (error) => {
        // 重置同步状态
        syncInProgressRef.current = false;
        
        updateSyncStatus({ 
          syncInProgress: false, 
          syncError: error,
          pendingChanges: 1
        });
        console.error('❌ 同步失败:', error);
      }
    });
  }, [currentUser, websites, cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution, updateSyncStatus]);

  // 简单的防抖同步
  useEffect(() => {
    // 如果自动同步被禁用，清除计时器并返回
    if (!autoSyncEnabled) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      console.log('⏸️ 自动同步已禁用');
      return;
    }

    // 创建当前数据的指纹，用于比较是否有变化
    const currentDataFingerprint = JSON.stringify({
      websites: websites.map(w => ({ id: w.id, name: w.name, url: w.url, visitCount: w.visitCount })),
      settings: { cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution, theme: localStorage.getItem('theme') || 'light' }
    });

    // 如果数据没有变化，不重置计时器
    if (currentDataFingerprint === lastSyncDataRef.current) {
      return;
    }

    // 简化日志，避免频繁输出
    if (process.env.NODE_ENV === 'development') {
      if (lastSyncDataRef.current !== '' && !syncInProgressRef.current) {
        console.log(`🔄 检测到数据变化，将在 ${autoSyncInterval}s 后同步`);
      }
    }
    
    // 清除之前的防抖计时器
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // 使用用户设置的同步间隔（转换为毫秒）
    const syncDelayMs = autoSyncInterval * 1000;

    // 设置同步延迟
    syncTimeoutRef.current = setTimeout(() => {
      console.log(`🚀 ${autoSyncInterval}s 延迟结束，开始同步`);
      performSync(false);
    }, syncDelayMs);

    // 清理函数
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [currentUser, websites, cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution, autoSyncEnabled, autoSyncInterval, performSync]);

  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
}
