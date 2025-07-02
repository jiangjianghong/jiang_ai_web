import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { auth } from '@/lib/firebase-debug'; // 临时使用调试版本

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  loading: boolean;
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

  // 邮箱密码登录（带重试机制）
  const login = async (email: string, password: string) => {
    console.log('🔑 尝试登录:', { email });
    
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 登录尝试 ${attempt}/${maxRetries}`);
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ 登录成功:', result.user?.uid);
        return;
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ 登录尝试 ${attempt} 失败:`, error.code);
        
        // 如果是网络错误且还有重试次数，等待后重试
        if (error.code === 'auth/network-request-failed' && attempt < maxRetries) {
          console.log(`⏱️ ${2 * attempt}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        
        // 其他错误或重试次数用完，直接抛出
        break;
      }
    }
    
    // 所有重试都失败，抛出最后的错误
    console.error('❌ 登录最终失败:', lastError);
    throw lastError;
  };

  // 邮箱密码注册（带邮箱验证）
  const register = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // 立即发送验证邮件
    if (result.user) {
      await sendEmailVerification(result.user);
    }
  };

  // 发送验证邮件
  const sendVerificationEmail = async () => {
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
    }
  };

  // 重新加载用户信息（检查邮箱验证状态）
  const reloadUser = async () => {
    if (currentUser) {
      await reload(currentUser);
    }
  };

  // Google 登录
  const loginWithGoogle = async () => {
    console.log('🔑 尝试 Google 登录');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google 登录成功:', result.user?.uid);
    } catch (error) {
      console.error('❌ Google 登录失败:', error);
      throw error;
    }
  };

  // 登出
  const logout = async () => {
    await firebaseSignOut(auth);
  };

  useEffect(() => {
    console.log('🔧 设置 Firebase Auth 状态监听器');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 Auth 状态变化:', user ? `用户登录: ${user.uid}` : '用户未登录');
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error('❌ Auth 状态监听错误:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout,
    sendVerificationEmail,
    reloadUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
