/**
 * Firebase连接状态管理器
 * 专门用于检测和管理Firebase连接状态，避免误判
 */

class FirebaseConnectionManager {
  private static instance: FirebaseConnectionManager;
  private isConnected = true;
  private lastSuccessfulOperation = Date.now();
  private consecutiveFailures = 0;
  private listeners: Array<(isConnected: boolean) => void> = [];

  static getInstance(): FirebaseConnectionManager {
    if (!FirebaseConnectionManager.instance) {
      FirebaseConnectionManager.instance = new FirebaseConnectionManager();
    }
    return FirebaseConnectionManager.instance;
  }

  /**
   * 记录Firebase操作成功
   */
  recordSuccess(): void {
    this.lastSuccessfulOperation = Date.now();
    this.consecutiveFailures = 0;
    
    if (!this.isConnected) {
      this.isConnected = true;
      console.log('🌐 Firebase连接恢复');
      this.notifyListeners(true);
    }
  }

  /**
   * 记录Firebase操作失败
   */
  recordFailure(error?: any): void {
    this.consecutiveFailures++;
    
    // 只有在连续失败多次且网络也有问题时才判断为离线
    const shouldMarkOffline = 
      this.consecutiveFailures >= 3 && 
      !navigator.onLine;
    
    if (shouldMarkOffline && this.isConnected) {
      this.isConnected = false;
      console.log('🔌 Firebase连接中断');
      this.notifyListeners(false);
    }
    
    console.log(`⚠️ Firebase操作失败 (${this.consecutiveFailures}/3):`, error?.message || error);
  }

  /**
   * 获取连接状态
   */
  isFirebaseConnected(): boolean {
    // 如果基本网络都没有，肯定无法连接Firebase
    if (!navigator.onLine) {
      return false;
    }
    
    // 如果最近有成功的操作，认为连接正常
    const recentSuccess = Date.now() - this.lastSuccessfulOperation < 5 * 60 * 1000; // 5分钟内
    if (recentSuccess) {
      return true;
    }
    
    return this.isConnected;
  }

  /**
   * 添加连接状态监听器
   */
  addListener(callback: (isConnected: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // 立即调用一次
    callback(this.isFirebaseConnected());
    
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
  private notifyListeners(isConnected: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.warn('Firebase连接状态监听器执行失败:', error);
      }
    });
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.isConnected = true;
    this.consecutiveFailures = 0;
    this.lastSuccessfulOperation = Date.now();
  }
}

export const firebaseConnectionManager = FirebaseConnectionManager.getInstance();
