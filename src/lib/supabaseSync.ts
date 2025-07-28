// Supabase 数据同步工具
import { supabase, TABLES } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { WallpaperResolution } from '@/contexts/TransparencyContext';
import { logger } from './logger';

// 用户设置接口
export interface UserSettings {
  cardOpacity: number;
  searchBarOpacity: number;
  parallaxEnabled: boolean;
  wallpaperResolution: WallpaperResolution;
  theme: string;
  lastSync: string;
}

// 网站数据接口
export interface WebsiteData {
  id: string;
  name: string;
  url: string;
  favicon: string;
  tags: string[];
  visitCount: number;
  lastVisit: string;
  note?: string;
}

// 同步状态回调接口
export interface SyncStatusCallback {
  onSyncStart?: () => void;
  onSyncSuccess?: (message: string) => void;
  onSyncError?: (error: string) => void;
}

// 用户资料接口
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

// 网络重试工具函数
const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // 指数退避延迟
      const waitTime = delay * Math.pow(2, i);
      logger.sync.info(`同步失败，${waitTime}ms后重试 (${i + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};

// 保存用户设置到 Supabase - 带重试机制
export const saveUserSettings = async (
  user: User, 
  settings: UserSettings, 
  callbacks?: SyncStatusCallback
) => {
  try {
    callbacks?.onSyncStart?.();
    
    await retryAsync(async () => {
      const { error } = await supabase
        .from(TABLES.USER_SETTINGS)
        .upsert({
          id: user.id,
          card_opacity: settings.cardOpacity,
          search_bar_opacity: settings.searchBarOpacity,
          parallax_enabled: settings.parallaxEnabled,
          wallpaper_resolution: settings.wallpaperResolution,
          theme: settings.theme,
          last_sync: new Date().toISOString()
        });

      if (error) throw error;
    });
    
    logger.sync.info('用户设置已同步到云端');
    callbacks?.onSyncSuccess?.('设置已同步到云端');
    return true;
  } catch (error) {
    logger.sync.error('保存用户设置失败', error);
    callbacks?.onSyncError?.('设置同步失败: ' + (error as Error).message);
    return false;
  }
};

// 从 Supabase 获取用户设置
export const getUserSettings = async (user: User): Promise<UserSettings | null> => {
  try {
    // 添加超时机制，避免长时间等待
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('连接超时')), 5000)
    );
    
    const dataPromise = supabase
      .from(TABLES.USER_SETTINGS)
      .select('*')
      .eq('id', user.id)
      .single();
    
    const { data, error } = await Promise.race([dataPromise, timeoutPromise]);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      throw error;
    }
    
    if (data) {
      logger.sync.info('从云端获取用户设置成功');
      return {
        cardOpacity: data.card_opacity,
        searchBarOpacity: data.search_bar_opacity,
        parallaxEnabled: data.parallax_enabled,
        wallpaperResolution: data.wallpaper_resolution,
        theme: data.theme,
        lastSync: data.last_sync
      };
    } else {
      logger.sync.debug('用户设置不存在，将使用默认设置');
      return null;
    }
  } catch (error) {
    logger.sync.error('获取用户设置失败', error);
    // 离线模式下直接返回 null，不阻塞界面
    return null;
  }
};

// 保存用户网站数据到 Supabase
export const saveUserWebsites = async (
  user: User, 
  websites: WebsiteData[], 
  callbacks?: SyncStatusCallback
) => {
  try {
    callbacks?.onSyncStart?.();
    
    await retryAsync(async () => {
      const { error } = await supabase
        .from(TABLES.USER_WEBSITES)
        .upsert({
          id: user.id,
          websites: websites,
          last_sync: new Date().toISOString()
        });

      if (error) throw error;
    });
    
    logger.sync.info('网站数据已同步到云端');
    callbacks?.onSyncSuccess?.('网站数据已同步到云端');
    return true;
  } catch (error) {
    logger.sync.error('保存网站数据失败', error);
    callbacks?.onSyncError?.('网站数据同步失败: ' + (error as Error).message);
    return false;
  }
};

// 从 Supabase 获取用户网站数据
export const getUserWebsites = async (user: User): Promise<WebsiteData[] | null> => {
  try {
    // 添加超时机制，避免长时间等待
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('连接超时')), 5000)
    );
    
    const dataPromise = supabase
      .from(TABLES.USER_WEBSITES)
      .select('*')
      .eq('id', user.id)
      .single();
    
    const { data, error } = await Promise.race([dataPromise, timeoutPromise]);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      throw error;
    }
    
    if (data) {
      logger.sync.info('从云端获取网站数据成功');
      return data.websites as WebsiteData[];
    } else {
      logger.sync.debug('用户网站数据不存在');
      return null;
    }
  } catch (error) {
    logger.sync.error('获取网站数据失败', error);
    // 离线模式下直接返回 null，不阻塞界面
    return null;
  }
};

// 合并本地和云端数据 - 改进版本，避免数据丢失
export const mergeWebsiteData = (localData: WebsiteData[], cloudData: WebsiteData[]): WebsiteData[] => {
  const merged: { [key: string]: WebsiteData } = {};
  
  // 先添加本地数据
  localData.forEach(item => {
    merged[item.id] = { ...item };
  });
  
  // 智能合并云端数据
  cloudData.forEach(item => {
    const existing = merged[item.id];
    if (!existing) {
      // 如果本地没有，直接使用云端数据
      merged[item.id] = { ...item };
    } else {
      // 比较最后访问时间，选择更新的数据作为基础
      const localTime = new Date(existing.lastVisit || '2000-01-01').getTime();
      const cloudTime = new Date(item.lastVisit || '2000-01-01').getTime();
      
      let finalData: WebsiteData;
      
      if (cloudTime > localTime) {
        // 云端数据更新，使用云端数据作为基础
        finalData = { ...item };
      } else if (localTime > cloudTime) {
        // 本地数据更新，使用本地数据作为基础
        finalData = { ...existing };
      } else {
        // 时间相同，使用访问次数更高的
        finalData = item.visitCount > existing.visitCount ? { ...item } : { ...existing };
      }
      
      // 保留较高的访问次数（累积值）
      finalData.visitCount = Math.max(existing.visitCount || 0, item.visitCount || 0);
      
      // 保留最新的访问时间
      finalData.lastVisit = localTime > cloudTime ? existing.lastVisit : item.lastVisit;
      
      merged[item.id] = finalData;
    }
  });
  
  return Object.values(merged);
};

// 自动同步数据（防抖处理）- 增强版本，带重试机制
let syncTimeout: NodeJS.Timeout | null = null;
let retryCount = 0;
const maxRetries = 3;

export const autoSync = (
  user: User, 
  websites: WebsiteData[], 
  settings: UserSettings,
  callbacks?: SyncStatusCallback
) => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(async () => {
    callbacks?.onSyncStart?.();
    
    try {
      const results = await Promise.allSettled([
        saveUserWebsites(user, websites),
        saveUserSettings(user, settings)
      ]);
      
      const failed = results.filter(result => result.status === 'rejected');
      
      if (failed.length === 0) {
        retryCount = 0; // 重置重试计数器
        callbacks?.onSyncSuccess?.('数据已静默同步到云端');
      } else {
        if (retryCount < maxRetries) {
          retryCount++;
          logger.sync.warn(`同步部分失败，${retryCount}/${maxRetries} 次重试中`);
          // 指数退避重试
          setTimeout(() => {
            autoSync(user, websites, settings, callbacks);
          }, 1000 * Math.pow(2, retryCount - 1));
        } else {
          retryCount = 0;
          callbacks?.onSyncError?.(`${failed.length} 个数据同步失败，已重试 ${maxRetries} 次`);
        }
      }
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        logger.sync.warn(`同步异常，${retryCount}/${maxRetries} 次重试中`);
        setTimeout(() => {
          autoSync(user, websites, settings, callbacks);
        }, 1000 * Math.pow(2, retryCount - 1));
      } else {
        retryCount = 0;
        callbacks?.onSyncError?.('同步过程中发生错误: ' + (error as Error).message);
      }
    }
  }, 5000); // 5秒延迟，用户停止操作后快速同步
};

// 保存用户资料到 Supabase
export const saveUserProfile = async (
  user: User, 
  displayName: string, 
  callbacks?: SyncStatusCallback
) => {
  try {
    callbacks?.onSyncStart?.();
    
    const { error } = await supabase
      .from(TABLES.USER_PROFILES)
      .upsert({
        id: user.id,
        email: user.email || '',
        display_name: displayName
      });

    if (error) throw error;
    
    logger.sync.info('用户资料已同步到云端');
    callbacks?.onSyncSuccess?.('用户资料已保存');
    return true;
  } catch (error) {
    logger.sync.error('保存用户资料失败', error);
    callbacks?.onSyncError?.('用户资料保存失败: ' + (error as Error).message);
    return false;
  }
};

// 获取用户资料
export const getUserProfile = async (user: User): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      throw error;
    }
    
    if (data) {
      logger.sync.info('从云端获取用户资料成功');
      return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } else {
      logger.sync.debug('用户资料不存在');
      return null;
    }
  } catch (error) {
    logger.sync.error('获取用户资料失败', error);
    return null;
  }
};
