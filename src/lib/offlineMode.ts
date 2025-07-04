/**
 * 离线模式检测和管理工具
 * 专门针对大陆用户Firebase连接问题进行优化
 */

interface OfflineModeConfig {
  enableOfflineMode: boolean;
  lastFirebaseCheck: number;
  firebaseCheckInterval: number; // 检查间隔（毫秒）
  offlineModeDuration: number; // 离线模式持续时间（毫秒）
}

class OfflineModeManager {
  private config: OfflineModeConfig;
  private configKey = 'offline-mode-config';
  private isFirebaseBlocked = false;
  private listeners: Array<(isOffline: boolean) => void> = [];

  constructor() {
    this.config = this.loadConfig();
    
    // 延迟执行Firebase连接检查，避免影响应用启动
    setTimeout(() => {
      this.checkFirebaseConnectivity();
    }, 5000); // 5秒后再检查
  }

  /**
   * 从localStorage加载配置
   */
  private loadConfig(): OfflineModeConfig {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) {
        return { ...this.getDefaultConfig(), ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('加载离线模式配置失败:', error);
    }
    return this.getDefaultConfig();
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): OfflineModeConfig {
    return {
      enableOfflineMode: false,
      lastFirebaseCheck: 0,
      firebaseCheckInterval: 5 * 60 * 1000, // 5分钟检查一次
      offlineModeDuration: 30 * 60 * 1000, // 30分钟离线模式
    };
  }

  /**
   * 保存配置到localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(this.config));
    } catch (error) {
      console.warn('保存离线模式配置失败:', error);
    }
  }

  /**
   * 检查Firebase连接性
   */
  private async checkFirebaseConnectivity(): Promise<void> {
    const now = Date.now();
    
    // 如果已经在离线模式且还没到重新检查时间，跳过检查
    if (this.config.enableOfflineMode && 
        (now - this.config.lastFirebaseCheck) < this.config.firebaseCheckInterval) {
      return;
    }

    try {
      // 改用更简单的网络连接检测，避免Firebase API的复杂性
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // 检测能否访问Google的公共DNS，这更准确地反映网络状况
      await fetch('https://dns.google/resolve?name=firebase.googleapis.com&type=A', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      
      // 连接成功，禁用离线模式
      this.isFirebaseBlocked = false;
      if (this.config.enableOfflineMode) {
        console.log('🌐 网络连接恢复，退出离线模式');
        this.config.enableOfflineMode = false;
        this.notifyListeners(false);
      }
      
    } catch (error) {
      // 连接失败，但不要立即启用离线模式，因为可能只是检测API的问题
      console.log('⚠️ 网络检测失败，但这可能是正常的:', error);
      
      // 只有在网络真的不可用时才启用离线模式
      if (!navigator.onLine) {
        this.isFirebaseBlocked = true;
        if (!this.config.enableOfflineMode) {
          console.log('🔌 网络确实不可用，启用离线模式');
          this.config.enableOfflineMode = true;
          this.notifyListeners(true);
        }
      }
    }

    this.config.lastFirebaseCheck = now;
    this.saveConfig();
  }

  /**
   * 手动检查Firebase连接
   */
  async manualCheckFirebase(): Promise<boolean> {
    this.config.lastFirebaseCheck = 0; // 重置检查时间
    
    try {
      // 改用简单的网络测试
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      await fetch('https://dns.google/resolve?name=firebase.googleapis.com&type=A', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      this.isFirebaseBlocked = false;
      return true;
    } catch (error) {
      console.log('🔍 手动网络检测失败:', error);
      // 检查基本的网络连接
      this.isFirebaseBlocked = !navigator.onLine;
      return navigator.onLine;
    }
  }

  /**
   * 获取当前是否处于离线模式
   */
  isOfflineMode(): boolean {
    return this.config.enableOfflineMode || this.isFirebaseBlocked;
  }

  /**
   * 强制启用离线模式
   */
  enableOfflineMode(): void {
    this.config.enableOfflineMode = true;
    this.saveConfig();
    this.notifyListeners(true);
    console.log('🔌 手动启用离线模式');
  }

  /**
   * 强制禁用离线模式
   */
  disableOfflineMode(): void {
    this.config.enableOfflineMode = false;
    this.isFirebaseBlocked = false;
    this.saveConfig();
    this.notifyListeners(false);
    console.log('🌐 手动禁用离线模式');
  }

  /**
   * 添加离线模式状态监听器
   */
  addListener(callback: (isOffline: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // 立即调用一次，传递当前状态
    callback(this.isOfflineMode());
    
    // 返回移除监听器的函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(isOffline: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(isOffline);
      } catch (error) {
        console.warn('离线模式监听器执行失败:', error);
      }
    });
  }

  /**
   * 获取离线模式信息
   */
  getOfflineModeInfo(): {
    isOffline: boolean;
    reason: string;
    canRetry: boolean;
    nextCheckTime?: number;
  } {
    const isOffline = this.isOfflineMode();
    
    if (!isOffline) {
      return {
        isOffline: false,
        reason: 'Firebase连接正常',
        canRetry: false
      };
    }

    const reason = this.isFirebaseBlocked 
      ? 'Firebase服务不可用（可能被防火墙阻止）'
      : '手动启用的离线模式';

    const nextCheckTime = this.config.lastFirebaseCheck + this.config.firebaseCheckInterval;
    const canRetry = Date.now() >= nextCheckTime;

    return {
      isOffline: true,
      reason,
      canRetry,
      nextCheckTime: canRetry ? undefined : nextCheckTime
    };
  }
}

// 创建全局实例
export const offlineModeManager = new OfflineModeManager();

// 导出类型
export type { OfflineModeConfig };
