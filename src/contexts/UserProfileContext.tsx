import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/firebaseSync';

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

  // 获取显示名称
  const displayName = userProfile?.displayName || currentUser?.email?.split('@')[0] || '用户';

  // 更新显示名称
  const updateDisplayName = async (name: string): Promise<boolean> => {
    if (!currentUser || !currentUser.emailVerified) return false;
    
    setLoading(true);
    try {
      const success = await saveUserProfile(currentUser, name);
      if (success) {
        // 立即更新本地状态
        setUserProfile(prev => prev ? { 
          ...prev, 
          displayName: name,
          updatedAt: new Date()
        } : null);
        
        // 重新获取用户资料确保同步
        setTimeout(async () => {
          const updatedProfile = await getUserProfile(currentUser);
          if (updatedProfile) {
            setUserProfile(updatedProfile);
          }
        }, 1000);
        
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
      if (currentUser && currentUser.emailVerified) {
        setLoading(true);
        try {
          const profile = await getUserProfile(currentUser);
          if (profile) {
            setUserProfile(profile);
          } else {
            // 如果没有资料，创建默认资料
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
  }, [currentUser]);

  const value: UserProfileContextType = {
    userProfile,
    displayName,
    updateDisplayName,
    loading
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}
