import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/supabaseSync';
import { useStorage } from '@/lib/storageManager';

interface UserProfileContextType {
  userProfile: UserProfile | null;
  displayName: string;
  updateDisplayName: (name: string) => Promise<boolean>;
  loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

// 缓存键名
const USER_PROFILE_CACHE_KEY = 'user_profile_cache';

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

interface UserProfileProviderProps {
  children: ReactNode;
}

export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const { currentUser } = useAuth();
  const { getItem, setItem, removeItem } = useStorage();

  // 初始化状态时尝试从缓存读取
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const cached = getItem<UserProfile>(USER_PROFILE_CACHE_KEY);
    return cached || null;
  });

  const [loading, setLoading] = useState(false);

  // 获取显示名称（优先使用 profile 中的名称，否则显示“用户”）
  const displayName = userProfile?.displayName || '用户';

  // 更新本地状态和缓存
  const updateUserProfileState = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile) {
      setItem(USER_PROFILE_CACHE_KEY, profile);
    } else {
      removeItem(USER_PROFILE_CACHE_KEY);
    }
  };

  // 更新显示名称
  const updateDisplayName = async (name: string): Promise<boolean> => {
    if (!currentUser || !currentUser.email_confirmed_at) return false;

    setLoading(true);
    try {
      const success = await saveUserProfile(currentUser, name);
      if (success) {
        // 立即更新本地状态和缓存
        const updatedProfile = userProfile
          ? {
            ...userProfile,
            displayName: name,
            updatedAt: new Date().toISOString(),
          }
          : null;

        if (updatedProfile) {
          updateUserProfileState(updatedProfile);
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('更新用户名失败:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 当用户登录状态变化时，加载用户资料
  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser && currentUser.email_confirmed_at) {
        // 即便有缓存，也静默刷新数据
        if (!userProfile) {
          setLoading(true);
        }

        try {
          const profile = await getUserProfile(currentUser);
          if (profile) {
            // 只有当服务器数据与本地不一致时才更新，避免不必要的重渲染
            // 但为了简单起见，这里总是更新以确保最新，React会自动合并状态
            updateUserProfileState(profile);
          } else {
            // 云端没有数据，可能是新注册用户
            // 如果本地也没有缓存，则创建默认值
            if (!userProfile) {
              const defaultName = currentUser.email?.split('@')[0] || '用户';
              // 先尝试保存默认值到云端
              await saveUserProfile(currentUser, defaultName);
              // 再重新获取
              const newProfile = await getUserProfile(currentUser);
              if (newProfile) {
                updateUserProfileState(newProfile);
              }
            }
          }
        } catch (error) {
          console.error('加载用户资料失败:', error);
        } finally {
          setLoading(false);
        }
      } else if (!currentUser) {
        // 用户未登录，清除资料
        updateUserProfileState(null);
      }
    };

    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const value: UserProfileContextType = {
    userProfile,
    displayName,
    updateDisplayName,
    loading,
  };

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}
