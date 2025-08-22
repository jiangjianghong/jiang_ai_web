/**
 * 统一清理管理器 - 合并多个定时器任务
 * 减少定时器数量，统一管理清理任务
 */

import { faviconCache } from './faviconCache';
import { memoryManager } from './memoryManager';

class UnifiedCleanupManager {
  private cleanupInterval: number | null = null;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = window.setInterval(() => {
      this.performCleanupTasks();
    }, this.CLEANUP_INTERVAL);

    // 页面卸载时清理定时器
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }

  private performCleanupTasks() {
    try {
      // 执行 favicon 相关的清理任务
      faviconCache.cleanupExpiredBlobUrls();
      
      // 执行内存管理器的清理任务
      memoryManager.cleanup();
      
      // 开发环境下记录内存使用情况
      if (process.env.NODE_ENV === 'development') {
        this.logMemoryUsage();
      }
    } catch (error) {
      console.warn('清理任务执行失败:', error);
    }
  }

  private logMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576);
      const total = Math.round(memory.totalJSHeapSize / 1048576);
      const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
      
      console.log(`📊 内存使用: ${used}MB / ${total}MB (限制: ${limit}MB)`);
      
      // 内存使用率超过80%时警告
      if (used / limit > 0.8) {
        console.warn('⚠️ 内存使用率较高，建议检查内存泄漏');
      }
    }
  }

  /**
   * 立即执行一次清理任务
   */
  performImmediateCleanup() {
    this.performCleanupTasks();
  }

  /**
   * 销毁管理器，清理定时器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 获取清理管理器状态
   */
  getStatus() {
    return {
      active: this.cleanupInterval !== null,
      interval: this.CLEANUP_INTERVAL
    };
  }
}

// 导出单例实例
export const unifiedCleanupManager = new UnifiedCleanupManager();