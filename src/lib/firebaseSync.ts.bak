// Firebase 数据同步工具
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { WallpaperResolution } from '@/contexts/TransparencyContext';

// 用户设置接口
export interface UserSettings {
  cardOpacity: number;
  searchBarOpacity: number;
  parallaxEnabled: boolean;
  wallpaperResolution: WallpaperResolution;
  theme: string;
  lastSync: any;
}

// 网站数据接口
export interface WebsiteData {
  id: string;
  name: string;
  url: string;
  favicon: string;
  tags: string[];
  visitCount: number;
  lastVisit: string;
  note?: string;
}

// 同步状态回调接口
export interface SyncStatusCallback {
  onSyncStart?: () => void;
  onSyncSuccess?: (message: string) => void;
  onSyncError?: (error: string) => void;
}

// 用户资料接口
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: any;
  updatedAt: any;
}

// 网络重试工具函数
const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // 指数退避延迟
      const waitTime = delay * Math.pow(2, i);
      console.log(`🔄 同步失败，${waitTime}ms后重试 (${i + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};

// 保存用户设置到 Firestore - 带重试机制
export const saveUserSettings = async (
  user: User, 
  settings: UserSettings, 
  callbacks?: SyncStatusCallback
) => {
  try {
    callbacks?.onSyncStart?.();
    
    await retryAsync(async () => {
      const userSettingsRef = doc(db, 'userSettings', user.uid);
      await setDoc(userSettingsRef, {
        ...settings,
        lastSync: serverTimestamp()
      }, { merge: true });
    });
    
    console.log('用户设置已同步到云端');
    callbacks?.onSyncSuccess?.('设置已同步到云端');
    return true;
  } catch (error) {
    console.error('保存用户设置失败:', error);
    callbacks?.onSyncError?.('设置同步失败: ' + (error as Error).message);
    return false;
  }
};

// 从 Firestore 获取用户设置
export const getUserSettings = async (user: User): Promise<UserSettings | null> => {
  try {
    // 添加超时机制，避免长时间等待
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('连接超时')), 5000)
    );
    
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const docSnap = await Promise.race([getDoc(userSettingsRef), timeoutPromise]);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('从云端获取用户设置成功');
      return data as UserSettings;
    } else {
      console.log('用户设置不存在，将使用默认设置');
      return null;
    }
  } catch (error) {
    console.error('获取用户设置失败:', error);
    // 离线模式下直接返回 null，不阻塞界面
    return null;
  }
};

// 保存用户网站数据到 Firestore
export const saveUserWebsites = async (
  user: User, 
  websites: WebsiteData[], 
  callbacks?: SyncStatusCallback
) => {
  try {
    callbacks?.onSyncStart?.();
    
    await retryAsync(async () => {
      const userWebsitesRef = doc(db, 'userWebsites', user.uid);
      await setDoc(userWebsitesRef, {
        websites,
        lastSync: serverTimestamp()
      });
    });
    
    console.log('网站数据已同步到云端');
    callbacks?.onSyncSuccess?.('网站数据已同步到云端');
    return true;
  } catch (error) {
    console.error('保存网站数据失败:', error);
    callbacks?.onSyncError?.('网站数据同步失败: ' + (error as Error).message);
    return false;
  }
};

// 从 Firestore 获取用户网站数据
export const getUserWebsites = async (user: User): Promise<WebsiteData[] | null> => {
  try {
    // 添加超时机制，避免长时间等待
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('连接超时')), 5000)
    );
    
    const userWebsitesRef = doc(db, 'userWebsites', user.uid);
    const docSnap = await Promise.race([getDoc(userWebsitesRef), timeoutPromise]);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('从云端获取网站数据成功');
      return data.websites as WebsiteData[];
    } else {
      console.log('用户网站数据不存在');
      return null;
    }
  } catch (error) {
    console.error('获取网站数据失败:', error);
    // 离线模式下直接返回 null，不阻塞界面
    return null;
  }
};

// 合并本地和云端数据 - 改进版本，避免数据丢失
export const mergeWebsiteData = (localData: WebsiteData[], cloudData: WebsiteData[]): WebsiteData[] => {
  const merged: { [key: string]: WebsiteData } = {};
  
  // 先添加本地数据
  localData.forEach(item => {
    merged[item.id] = { ...item };
  });
  
  // 智能合并云端数据
  cloudData.forEach(item => {
    const existing = merged[item.id];
    if (!existing) {
      // 如果本地没有，直接使用云端数据
      merged[item.id] = { ...item };
    } else {
      // 比较最后访问时间，选择更新的数据作为基础
      const localTime = new Date(existing.lastVisit || '2000-01-01').getTime();
      const cloudTime = new Date(item.lastVisit || '2000-01-01').getTime();
      
      let finalData: WebsiteData;
      
      if (cloudTime > localTime) {
        // 云端数据更新，使用云端数据作为基础
        finalData = { ...item };
      } else if (localTime > cloudTime) {
        // 本地数据更新，使用本地数据作为基础
        finalData = { ...existing };
      } else {
        // 时间相同，使用访问次数更高的
        finalData = item.visitCount > existing.visitCount ? { ...item } : { ...existing };
      }
      
      // 保留较高的访问次数（累积值）
      finalData.visitCount = Math.max(existing.visitCount || 0, item.visitCount || 0);
      
      // 保留最新的访问时间
      finalData.lastVisit = localTime > cloudTime ? existing.lastVisit : item.lastVisit;
      
      merged[item.id] = finalData;
    }
  });
  
  return Object.values(merged);
};

// 自动同步数据（防抖处理）- 增强版本，带重试机制
let syncTimeout: NodeJS.Timeout | null = null;
let retryCount = 0;
const maxRetries = 3;

export const autoSync = (
  user: User, 
  websites: WebsiteData[], 
  settings: UserSettings,
  callbacks?: SyncStatusCallback
) => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(async () => {
    callbacks?.onSyncStart?.();
    
    try {
      const results = await Promise.allSettled([
        saveUserWebsites(user, websites),
        saveUserSettings(user, settings)
      ]);
      
      const failed = results.filter(result => result.status === 'rejected');
      
      if (failed.length === 0) {
        retryCount = 0; // 重置重试计数器
        callbacks?.onSyncSuccess?.('数据已静默同步到云端');
      } else {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 同步部分失败，${retryCount}/${maxRetries} 次重试中...`);
          // 指数退避重试
          setTimeout(() => {
            autoSync(user, websites, settings, callbacks);
          }, 1000 * Math.pow(2, retryCount - 1));
        } else {
          retryCount = 0;
          callbacks?.onSyncError?.(`${failed.length} 个数据同步失败，已重试 ${maxRetries} 次`);
        }
      }
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`🔄 同步异常，${retryCount}/${maxRetries} 次重试中...`);
        setTimeout(() => {
          autoSync(user, websites, settings, callbacks);
        }, 1000 * Math.pow(2, retryCount - 1));
      } else {
        retryCount = 0;
        callbacks?.onSyncError?.('同步过程中发生错误: ' + (error as Error).message);
      }
    }
  }, 5000); // 5秒延迟，用户停止操作后快速同步
};

// 保存用户资料到 Firestore
export const saveUserProfile = async (
  user: User, 
  displayName: string, 
  callbacks?: SyncStatusCallback
) => {
  try {
    callbacks?.onSyncStart?.();
    
    const userProfileRef = doc(db, 'userProfiles', user.uid);
    const profileData: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(userProfileRef, profileData, { merge: true });
    
    console.log('用户资料已同步到云端');
    callbacks?.onSyncSuccess?.('用户资料已保存');
    return true;
  } catch (error) {
    console.error('保存用户资料失败:', error);
    callbacks?.onSyncError?.('用户资料保存失败: ' + (error as Error).message);
    return false;
  }
};

// 获取用户资料
export const getUserProfile = async (user: User): Promise<UserProfile | null> => {
  try {
    const userProfileRef = doc(db, 'userProfiles', user.uid);
    const docSnap = await getDoc(userProfileRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('从云端获取用户资料成功');
      return data as UserProfile;
    } else {
      console.log('用户资料不存在');
      return null;
    }
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return null;
  }
};
