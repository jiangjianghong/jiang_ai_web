// 存储管理工具 - 根据用户Cookie同意状态管理数据存储
export class StorageManager {
  private static instance: StorageManager;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // 检查用户是否同意Cookie使用
  hasConsent(): boolean {
    try {
      const consent = localStorage.getItem('cookie-consent');
      return consent === 'accepted';
    } catch {
      return false;
    }
  }

  // 检查Cookie同意状态
  getConsentStatus(): 'accepted' | 'declined' | 'pending' {
    try {
      const consent = localStorage.getItem('cookie-consent');
      if (consent === 'accepted') return 'accepted';
      if (consent === 'declined') return 'declined';
      return 'pending';
    } catch {
      return 'pending';
    }
  }

  // 安全的localStorage设置
  setItem(key: string, value: string, isEssential: boolean = false): boolean {
    try {
      // 必要的功能性存储（如Cookie同意状态）总是允许
      if (isEssential || this.hasConsent()) {
        localStorage.setItem(key, value);
        return true;
      } else {
        console.warn(`🚫 存储被阻止: ${key} (用户未同意Cookie使用)`);
        return false;
      }
    } catch (error) {
      console.error('存储失败:', error);
      return false;
    }
  }

  // 安全的localStorage获取
  getItem(key: string, isEssential: boolean = false): string | null {
    try {
      // 必要的功能性存储总是允许读取
      if (isEssential || this.hasConsent()) {
        return localStorage.getItem(key);
      } else {
        console.warn(`🚫 读取被阻止: ${key} (用户未同意Cookie使用)`);
        return null;
      }
    } catch (error) {
      console.error('读取失败:', error);
      return null;
    }
  }

  // 安全的localStorage删除
  removeItem(key: string, isEssential: boolean = false): boolean {
    try {
      if (isEssential || this.hasConsent()) {
        localStorage.removeItem(key);
        return true;
      } else {
        console.warn(`🚫 删除被阻止: ${key} (用户未同意Cookie使用)`);
        return false;
      }
    } catch (error) {
      console.error('删除失败:', error);
      return false;
    }
  }

  // 获取所有存储的键名（仅在有同意时）
  getAllKeys(includeEssential: boolean = true): string[] {
    try {
      if (!this.hasConsent() && !includeEssential) {
        return [];
      }

      const keys: string[] = [];
      const essentialKeys = ['cookie-consent', 'cookie-consent-date'];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (includeEssential || !essentialKeys.includes(key)) {
            keys.push(key);
          }
        }
      }
      return keys;
    } catch {
      return [];
    }
  }

  // 清除所有非必要数据
  clearNonEssentialData(): void {
    const essentialKeys = ['cookie-consent', 'cookie-consent-date'];
    const allKeys = this.getAllKeys(true);
    
    allKeys.forEach(key => {
      if (!essentialKeys.includes(key)) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error(`清除数据失败: ${key}`, error);
        }
      }
    });

    console.log('🧹 已清除所有非必要数据');
  }

  // 获取存储使用统计
  getStorageStats(): {
    totalKeys: number;
    essentialKeys: number;
    nonEssentialKeys: number;
    consentRequired: boolean;
    storageUsed: string;
  } {
    const allKeys = this.getAllKeys(true);
    const essentialKeys = ['cookie-consent', 'cookie-consent-date'];
    const nonEssentialCount = allKeys.filter(key => !essentialKeys.includes(key)).length;
    
    // 估算存储使用量
    let totalSize = 0;
    allKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      } catch {
        // 忽略错误
      }
    });

    return {
      totalKeys: allKeys.length,
      essentialKeys: essentialKeys.filter(key => allKeys.includes(key)).length,
      nonEssentialKeys: nonEssentialCount,
      consentRequired: !this.hasConsent() && nonEssentialCount > 0,
      storageUsed: `${Math.round(totalSize / 1024 * 100) / 100} KB`
    };
  }

  // 导出数据（仅在有同意时）
  exportData(): object | null {
    if (!this.hasConsent()) {
      console.warn('🚫 数据导出被阻止 (用户未同意Cookie使用)');
      return null;
    }

    const data: { [key: string]: any } = {};
    const keys = this.getAllKeys(false); // 排除必要键

    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      } catch {
        data[key] = localStorage.getItem(key);
      }
    });

    return {
      exportTime: new Date().toISOString(),
      consentStatus: this.getConsentStatus(),
      data
    };
  }
}

// 导出单例实例
export const storageManager = StorageManager.getInstance();

// 创建便捷的钩子函数
export function useStorage() {
  const setStorageItem = (key: string, value: any, isEssential: boolean = false) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    return storageManager.setItem(key, stringValue, isEssential);
  };

  const getStorageItem = <T>(key: string, isEssential: boolean = false): T | null => {
    const value = storageManager.getItem(key, isEssential);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  };

  const removeStorageItem = (key: string, isEssential: boolean = false) => {
    return storageManager.removeItem(key, isEssential);
  };

  return {
    setItem: setStorageItem,
    getItem: getStorageItem,
    removeItem: removeStorageItem,
    hasConsent: () => storageManager.hasConsent(),
    getConsentStatus: () => storageManager.getConsentStatus(),
    getStats: () => storageManager.getStorageStats(),
    clearNonEssential: () => storageManager.clearNonEssentialData(),
    exportData: () => storageManager.exportData()
  };
}
