// Supabase 数据同步工具
import { supabase, TABLES } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { WallpaperResolution } from '@/contexts/TransparencyContext';
import { logger } from './logger';
import { sanitizeWebsiteArray, sanitizeUserSettings, isDataSafeToSync, checkDataIntegrity } from './dataValidator';

// 用户设置接口
export interface UserSettings {
  cardOpacity: number;
  searchBarOpacity: number;
  parallaxEnabled: boolean;
  wallpaperResolution: WallpaperResolution;
  theme: string;
  cardColor: string;        // 卡片颜色 (RGB字符串)
  searchBarColor: string;   // 搜索框颜色 (RGB字符串)
  autoSyncEnabled: boolean; // 自动同步开关
  autoSyncInterval: number; // 自动同步间隔（秒）
  autoSortEnabled?: boolean; // 自动排序开关（可选，向后兼容）
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

    // 使用统一的数据验证和清理工具
    const validatedSettings = sanitizeUserSettings(settings);

    await retryAsync(async () => {
      // 尝试同步所有字段，如果新字段不可用则回退到基本字段
      const fullData = {
        id: user.id,
        card_opacity: validatedSettings.cardOpacity,
        search_bar_opacity: validatedSettings.searchBarOpacity,
        parallax_enabled: validatedSettings.parallaxEnabled,
        wallpaper_resolution: validatedSettings.wallpaperResolution,
        theme: validatedSettings.theme,
        card_color: validatedSettings.cardColor,
        search_bar_color: validatedSettings.searchBarColor,
        auto_sync_enabled: validatedSettings.autoSyncEnabled,
        auto_sync_interval: validatedSettings.autoSyncInterval,
        last_sync: new Date().toISOString()
      };

      const { error } = await supabase
        .from(TABLES.USER_SETTINGS)
        .upsert(fullData);

      if (error) {
        // 如果新字段导致错误，回退到基本字段
        if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          logger.sync.warn('新字段暂不可用，使用基本字段同步', { error: error.message });

          const basicData = {
            id: user.id,
            card_opacity: settings.cardOpacity,
            search_bar_opacity: settings.searchBarOpacity,
            parallax_enabled: settings.parallaxEnabled,
            wallpaper_resolution: settings.wallpaperResolution,
            theme: settings.theme,
            last_sync: new Date().toISOString()
          };

          const { error: basicError } = await supabase
            .from(TABLES.USER_SETTINGS)
            .upsert(basicData);

          if (basicError) throw basicError;

          logger.sync.info('基本字段同步成功，新字段将在数据库迁移后可用');
        } else {
          throw error;
        }
      } else {
        logger.sync.info('所有字段同步成功，包括新添加的字段');
      }
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
        // 新字段处理，如果数据库中存在则使用，否则使用默认值
        cardColor: data.card_color || '255, 255, 255',
        searchBarColor: data.search_bar_color || '255, 255, 255',
        autoSyncEnabled: data.auto_sync_enabled !== undefined ? data.auto_sync_enabled : true,
        autoSyncInterval: (data.auto_sync_interval && data.auto_sync_interval >= 3 && data.auto_sync_interval <= 300) ? data.auto_sync_interval : 30,
        lastSync: data.last_sync
      };
    } else {
      logger.sync.debug('用户设置不存在，将使用默认设置');
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.sync.error('获取用户设置失败', error);
    
    // 提供更详细的错误信息，但仍然返回 null 保持兼容性
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      logger.sync.warn('网络连接问题，将使用本地设置');
    } else if (errorMessage.includes('auth') || errorMessage.includes('JWT')) {
      logger.sync.warn('认证问题，可能需要重新登录');
    }
    
    // 离线模式下直接返回 null，不阻塞界面
    return null;
  }
};

