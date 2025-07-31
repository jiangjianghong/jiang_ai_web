import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSyncStatus } from '@/contexts/SyncContext';
import { useTransparency } from '@/contexts/TransparencyContext';
import { autoSync, UserSettings, WebsiteData } from '@/lib/supabaseSync';
import { User } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// 统一的前置检查函数
interface PreSyncCheckResult {
  canSync: boolean;
  error?: string;
  hasPendingChanges: boolean;
}

function performPreSyncChecks(currentUser: User | null, isOnline: boolean): PreSyncCheckResult {
  // 检查网络连接状态
  if (!isOnline) {
    return {
      canSync: false,
      error: '网络连接断开，无法同步数据',
      hasPendingChanges: true
    };
  }

  // 检查用户登录状态
  if (!currentUser) {
    return {
      canSync: false,
      error: '用户未登录',
      hasPendingChanges: false
    };
  }

  // 检查邮箱验证状态
  if (!currentUser.email_confirmed_at) {
    return {
      canSync: false,
      error: '请先验证邮箱才能同步数据到云端',
      hasPendingChanges: true
    };
  }

  return {
    canSync: true,
    hasPendingChanges: false
  };
}

export function useAutoSync(websites: WebsiteData[]): void {
  const { currentUser } = useAuth();
  const { updateSyncStatus } = useSyncStatus();
  const {
    cardOpacity,
    searchBarOpacity,
    parallaxEnabled,
    wallpaperResolution,
    cardColor,
    searchBarColor,
    autoSyncEnabled,
    autoSyncInterval
  } = useTransparency();

  // 用于存储上次同步的数据指纹，避免重复同步
  const lastSyncDataRef = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncInProgressRef = useRef<boolean>(false);

  // 缓存主题设置，避免频繁访问localStorage
  const cachedTheme = useMemo(() => {
    return localStorage.getItem('theme') || 'light';
  }, [websites.length]); // 使用 websites.length 作为依赖，确保主题变化被检测

  // 优化数据指纹计算，使用useMemo缓存
  const websiteFingerprint = useMemo(() => {
    return websites.map(w => ({ id: w.id, name: w.name, url: w.url, visitCount: w.visitCount }));
  }, [websites]);

  const settingsFingerprint = useMemo(() => {
    return {
      cardOpacity,
      searchBarOpacity,
      parallaxEnabled,
      wallpaperResolution,
      cardColor,
      searchBarColor,
      autoSyncEnabled,
      autoSyncInterval,
      theme: cachedTheme
    };
  }, [cardOpacity, searchBarOpacity, parallaxEnabled, wallpaperResolution, cardColor, searchBarColor, autoSyncEnabled, autoSyncInterval, cachedTheme]);

  // 同步函数
  const performSync = useCallback((force = false): Promise<void> => {
    // 原子性检查和设置，防止并发同步
    if (syncInProgressRef.current && !force) {
      console.log('🔒 同步正在进行中，跳过重复请求');
      return Promise.resolve();
    }

    // 立即设置同步状态，防止竞争条件
    syncInProgressRef.current = true;

    // 统一的前置条件检查和错误处理
    const preCheckResult = performPreSyncChecks(currentUser, navigator.onLine);
    if (!preCheckResult.canSync) {
      syncInProgressRef.current = false; // 重置同步状态
      updateSyncStatus({
        syncInProgress: false,
        syncError: preCheckResult.error,
        pendingChanges: preCheckResult.hasPendingChanges ? 1 : 0
      });
      return Promise.resolve();
    }

    // 此时currentUser已经通过检查，不会为null
    const user = currentUser!;

    // 检查是否有编辑模态框打开，避免在用户编辑时同步
    const hasOpenModal = document.querySelector('[role="dialog"]') ||
      document.querySelector('.modal') ||
      document.querySelector('[data-modal]');

    if (hasOpenModal && !force) {
      console.log('🛑 检测到编辑窗口打开，跳过本次同步');
      syncInProgressRef.current = false; // 重置同步状态
      return Promise.resolve();
    }

    const settings: UserSettings = {
      cardOpacity,
      searchBarOpacity,
      parallaxEnabled,
      wallpaperResolution,
      theme: cachedTheme,
      cardColor,
      searchBarColor,
      autoSyncEnabled,
      autoSyncInterval,
      lastSync: new Date().toISOString()
    };

    console.log(force ? '⏰ 强制执行数据同步...' : '🚀 开始执行数据同步...');

    // 验证网站数据有效性，避免上传空数据覆盖云端
    const validWebsites = websites.filter(site => {
      // 基本字段检查
      if (!site.id || !site.name || !site.url ||
        typeof site.id !== 'string' ||
        typeof site.name !== 'string' ||
        typeof site.url !== 'string') {
        return false;
      }

      // URL格式验证
      try {
        new URL(site.url);
      } catch {
        logger.sync.warn('无效的URL格式', { url: site.url, id: site.id });
        return false;
      }

      // 其他字段类型检查
      if (site.visitCount !== undefined && typeof site.visitCount !== 'number') {
        return false;
      }

      if (site.tags !== undefined && !Array.isArray(site.tags)) {
        return false;
      }

      return true;
    });

    // 如果没有有效数据，跳过同步
    if (validWebsites.length === 0 && websites.length === 0) {
      console.log('⚠️ 没有有效的网站数据，跳过自动同步');
      syncInProgressRef.current = false;
      return Promise.resolve();
    }

    // 自动同步数据
    return autoSync(user, validWebsites, settings, {
      onSyncStart: () => {
        updateSyncStatus({
          syncInProgress: true,
          syncError: null,
          pendingChanges: 0
        });
      },
      onSyncSuccess: (message) => {
        // 更新数据指纹，标记为已同步
        const syncedDataFingerprint = JSON.stringify({
          websites: websiteFingerprint,
          settings: settingsFingerprint
        });
        lastSyncDataRef.current = syncedDataFingerprint;

        // 重置同步状态
        syncInProgressRef.current = false;

        updateSyncStatus({
          syncInProgress: false,
          lastSyncTime: new Date(),
          syncError: null,
          pendingChanges: 0
        });
        logger.sync.info('同步成功', { message });
      },
      onSyncError: (error) => {
        // 重置同步状态
        syncInProgressRef.current = false;

        updateSyncStatus({
          syncInProgress: false,
          syncError: error,
          pendingChanges: 1
        });
        logger.sync.error('同步失败', error);
      }
    }).catch((error) => {
      // 确保同步状态被重置
      syncInProgressRef.current = false;
      updateSyncStatus({
        syncInProgress: false,
        syncError: error instanceof Error ? error.message : '同步失败',
        pendingChanges: 1
      });
      logger.sync.error('同步异常', error);
      // 不重新抛出异常，避免未处理的Promise rejection
    });
  }, [currentUser, websites, websiteFingerprint, settingsFingerprint, cachedTheme, updateSyncStatus]);

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
      websites: websiteFingerprint,
      settings: settingsFingerprint
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
      performSync(false).catch(error => {
        logger.sync.error('延迟同步执行失败', error);
      });
    }, syncDelayMs);

    // 清理函数
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [currentUser, websiteFingerprint, settingsFingerprint, autoSyncEnabled, autoSyncInterval, performSync]);

  // 组件卸载时清理计时器和重置状态
  useEffect(() => {
    return () => {
      // 清理防抖计时器
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      // 重置同步状态，防止内存泄漏
      syncInProgressRef.current = false;
      lastSyncDataRef.current = '';

      // 不在清理函数中调用updateSyncStatus，避免无限循环
      // 组件卸载时不需要更新状态，因为组件已经不存在了
    };
  }, []); // 空依赖数组，只在组件挂载和卸载时执行
}
