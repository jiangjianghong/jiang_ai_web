// 同步工具函数 - 用于检测和分析数据冲突
import { WebsiteData } from '@/lib/firebaseSync';

export interface DataConflict {
  id: string;
  type: 'missing_local' | 'missing_cloud' | 'different_content';
  localData?: WebsiteData;
  cloudData?: WebsiteData;
  fields?: string[]; // 不同的字段
}

export interface SyncAnalysis {
  hasConflicts: boolean;
  conflicts: DataConflict[];
  summary: {
    totalLocal: number;
    totalCloud: number;
    onlyLocal: number;
    onlyCloud: number;
    different: number;
  };
}

/**
 * 分析本地和云端数据的差异
 */
export function analyzeSyncConflicts(localData: WebsiteData[], cloudData: WebsiteData[]): SyncAnalysis {
  const conflicts: DataConflict[] = [];
  const localMap = new Map(localData.map(item => [item.id, item]));
  const cloudMap = new Map(cloudData.map(item => [item.id, item]));
  
  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
  
  let onlyLocal = 0;
  let onlyCloud = 0;
  let different = 0;
  
  for (const id of allIds) {
    const local = localMap.get(id);
    const cloud = cloudMap.get(id);
    
    if (local && !cloud) {
      // 仅存在于本地
      conflicts.push({
        id,
        type: 'missing_cloud',
        localData: local
      });
      onlyLocal++;
    } else if (!local && cloud) {
      // 仅存在于云端
      conflicts.push({
        id,
        type: 'missing_local',
        cloudData: cloud
      });
      onlyCloud++;
    } else if (local && cloud) {
      // 检查内容差异
      const differentFields: string[] = [];
      
      if (local.name !== cloud.name) differentFields.push('name');
      if (local.url !== cloud.url) differentFields.push('url');
      if (local.note !== cloud.note) differentFields.push('note');
      if (JSON.stringify(local.tags) !== JSON.stringify(cloud.tags)) differentFields.push('tags');
      
      if (differentFields.length > 0) {
        conflicts.push({
          id,
          type: 'different_content',
          localData: local,
          cloudData: cloud,
          fields: differentFields
        });
        different++;
      }
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    summary: {
      totalLocal: localData.length,
      totalCloud: cloudData.length,
      onlyLocal,
      onlyCloud,
      different
    }
  };
}

/**
 * 生成用户友好的冲突描述
 */
export function getConflictDescription(analysis: SyncAnalysis): string {
  const { summary } = analysis;
  const parts: string[] = [];
  
  if (summary.onlyLocal > 0) {
    parts.push(`${summary.onlyLocal}个卡片仅存在于本地`);
  }
  
  if (summary.onlyCloud > 0) {
    parts.push(`${summary.onlyCloud}个卡片仅存在于云端`);
  }
  
  if (summary.different > 0) {
    parts.push(`${summary.different}个卡片内容不同`);
  }
  
  if (parts.length === 0) {
    return '数据完全一致';
  }
  
  return parts.join('，');
}

/**
 * 检测数据是否真正不同（优化版本）
 */
export function areDataDifferent(localData: WebsiteData[], cloudData: WebsiteData[]): boolean {
  if (localData.length !== cloudData.length) return true;
  
  const analysis = analyzeSyncConflicts(localData, cloudData);
  return analysis.hasConflicts;
}