// 保存用户网站数据到 Supabase - 增强数据验证
export const saveUserWebsites = async (
  user: User,
  websites: WebsiteData[],
  callbacks?: SyncStatusCallback
) => {
  try {
    callbacks?.onSyncStart?.();

    // 使用统一的数据验证和清理工具
    const sanitizedWebsites = sanitizeWebsiteArray(websites);

    // 检查数据完整性
    const integrityCheck = checkDataIntegrity(sanitizedWebsites);

    if (!integrityCheck.isValid || !isDataSafeToSync(sanitizedWebsites)) {
      logger.sync.warn('数据完整性检查失败，跳过同步以保护云端数据', {
        issues: integrityCheck.issues,
        validCount: integrityCheck.validCount,
        totalCount: integrityCheck.totalCount
      });
      callbacks?.onSyncError?.(`数据验证失败：${integrityCheck.issues.join(', ')}`);
      return false;
    }

    // 如果有效数据少于原数据的50%，记录警告但继续同步
    if (websites.length > 0 && sanitizedWebsites.length < websites.length * 0.5) {
      logger.sync.warn('检测到大量无效数据，已过滤后同步', {
        original: websites.length,
        sanitized: sanitizedWebsites.length
      });
    }

    await retryAsync(async () => {
      const { error } = await supabase
        .from(TABLES.USER_WEBSITES)
        .upsert({
          id: user.id,
          websites: sanitizedWebsites,
          last_sync: new Date().toISOString()
        });

      if (error) throw error;
    });

    logger.sync.info('网站数据已同步到云端', {
      original: websites.length,
      sanitized: sanitizedWebsites.length
    });
    callbacks?.onSyncSuccess?.(`网站数据已同步到云端 (${sanitizedWebsites.length}个有效网站)`);
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

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 表示没有找到记录
        logger.sync.debug('用户网站数据不存在');
        return null;
      } else {
        logger.sync.error('获取网站数据时发生错误:', error);
        throw error;
      }
    }

    if (data && data.websites) {
      // 验证数据格式，确保类型安全
      if (Array.isArray(data.websites)) {
        logger.sync.info('从云端获取网站数据成功', { count: data.websites.length });
        return data.websites as WebsiteData[];
      } else {
        logger.sync.warn('云端网站数据格式异常，不是数组格式');
        return null;
      }
    } else {
      logger.sync.debug('用户网站数据不存在');
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.sync.error('获取网站数据失败', error);
    
    // 提供更详细的错误信息，但仍然返回 null 保持兼容性
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      logger.sync.warn('网络连接问题，将使用本地数据');
    } else if (errorMessage.includes('auth') || errorMessage.includes('JWT')) {
      logger.sync.warn('认证问题，可能需要重新登录');
    }
    
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

// 同步管理器类 - 避免全局变量冲突
class SyncManager {
  private syncTimeout: NodeJS.Timeout | null = null;
  private retryCount: number = 0;
  private readonly maxRetries: number = 3;

  async performSync(
    user: User,
    websites: WebsiteData[],
    settings: UserSettings,
    callbacks?: SyncStatusCallback,
    delay: number = 0 // 移除硬编码延迟，由调用方决定
  ): Promise<void> {
    // 清除之前的延迟
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    // 如果没有延迟，立即执行
    if (delay === 0) {
      return this.executSync(user, websites, settings, callbacks);
    }

    // 设置延迟执行
    return new Promise((resolve, reject) => {
      this.syncTimeout = setTimeout(async () => {
        try {
          await this.executSync(user, websites, settings, callbacks);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  private async executSync(
    user: User,
    websites: WebsiteData[],
    settings: UserSettings,
    callbacks?: SyncStatusCallback
  ): Promise<void> {
    callbacks?.onSyncStart?.();

    try {
      const results = await Promise.allSettled([
        saveUserWebsites(user, websites),
        saveUserSettings(user, settings)
      ]);

      const failed = results.filter(result => result.status === 'rejected');

      if (failed.length === 0) {
        this.retryCount = 0; // 重置重试计数器
        callbacks?.onSyncSuccess?.('数据已静默同步到云端');
      } else {
        await this.handleSyncFailure(user, websites, settings, callbacks, failed.length);
      }
    } catch (error) {
      await this.handleSyncError(user, websites, settings, callbacks, error as Error);
    }
  }

  private async handleSyncFailure(
    user: User,
    websites: WebsiteData[],
    settings: UserSettings,
    callbacks: SyncStatusCallback | undefined,
    failedCount: number
  ): Promise<void> {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.sync.warn(`同步部分失败，${this.retryCount}/${this.maxRetries} 次重试中`);

      // 指数退避重试
      const retryDelay = 1000 * Math.pow(2, this.retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      return this.executSync(user, websites, settings, callbacks);
    } else {
      this.retryCount = 0;
      callbacks?.onSyncError?.(`${failedCount} 个数据同步失败，已重试 ${this.maxRetries} 次`);
    }
  }

  private async handleSyncError(
    user: User,
    websites: WebsiteData[],
    settings: UserSettings,
    callbacks: SyncStatusCallback | undefined,
    error: Error
  ): Promise<void> {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.sync.warn(`同步异常，${this.retryCount}/${this.maxRetries} 次重试中`);

      // 指数退避重试
      const retryDelay = 1000 * Math.pow(2, this.retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      return this.executSync(user, websites, settings, callbacks);
    } else {
      this.retryCount = 0;
      callbacks?.onSyncError?.('同步过程中发生错误: ' + error.message);
    }
  }

  // 清理资源
  cleanup(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    this.retryCount = 0;
  }
}

// 创建同步管理器实例的工厂函数
export const createSyncManager = (): SyncManager => new SyncManager();

// 保持向后兼容的autoSync函数
export const autoSync = (
  user: User,
  websites: WebsiteData[],
  settings: UserSettings,
  callbacks?: SyncStatusCallback
): Promise<void> => {
  const syncManager = createSyncManager();
  return syncManager.performSync(user, websites, settings, callbacks, 0); // 立即执行，不延迟
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
