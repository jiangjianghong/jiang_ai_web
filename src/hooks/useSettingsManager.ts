import { useCallback } from 'react';
import { WallpaperResolution } from '@/contexts/TransparencyContext';

interface SettingsData {
  cardOpacity: number;
  searchBarOpacity: number;
  parallaxEnabled: boolean;
  wallpaperResolution: WallpaperResolution;
  theme: string;
}

interface UseSettingsManagerReturn {
  exportSettings: () => SettingsData;
  importSettings: (settings: any) => { success: boolean; appliedSettings: string[] };
  validateSettings: (settings: any) => { valid: boolean; errors: string[] };
}

/**
 * 统一的设置管理Hook
 * 处理设置的导出、导入和验证
 */
export function useSettingsManager(): UseSettingsManagerReturn {
  
  // 导出当前设置
  const exportSettings = useCallback((): SettingsData => {
    try {
      return {
        cardOpacity: parseFloat(localStorage.getItem('cardOpacity') || '0.1'),
        searchBarOpacity: parseFloat(localStorage.getItem('searchBarOpacity') || '0.1'),
        parallaxEnabled: JSON.parse(localStorage.getItem('parallaxEnabled') || 'true'),
        wallpaperResolution: (localStorage.getItem('wallpaperResolution') || '1080p') as WallpaperResolution,
        theme: localStorage.getItem('theme') || 'light'
      };
    } catch (error) {
      console.warn('导出设置失败，使用默认值:', error);
      return {
        cardOpacity: 0.1,
        searchBarOpacity: 0.1,
        parallaxEnabled: true,
        wallpaperResolution: '1080p',
        theme: 'light'
      };
    }
  }, []);

  // 验证设置数据
  const validateSettings = useCallback((settings: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (settings.cardOpacity !== undefined) {
      if (typeof settings.cardOpacity !== 'number' || settings.cardOpacity < 0.05 || settings.cardOpacity > 0.3) {
        errors.push('卡片透明度值无效（应在0.05-0.3之间）');
      }
    }

    if (settings.searchBarOpacity !== undefined) {
      if (typeof settings.searchBarOpacity !== 'number' || settings.searchBarOpacity < 0.05 || settings.searchBarOpacity > 0.3) {
        errors.push('搜索框透明度值无效（应在0.05-0.3之间）');
      }
    }

    if (settings.parallaxEnabled !== undefined) {
      if (typeof settings.parallaxEnabled !== 'boolean') {
        errors.push('视差效果设置值无效（应为true或false）');
      }
    }

    if (settings.wallpaperResolution !== undefined) {
      if (!['4k', '1080p', '720p', 'mobile'].includes(settings.wallpaperResolution)) {
        errors.push('壁纸分辨率值无效');
      }
    }

    if (settings.theme !== undefined) {
      if (!['light', 'dark'].includes(settings.theme)) {
        errors.push('主题值无效（应为light或dark）');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  // 导入并应用设置（原子操作）
  const importSettings = useCallback((settings: any): { success: boolean; appliedSettings: string[] } => {
    const validation = validateSettings(settings);
    const appliedSettings: string[] = [];

    if (!validation.valid) {
      console.warn('设置验证失败:', validation.errors);
      return { success: false, appliedSettings: [] };
    }

    // 准备所有要应用的设置
    const settingsToApply: Array<{ key: string; value: string; label: string }> = [];
    
    if (typeof settings.cardOpacity === 'number') {
      settingsToApply.push({
        key: 'cardOpacity',
        value: settings.cardOpacity.toString(),
        label: '卡片透明度'
      });
    }

    if (typeof settings.searchBarOpacity === 'number') {
      settingsToApply.push({
        key: 'searchBarOpacity',
        value: settings.searchBarOpacity.toString(),
        label: '搜索框透明度'
      });
    }

    if (typeof settings.parallaxEnabled === 'boolean') {
      settingsToApply.push({
        key: 'parallaxEnabled',
        value: JSON.stringify(settings.parallaxEnabled),
        label: '视差效果'
      });
    }

    if (settings.wallpaperResolution && ['4k', '1080p', '720p', 'mobile'].includes(settings.wallpaperResolution)) {
      settingsToApply.push({
        key: 'wallpaperResolution',
        value: settings.wallpaperResolution,
        label: '壁纸分辨率'
      });
    }

    if (settings.theme && ['light', 'dark'].includes(settings.theme)) {
      settingsToApply.push({
        key: 'theme',
        value: settings.theme,
        label: '主题'
      });
    }

    // 备份当前设置以便回滚
    const backupSettings: Array<{ key: string; value: string | null }> = [];
    settingsToApply.forEach(setting => {
      backupSettings.push({
        key: setting.key,
        value: localStorage.getItem(setting.key)
      });
    });

    try {
      // 原子性应用所有设置
      settingsToApply.forEach(setting => {
        localStorage.setItem(setting.key, setting.value);
        appliedSettings.push(setting.label);
      });

      return { success: true, appliedSettings };
    } catch (error) {
      console.error('应用设置失败，正在回滚:', error);
      
      // 回滚到之前的状态
      try {
        backupSettings.forEach(backup => {
          if (backup.value !== null) {
            localStorage.setItem(backup.key, backup.value);
          } else {
            localStorage.removeItem(backup.key);
          }
        });
      } catch (rollbackError) {
        console.error('回滚失败:', rollbackError);
      }
      
      return { success: false, appliedSettings: [] };
    }
  }, [validateSettings]);

  return {
    exportSettings,
    importSettings,
    validateSettings
  };
}
