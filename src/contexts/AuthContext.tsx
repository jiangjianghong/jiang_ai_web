import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  loginWithTimeout,
  registerWithTimeout,
  loginWithGoogleTimeout,
  sendVerificationEmailWithTimeout,
  reloadUserWithTimeout,
  getLocalizedErrorMessage,
  createNetworkStatusListener,
  isOnline
} from '@/lib/firebaseTimeout';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  loading: boolean;
  isNetworkOnline: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNetworkOnline, setIsNetworkOnline] = useState(isOnline());
  const [error, setError] = useState<string | null>(null);

  // 清除错误
  const clearError = () => setError(null);

  // 邮箱密码登录
  const login = async (email: string, password: string) => {
    try {
      clearError();
      await loginWithTimeout(email, password);
    } catch (err) {
      const message = getLocalizedErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  // 邮箱密码注册（带邮箱验证）
  const register = async (email: string, password: string) => {
    try {
      clearError();
      const result = await registerWithTimeout(email, password);
      
      // 立即发送验证邮件
      if (result.user) {
        try {
          await sendVerificationEmailWithTimeout();
        } catch (verifyErr) {
          console.warn('发送验证邮件失败:', verifyErr);
        }
      }
    } catch (err) {
      const message = getLocalizedErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  // 发送验证邮件
  const sendVerificationEmail = async () => {
    try {
      clearError();
      if (currentUser && !currentUser.emailVerified) {
        await sendVerificationEmailWithTimeout();
      }
    } catch (err) {
      const message = getLocalizedErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  // 重新加载用户信息（检查邮箱验证状态）
  const reloadUser = async () => {
    try {
      clearError();
      if (currentUser) {
        await reloadUserWithTimeout();
      }
    } catch (err) {
      const message = getLocalizedErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  // Google 登录
  const loginWithGoogle = async () => {
    try {
      clearError();
      await loginWithGoogleTimeout();
    } catch (err) {
      const message = getLocalizedErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  // 登出
  const logout = async () => {
    clearError();
    await firebaseSignOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 网络状态监听
  useEffect(() => {
    const cleanup = createNetworkStatusListener((online) => {
      setIsNetworkOnline(online);
      if (!online) {
        setError('网络连接已断开');
      } else {
        // 网络恢复时清除网络相关错误
        setError(prev => {
          if (prev?.includes('网络')) {
            return null;
          }
          return prev;
        });
      }
    });

    return cleanup;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout,
    sendVerificationEmail,
    reloadUser,
    loading,
    isNetworkOnline,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
