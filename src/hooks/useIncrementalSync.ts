import { useState, useEffect, useRef, useCallback } from 'react';
import { WebsiteData, UserSettings } from '@/lib/firebaseSync';
import { useAuth } from '@/contexts/AuthContext';

interface SyncState {
  isActive: boolean;
  progress: number;
  status: 'idle' | 'syncing' | 'success' | 'error' | 'conflict';
  message: string;
  lastSyncTime?: Date;
  pendingChanges: number;
  conflictData?: {
    local: any;
    remote: any;
    type: 'websites' | 'settings';
  };
}

interface IncrementalSyncOptions {
  enableConflictResolution: boolean;
  syncBatchSize: number;
  syncInterval: number;
  maxRetries: number;
}

class IncrementalSyncManager {
  private lastSyncTimestamp: number = 0;
  private syncQueue: Array<{ id: string; action: 'create' | 'update' | 'delete'; data: any; timestamp: number }> = [];
  private conflictResolver: ConflictResolver;

  constructor() {
    this.conflictResolver = new ConflictResolver();
    this.loadLastSyncTime();
  }

  private loadLastSyncTime() {
    const stored = localStorage.getItem('lastSyncTimestamp');
    this.lastSyncTimestamp = stored ? parseInt(stored) : 0;
  }

  private saveLastSyncTime(timestamp: number) {
    this.lastSyncTimestamp = timestamp;
    localStorage.setItem('lastSyncTimestamp', timestamp.toString());
  }

  // 添加变更到同步队列
  addChange(id: string, action: 'create' | 'update' | 'delete', data: any) {
    const timestamp = Date.now();
    const existingIndex = this.syncQueue.findIndex(item => item.id === id);
    
    if (existingIndex >= 0) {
      // 合并同一项的多次变更
      this.syncQueue[existingIndex] = { id, action, data, timestamp };
    } else {
      this.syncQueue.push({ id, action, data, timestamp });
    }
  }

  // 获取增量同步数据
  getIncrementalChanges(): { 
    localChanges: typeof this.syncQueue;
    lastSyncTime: number;
  } {
    return {
      localChanges: [...this.syncQueue],
      lastSyncTime: this.lastSyncTimestamp
    };
  }

  // 应用远程变更
  async applyRemoteChanges(remoteChanges: any[], onConflict: (conflict: any) => Promise<'local' | 'remote' | 'merge'>) {
    const results = {
      applied: 0,
      conflicts: 0,
      errors: 0
    };

    for (const change of remoteChanges) {
      try {
        const localChange = this.syncQueue.find(item => item.id === change.id);
        
        if (localChange && localChange.timestamp > change.timestamp) {
          // 本地版本更新，检查冲突
          const resolution = await this.conflictResolver.resolve(
            localChange,
            change,
            onConflict
          );
          
          if (resolution === 'local') {
            // 保持本地版本
            continue;
          } else if (resolution === 'remote') {
            // 应用远程版本
            this.applyChange(change);
            this.removeFromQueue(change.id);
          } else {
            // 合并版本
            const merged = this.conflictResolver.merge(localChange, change);
            this.applyChange(merged);
            this.removeFromQueue(change.id);
          }
          
          results.conflicts++;
        } else {
          // 无冲突，直接应用
          this.applyChange(change);
          results.applied++;
        }
      } catch (error) {
        console.error('应用远程变更失败:', error);
        results.errors++;
      }
    }

    return results;
  }

  private applyChange(change: any) {
    // 应用变更到本地数据
    // 这里需要根据实际的数据结构实现
    const event = new CustomEvent('syncDataChange', { detail: change });
    window.dispatchEvent(event);
  }

  private removeFromQueue(id: string) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  // 完成同步
  completSync(timestamp: number) {
    this.saveLastSyncTime(timestamp);
    this.syncQueue = [];
  }

  // 获取待同步变更数量
  getPendingChangesCount(): number {
    return this.syncQueue.length;
  }
}

class ConflictResolver {
  async resolve(
    localChange: any, 
    remoteChange: any, 
    onConflict: (conflict: any) => Promise<'local' | 'remote' | 'merge'>
  ): Promise<'local' | 'remote' | 'merge'> {
    // 自动解决策略
    if (this.canAutoResolve(localChange, remoteChange)) {
      return this.autoResolve(localChange, remoteChange);
    }

    // 需要用户干预
    return await onConflict({
      local: localChange,
      remote: remoteChange,
      type: this.getChangeType(localChange)
    });
  }

