import { useState, useCallback } from 'react';
import { useWebsiteData } from './useWebsiteData';
import { useSettingsManager } from './useSettingsManager';

interface ExportOptions {
  includeSettings?: boolean;
  includeWebsites?: boolean;
  compress?: boolean;
}

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    websitesImported?: number;
    settingsApplied?: string[];
  };
}

interface UseDataManagerReturn {
  exportAllData: (options?: ExportOptions) => Promise<void>;
  importAllData: (file: File) => Promise<ImportResult>;
  isExporting: boolean;
  isImporting: boolean;
  error: string | null;
}

/**
 * 统一的数据导入导出管理Hook
 * 整合网站数据和设置的导入导出功能
 */
export function useDataManager(
  websites: any[],
  setWebsites: (websites: any[]) => void
): UseDataManagerReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { importData: importWebsites } = useWebsiteData({ enableAutoSync: false });
  const { exportSettings, importSettings } = useSettingsManager();

  // 导出所有数据
  const exportAllData = useCallback(
    async (options: ExportOptions = {}) => {
      const { includeSettings = true, includeWebsites = true } = options;

      if (isExporting) return;

      setIsExporting(true);
      setError(null);

      try {
        // 验证数据完整性
        if (includeWebsites && (!websites || websites.length === 0)) {
          const shouldExport = confirm('当前没有网站数据，是否仍要导出设置？');
          if (!shouldExport) return;
        }

        const exportData: any = {
          exportTime: new Date().toISOString(),
          version: '1.0',
        };

        if (includeWebsites) {
          exportData.websites = websites || [];
        }

        if (includeSettings) {
          exportData.settings = exportSettings();
        }

        // 验证数据大小
        const dataStr = JSON.stringify(exportData, null, 2);
        const sizeInMB = new Blob([dataStr]).size / 1024 / 1024;

        if (sizeInMB > 50) {
          throw new Error('导出数据过大（超过50MB），请联系技术支持');
        }

        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const fileName = `西红柿标签页_导出数据_${new Date().toISOString().split('T')[0]}.json`;

        // 优先使用现代文件API
        if ('showSaveFilePicker' in window) {
          try {
            // @ts-ignore - 新API可能没有类型定义
            const fileHandle = await window.showSaveFilePicker({
              suggestedName: fileName,
              types: [
                {
                  description: 'JSON文件',
                  accept: { 'application/json': ['.json'] },
                },
              ],
            });
            const writable = await fileHandle.createWritable();
            await writable.write(dataBlob);
            await writable.close();

            alert(
              `数据导出成功！${includeWebsites ? `包含 ${websites.length} 个网站` : ''}${includeSettings ? '和设置' : ''}。`
            );
            return;
          } catch (error) {
            if ((error as Error).name === 'AbortError') {
              return; // 用户取消了
            }
            console.warn('现代下载API失败，使用传统方式:', error);
          }
        }

        // 传统下载方式
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        alert(
          `数据导出成功！${includeWebsites ? `包含 ${websites.length} 个网站` : ''}${includeSettings ? '和设置' : ''}。`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        setError(`导出失败: ${errorMessage}`);
        alert(`导出数据失败：${errorMessage}`);
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, websites, exportSettings]
  );

  // 导入所有数据
  const importAllData = useCallback(
    async (file: File): Promise<ImportResult> => {
      if (isImporting) {
        return { success: false, message: '导入正在进行中，请稍候' };
      }

      setIsImporting(true);
      setError(null);

      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const importedData = JSON.parse(content);

            let websitesImported = 0;
            let settingsApplied: string[] = [];

            // 导入网站数据
            if (importedData.websites) {
              const websiteResult = await importWebsites(importedData);
              if (websiteResult.success) {
                setWebsites(
                  importedData.websites.filter((site: any) => site.id && site.name && site.url)
                );
                websitesImported = websiteResult.validCount || 0;
              }
            }

            // 导入设置数据
            if (importedData.settings) {
              const settingsResult = importSettings(importedData.settings);
              if (settingsResult.success) {
                settingsApplied = settingsResult.appliedSettings;
              }
            }

            const totalImported = websitesImported + settingsApplied.length;
            if (totalImported === 0) {
              resolve({
                success: false,
                message: '导入的文件中没有有效数据',
              });
              return;
            }

            resolve({
              success: true,
              message: `导入成功！`,
              details: {
                websitesImported,
                settingsApplied,
              },
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '文件格式错误';
            setError(`导入失败: ${errorMessage}`);
            resolve({
              success: false,
              message: `导入失败: ${errorMessage}`,
            });
          } finally {
            setIsImporting(false);
          }
        };

        reader.onerror = () => {
          setError('文件读取失败');
          setIsImporting(false);
          resolve({
            success: false,
            message: '文件读取失败',
          });
        };

        reader.readAsText(file);
      });
    },
    [isImporting, importWebsites, importSettings, setWebsites]
  );

  return {
    exportAllData,
    importAllData,
    isExporting,
    isImporting,
    error,
  };
}
