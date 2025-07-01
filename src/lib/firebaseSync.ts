// Firebase 数据同步工具
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';

// 用户设置接口
export interface UserSettings {
  cardOpacity: number;
  searchBarOpacity: number;
  parallaxEnabled: boolean;
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

// 保存用户设置到 Firestore
export const saveUserSettings = async (
  user: User, 
  settings: UserSettings, 
  callbacks?: SyncStatusCallback
) => {
  try {
    callbacks?.onSyncStart?.();
    
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    await setDoc(userSettingsRef, {
      ...settings,
      lastSync: serverTimestamp()
    }, { merge: true });
    
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
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const docSnap = await getDoc(userSettingsRef);
    
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
    
    const userWebsitesRef = doc(db, 'userWebsites', user.uid);
    await setDoc(userWebsitesRef, {
      websites,
      lastSync: serverTimestamp()
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
    const userWebsitesRef = doc(db, 'userWebsites', user.uid);
    const docSnap = await getDoc(userWebsitesRef);
    
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
    return null;
  }
};

// 合并本地和云端数据
export const mergeWebsiteData = (localData: WebsiteData[], cloudData: WebsiteData[]): WebsiteData[] => {
  const merged: { [key: string]: WebsiteData } = {};
  
  // 先添加本地数据
  localData.forEach(item => {
    merged[item.id] = item;
  });
  
  // 再添加云端数据，如果访问次数更高则替换
  cloudData.forEach(item => {
    const existing = merged[item.id];
    if (!existing || item.visitCount > existing.visitCount) {
      merged[item.id] = item;
    }
  });
  
  return Object.values(merged);
};

// 自动同步数据（防抖处理）- 增强版本
let syncTimeout: NodeJS.Timeout | null = null;

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
        callbacks?.onSyncSuccess?.('数据已静默同步到云端');
      } else {
        callbacks?.onSyncError?.(`${failed.length} 个数据同步失败`);
      }
    } catch (error) {
      callbacks?.onSyncError?.('同步过程中发生错误: ' + (error as Error).message);
    }
  }, 3000); // 3秒延迟，用户停止操作后快速同步
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
