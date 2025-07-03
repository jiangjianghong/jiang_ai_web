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

  // 导入并应用设置
  const importSettings = useCallback((settings: any): { success: boolean; appliedSettings: string[] } => {
    const validation = validateSettings(settings);
    const appliedSettings: string[] = [];

    if (!validation.valid) {
      console.warn('设置验证失败:', validation.errors);
      return { success: false, appliedSettings: [] };
    }

    try {
      // 应用有效的设置
      if (typeof settings.cardOpacity === 'number') {
        localStorage.setItem('cardOpacity', settings.cardOpacity.toString());
        appliedSettings.push('卡片透明度');
      }

      if (typeof settings.searchBarOpacity === 'number') {
        localStorage.setItem('searchBarOpacity', settings.searchBarOpacity.toString());
        appliedSettings.push('搜索框透明度');
      }

      if (typeof settings.parallaxEnabled === 'boolean') {
        localStorage.setItem('parallaxEnabled', JSON.stringify(settings.parallaxEnabled));
        appliedSettings.push('视差效果');
      }

      if (settings.wallpaperResolution && ['4k', '1080p', '720p', 'mobile'].includes(settings.wallpaperResolution)) {
        localStorage.setItem('wallpaperResolution', settings.wallpaperResolution);
        appliedSettings.push('壁纸分辨率');
      }

      if (settings.theme && ['light', 'dark'].includes(settings.theme)) {
        localStorage.setItem('theme', settings.theme);
        appliedSettings.push('主题');
      }

      return { success: true, appliedSettings };
    } catch (error) {
      console.error('应用设置失败:', error);
      return { success: false, appliedSettings: [] };
    }
  }, [validateSettings]);

  return {
    exportSettings,
    importSettings,
    validateSettings
  };
}
