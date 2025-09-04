import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/supabaseSync';

interface UserProfileContextType {
  userProfile: UserProfile | null;
  displayName: string;
  updateDisplayName: (name: string) => Promise<boolean>;
  loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取显示名称（只用云端 profile，云端没有时显示“用户”）
  const displayName = userProfile?.displayName || '用户';

  // 更新显示名称
  const updateDisplayName = async (name: string): Promise<boolean> => {
    if (!currentUser || !currentUser.email_confirmed_at) return false;

    setLoading(true);
    try {
      const success = await saveUserProfile(currentUser, name);
      if (success) {
        // 立即更新本地状态
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                displayName: name,
                updatedAt: new Date().toISOString(),
              }
            : null
        );

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
        setLoading(true);
        try {
          const profile = await getUserProfile(currentUser);
          if (profile) {
            setUserProfile(profile);
          } else {
            // 仅首次注册时创建 profile，之后不再 fallback
            const defaultName = currentUser.email?.split('@')[0] || '用户';
            await saveUserProfile(currentUser, defaultName);
            const newProfile = await getUserProfile(currentUser);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('加载用户资料失败:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
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
