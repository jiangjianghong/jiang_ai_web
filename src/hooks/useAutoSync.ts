import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncStatus } from '@/contexts/SyncContext';
import { useTransparency } from '@/contexts/TransparencyContext';
import { autoSync, UserSettings, WebsiteData } from '@/lib/firebaseSync';

export function useAutoSync(websites: WebsiteData[]) {
  const { currentUser } = useAuth();
  const { updateSyncStatus } = useSyncStatus();
  const { cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution } = useTransparency();
  
  // 用于存储上次同步的数据指纹，避免重复同步
  const lastSyncDataRef = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastChangeTimeRef = useRef<number>(0);

  // 同步函数
  const performSync = useCallback((force = false) => {
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
    if (!currentUser || !currentUser.emailVerified) {
      if (currentUser && !currentUser.emailVerified) {
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
      lastSync: null
    };

    console.log(force ? '⏰ 强制执行数据同步...' : '🚀 开始执行数据同步...');

    // 自动同步数据
    autoSync(currentUser, websites, settings, {
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
        lastChangeTimeRef.current = 0; // 重置变更时间
        
        updateSyncStatus({ 
          syncInProgress: false, 
          lastSyncTime: new Date(),
          syncError: null,
          pendingChanges: 0
        });
        console.log('✅ 同步成功:', message);
      },
      onSyncError: (error) => {
        updateSyncStatus({ 
          syncInProgress: false, 
          syncError: error,
          pendingChanges: 1
        });
        console.error('❌ 同步失败:', error);
      }
    });
  }, [currentUser, websites, cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution, updateSyncStatus]);

  // 智能防抖同步：结合防抖和最大等待时间
  useEffect(() => {
    // 创建当前数据的指纹，用于比较是否有变化
    const currentDataFingerprint = JSON.stringify({
      websites: websites.map(w => ({ id: w.id, name: w.name, url: w.url, visitCount: w.visitCount })),
      settings: { cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution, theme: localStorage.getItem('theme') || 'light' }
    });

    // 如果数据没有变化，不重置计时器
    if (currentDataFingerprint === lastSyncDataRef.current) {
      // 数据未变化，静默返回
      return;
    }

    // 简化日志，避免频繁输出
    if (process.env.NODE_ENV === 'development') {
      // 只在数据真正变化时输出日志，避免噪音
      if (lastSyncDataRef.current !== '') {
        console.log('🔄 检测到数据变化，更新同步策略');
      }
    }
    const now = Date.now();
    
    // 如果是第一次检测到变化，记录时间
    if (lastChangeTimeRef.current === 0) {
      lastChangeTimeRef.current = now;
      // 移除频繁的日志输出
    }
    
    // 清除之前的防抖计时器
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // 计算距离首次变化的时间
    const timeSinceFirstChange = now - lastChangeTimeRef.current;
    const maxWaitTime = 45000; // 45秒最大等待时间，给用户更多编辑时间
    const debounceTime = 5000; // 5秒防抖时间，避免频繁同步

    // 如果距离首次变化超过最大等待时间，立即同步
    if (timeSinceFirstChange >= maxWaitTime) {
      console.log('⏰ 达到最大等待时间，立即强制同步');
      // 清除强制同步计时器
      if (forceSyncTimeoutRef.current) {
        clearTimeout(forceSyncTimeoutRef.current);
        forceSyncTimeoutRef.current = null;
      }
      performSync(true);
      return;
    }

    // 设置防抖计时器：5秒后执行同步
    syncTimeoutRef.current = setTimeout(() => {
      performSync(false);
    }, debounceTime);

    // 如果还没有设置强制同步计时器，设置一个
    if (!forceSyncTimeoutRef.current) {
      const remainingTime = maxWaitTime - timeSinceFirstChange;
      console.log(`⏲️ 设置强制同步计时器，${Math.round(remainingTime / 1000)}秒后强制同步`);
      
      forceSyncTimeoutRef.current = setTimeout(() => {
        console.log('⏰ 强制同步计时器触发');
        // 清除防抖计时器
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        performSync(true);
      }, remainingTime);
    }

    // 清理函数
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [currentUser, websites, cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution, performSync]);

  // 组件卸载时清理所有计时器
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (forceSyncTimeoutRef.current) {
        clearTimeout(forceSyncTimeoutRef.current);
      }
    };
  }, []);
}