  private canAutoResolve(local: any, remote: any): boolean {
    // 简单的自动解决策略
    // 1. 删除操作优先
    if (local.action === 'delete' || remote.action === 'delete') {
      return true;
    }

    // 2. 非关键字段变更可以合并
    const criticalFields = ['id', 'url'];
    const localChanges = Object.keys(local.data || {});
    const remoteChanges = Object.keys(remote.data || {});
    
    const hasCriticalConflict = criticalFields.some(field => 
      localChanges.includes(field) && remoteChanges.includes(field) &&
      local.data[field] !== remote.data[field]
    );

    return !hasCriticalConflict;
  }

  private autoResolve(local: any, remote: any): 'local' | 'remote' | 'merge' {
    if (local.action === 'delete') return 'local';
    if (remote.action === 'delete') return 'remote';
    
    // 非关键冲突，选择合并
    return 'merge';
  }

  merge(local: any, remote: any): any {
    // 智能合并策略
    const merged = { ...remote };
    
    // 保留本地的时间戳更新
    if (local.timestamp > remote.timestamp) {
      merged.timestamp = local.timestamp;
    }

    // 合并非冲突字段
    const localData = local.data || {};
    const remoteData = remote.data || {};
    
    merged.data = {
      ...remoteData,
      ...localData,
      // 特殊字段处理
      visitCount: Math.max(localData.visitCount || 0, remoteData.visitCount || 0),
      tags: Array.from(new Set([...(localData.tags || []), ...(remoteData.tags || [])])),
      lastVisit: localData.lastVisit > remoteData.lastVisit ? localData.lastVisit : remoteData.lastVisit
    };

    return merged;
  }

  private getChangeType(change: any): 'websites' | 'settings' {
    return change.data?.url ? 'websites' : 'settings';
  }
}

