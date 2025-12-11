// 数据验证工具 - 确保同步数据的完整性和有效性
import { WebsiteData, UserSettings } from './supabaseSync';
import { WallpaperResolution } from '@/contexts/TransparencyContext';

/**
 * 验证网站数据的有效性
 */
export const validateWebsiteData = (website: any): website is WebsiteData => {
  if (!website || typeof website !== 'object') {
    return false;
  }

  // 必需字段验证
  if (!website.id || typeof website.id !== 'string' || website.id.trim().length === 0) {
    return false;
  }

  if (!website.name || typeof website.name !== 'string' || website.name.trim().length === 0) {
    return false;
  }

  if (!website.url || typeof website.url !== 'string' || website.url.trim().length === 0) {
    return false;
  }

  // URL 格式基本验证
  try {
    new URL(website.url);
  } catch {
    return false;
  }

  // 可选字段类型验证
  if (
    website.visitCount !== undefined &&
    (typeof website.visitCount !== 'number' || website.visitCount < 0)
  ) {
    return false;
  }

  if (website.tags !== undefined && !Array.isArray(website.tags)) {
    return false;
  }

  // 新字段类型验证
  if (website.updatedAt !== undefined && typeof website.updatedAt !== 'number') {
    return false;
  }

  if (website.deleted !== undefined && typeof website.deleted !== 'boolean') {
    return false;
  }

  return true;
};

/**
 * 验证用户设置数据的有效性
 */
export const validateUserSettings = (settings: any): settings is UserSettings => {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  // 透明度验证 (0-1之间)
  if (
    typeof settings.cardOpacity !== 'number' ||
    settings.cardOpacity < 0 ||
    settings.cardOpacity > 1
  ) {
    return false;
  }

  if (
    typeof settings.searchBarOpacity !== 'number' ||
    settings.searchBarOpacity < 0 ||
    settings.searchBarOpacity > 1
  ) {
    return false;
  }

  // 布尔值验证
  if (typeof settings.parallaxEnabled !== 'boolean') {
    return false;
  }

  // 壁纸分辨率验证
  const validResolutions: WallpaperResolution[] = ['4k', '1080p', '720p', 'mobile'];
  if (!validResolutions.includes(settings.wallpaperResolution)) {
    return false;
  }

  // 主题验证
  if (!settings.theme || typeof settings.theme !== 'string') {
    return false;
  }

  return true;
};

/**
 * 清理和标准化网站数据
 */
export const sanitizeWebsiteData = (website: any): WebsiteData | null => {
  if (!validateWebsiteData(website)) {
    return null;
  }

  return {
    id: website.id.trim(),
    name: website.name.trim(),
    url: website.url.trim(),
    favicon: website.favicon || '',
    tags: Array.isArray(website.tags) ? website.tags.filter((tag) => typeof tag === 'string') : [],
    visitCount: typeof website.visitCount === 'number' ? Math.max(0, website.visitCount) : 0,
    lastVisit: website.lastVisit || new Date().toISOString(),
    note: typeof website.note === 'string' ? website.note : undefined,
    updatedAt: typeof website.updatedAt === 'number' ? website.updatedAt : Date.now(),
    deleted: typeof website.deleted === 'boolean' ? website.deleted : false,
  };
};

/**
 * 清理和标准化用户设置数据
 */
export const sanitizeUserSettings = (settings: any): UserSettings => {
  return {
    cardOpacity:
      typeof settings.cardOpacity === 'number'
        ? Math.max(0.05, Math.min(1, settings.cardOpacity))
        : 0.1,
    searchBarOpacity:
      typeof settings.searchBarOpacity === 'number'
        ? Math.max(0.05, Math.min(1, settings.searchBarOpacity))
        : 0.1,
    parallaxEnabled:
      typeof settings.parallaxEnabled === 'boolean' ? settings.parallaxEnabled : true,
    wallpaperResolution: (['4k', '1080p', '720p', 'mobile'] as WallpaperResolution[]).includes(
      settings.wallpaperResolution
    )
      ? settings.wallpaperResolution
      : '1080p',
    theme: typeof settings.theme === 'string' ? settings.theme : 'light',
    cardColor: typeof settings.cardColor === 'string' ? settings.cardColor : '255, 255, 255',
    searchBarColor:
      typeof settings.searchBarColor === 'string' ? settings.searchBarColor : '255, 255, 255',
    autoSyncEnabled:
      typeof settings.autoSyncEnabled === 'boolean' ? settings.autoSyncEnabled : true,
    autoSyncInterval:
      typeof settings.autoSyncInterval === 'number' &&
        settings.autoSyncInterval >= 3 &&
        settings.autoSyncInterval <= 300
        ? settings.autoSyncInterval
        : 30,
    autoSortEnabled:
      typeof settings.autoSortEnabled === 'boolean' ? settings.autoSortEnabled : false,
    timeComponentEnabled:
      typeof settings.timeComponentEnabled === 'boolean' ? settings.timeComponentEnabled : true,
    showFullDate: typeof settings.showFullDate === 'boolean' ? settings.showFullDate : true,
    showSeconds: typeof settings.showSeconds === 'boolean' ? settings.showSeconds : true,
    showWeekday: typeof settings.showWeekday === 'boolean' ? settings.showWeekday : true,
    showYear: typeof settings.showYear === 'boolean' ? settings.showYear : true,
    showMonth: typeof settings.showMonth === 'boolean' ? settings.showMonth : true,
    showDay: typeof settings.showDay === 'boolean' ? settings.showDay : true,
    lastSync: typeof settings.lastSync === 'string' ? settings.lastSync : new Date().toISOString(),
  };
};

/**
 * 批量验证和清理网站数据
 */
export const sanitizeWebsiteArray = (websites: any[]): WebsiteData[] => {
  if (!Array.isArray(websites)) {
    return [];
  }

  return websites
    .map(sanitizeWebsiteData)
    .filter((website): website is WebsiteData => website !== null);
};

/**
 * 检查数据是否足够有效以进行同步
 */
export const isDataSafeToSync = (websites: WebsiteData[]): boolean => {
  // 至少要有一个有效的网站数据才允许同步
  return websites.length > 0;
};

/**
 * 数据完整性检查
 */
export const checkDataIntegrity = (
  websites: WebsiteData[]
): {
  isValid: boolean;
  issues: string[];
  validCount: number;
  totalCount: number;
} => {
  const issues: string[] = [];
  let validCount = 0;

  if (!Array.isArray(websites)) {
    issues.push('网站数据不是数组格式');
    return { isValid: false, issues, validCount: 0, totalCount: 0 };
  }

  websites.forEach((website, index) => {
    if (validateWebsiteData(website)) {
      validCount++;
    } else {
      issues.push(`第${index + 1}个网站数据无效`);
    }
  });

  const isValid = validCount > 0 && issues.length === 0;

  return {
    isValid,
    issues,
    validCount,
    totalCount: websites.length,
  };
};
