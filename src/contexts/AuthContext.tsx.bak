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
import { firebaseConnectionManager } from '@/lib/firebaseConnectionManager';

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
  isFirebaseConnected: boolean;
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
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
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
    // 设置较短的超时时间，如果Firebase连接失败则快速进入离线模式
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Firebase连接超时，进入离线模式');
        setLoading(false);
        setError('当前处于离线模式，部分功能可能不可用');
      }
    }, 2000); // 2秒超时

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutId);
      setCurrentUser(user);
      setLoading(false);
      // 如果成功连接Firebase，清除离线模式错误
      if (error?.includes('离线模式')) {
        setError(null);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Firebase连接状态监听
  useEffect(() => {
    const cleanup = firebaseConnectionManager.addListener((isConnected) => {
      setIsFirebaseConnected(isConnected);
      
      if (!isConnected) {
        setError('Firebase服务暂时不可用，部分功能可能受限');
      } else if (error?.includes('Firebase')) {
        setError(null);
      }
    });

    return cleanup;
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
    isFirebaseConnected,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