export function useIncrementalSync(
  websites: WebsiteData[],
  settings: UserSettings,
  options: Partial<IncrementalSyncOptions> = {}
) {
  const { currentUser } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isActive: false,
    progress: 0,
    status: 'idle',
    message: '',
    pendingChanges: 0
  });

  const syncManagerRef = useRef<IncrementalSyncManager>();
  const lastDataRef = useRef<{ websites: WebsiteData[]; settings: UserSettings }>();

  const defaultOptions: IncrementalSyncOptions = {
    enableConflictResolution: true,
    syncBatchSize: 10,
    syncInterval: 30000, // 30秒
    maxRetries: 3,
    ...options
  };

  // 初始化同步管理器
  useEffect(() => {
    syncManagerRef.current = new IncrementalSyncManager();
    
    // 监听数据变更
    const handleDataChange = (event: CustomEvent) => {
      // 处理来自同步的数据变更
      console.log('收到同步数据变更:', event.detail);
    };

    window.addEventListener('syncDataChange', handleDataChange as EventListener);
    
    return () => {
      window.removeEventListener('syncDataChange', handleDataChange as EventListener);
    };
  }, []);

  // 监控数据变化，添加到同步队列
  useEffect(() => {
    if (!syncManagerRef.current || !currentUser?.emailVerified) return;

    const currentData = { websites, settings };
    
    if (lastDataRef.current) {
      // 检测网站数据变化
      const websiteChanges = detectWebsiteChanges(lastDataRef.current.websites, websites);
      websiteChanges.forEach(change => {
        syncManagerRef.current!.addChange(change.id, change.action, change.data);
      });

      // 检测设置变化
      const settingsChanges = detectSettingsChanges(lastDataRef.current.settings, settings);
      if (settingsChanges) {
        syncManagerRef.current!.addChange('settings', 'update', settingsChanges);
      }

      // 更新待同步数量
      setSyncState(prev => ({
        ...prev,
        pendingChanges: syncManagerRef.current!.getPendingChangesCount()
      }));
    }

    lastDataRef.current = currentData;
  }, [websites, settings, currentUser]);

  // 执行增量同步
  const performSync = useCallback(async () => {
    if (!syncManagerRef.current || !currentUser?.emailVerified || syncState.isActive) {
      return;
    }

    setSyncState(prev => ({
      ...prev,
      isActive: true,
      status: 'syncing',
      progress: 0,
      message: '正在同步数据...'
    }));

    try {
      const { localChanges, lastSyncTime } = syncManagerRef.current.getIncrementalChanges();
      
      if (localChanges.length === 0) {
        setSyncState(prev => ({
          ...prev,
          isActive: false,
          status: 'success',
          message: '数据已是最新',
          pendingChanges: 0
        }));
        return;
      }

      // 上传本地变更
      setSyncState(prev => ({ ...prev, progress: 25, message: '上传本地变更...' }));
      await uploadIncrementalChanges(currentUser.uid, localChanges);

      // 获取远程变更
      setSyncState(prev => ({ ...prev, progress: 50, message: '获取远程变更...' }));
      const remoteChanges = await fetchRemoteChanges(currentUser.uid, lastSyncTime);

      // 应用远程变更并解决冲突
      setSyncState(prev => ({ ...prev, progress: 75, message: '解决冲突并应用变更...' }));
      const results = await syncManagerRef.current.applyRemoteChanges(
        remoteChanges,
        handleConflict
      );

      // 完成同步
      setSyncState(prev => ({ ...prev, progress: 100, message: '同步完成' }));
      syncManagerRef.current.completSync(Date.now());

      setSyncState(prev => ({
        ...prev,
        isActive: false,
        status: 'success',
        lastSyncTime: new Date(),
        pendingChanges: 0,
        message: `同步完成: ${results.applied} 项更新, ${results.conflicts} 项冲突已解决`
      }));

    } catch (error) {
      console.error('增量同步失败:', error);
      setSyncState(prev => ({
        ...prev,
        isActive: false,
        status: 'error',
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
    }
  }, [currentUser, syncState.isActive]);

  // 处理冲突
  const handleConflict = useCallback(async (conflict: any): Promise<'local' | 'remote' | 'merge'> => {
    return new Promise((resolve) => {
      setSyncState(prev => ({
        ...prev,
        status: 'conflict',
        conflictData: conflict,
        message: '检测到数据冲突，请选择解决方案'
      }));

      // 这里可以显示冲突解决UI
      // 暂时使用自动合并策略
      setTimeout(() => {
        resolve('merge');
        setSyncState(prev => ({
          ...prev,
          status: 'syncing',
          conflictData: undefined
        }));
      }, 1000);
    });
  }, []);

  // 自动同步
  useEffect(() => {
    if (!currentUser?.emailVerified || !defaultOptions.syncInterval) return;

    const interval = setInterval(() => {
      if (syncState.pendingChanges > 0) {
        performSync();
      }
    }, defaultOptions.syncInterval);

    return () => clearInterval(interval);
  }, [currentUser, defaultOptions.syncInterval, syncState.pendingChanges, performSync]);

  return {
    syncState,
    performSync,
    canSync: currentUser?.emailVerified && !syncState.isActive,
    resetSync: () => setSyncState(prev => ({ ...prev, status: 'idle', message: '' }))
  };
}

// 辅助函数
function detectWebsiteChanges(oldWebsites: WebsiteData[], newWebsites: WebsiteData[]) {
  const changes: Array<{ id: string; action: 'create' | 'update' | 'delete'; data: any }> = [];
  
  // 检测新增和更新
  newWebsites.forEach(newSite => {
    const oldSite = oldWebsites.find(old => old.id === newSite.id);
    if (!oldSite) {
      changes.push({ id: newSite.id, action: 'create', data: newSite });
    } else if (JSON.stringify(oldSite) !== JSON.stringify(newSite)) {
      changes.push({ id: newSite.id, action: 'update', data: newSite });
    }
  });

  // 检测删除
  oldWebsites.forEach(oldSite => {
    const exists = newWebsites.find(newSite => newSite.id === oldSite.id);
    if (!exists) {
      changes.push({ id: oldSite.id, action: 'delete', data: oldSite });
    }
  });

  return changes;
}

function detectSettingsChanges(oldSettings: UserSettings, newSettings: UserSettings) {
  if (JSON.stringify(oldSettings) !== JSON.stringify(newSettings)) {
    return newSettings;
  }
  return null;
}

// 模拟API函数 - 实际实现需要连接到Firebase
async function uploadIncrementalChanges(uid: string, changes: any[]) {
  // 实现上传逻辑
  console.log('上传增量变更:', changes);
}

async function fetchRemoteChanges(uid: string, lastSyncTime: number) {
  // 实现获取远程变更逻辑
  console.log('获取远程变更，自:', new Date(lastSyncTime));
  return [];
}
