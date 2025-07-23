import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  loading: boolean;
  isNetworkOnline: boolean;
  isSupabaseConnected: boolean;
  error: string | null;
  successMessage: string | null;
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

// 错误消息本地化
const getLocalizedErrorMessage = (error: any): string => {
  const message = error?.message || error?.toString() || '未知错误';
  
  const errorMappings: { [key: string]: string } = {
    'Invalid login credentials': '邮箱或密码错误',
    'Email not confirmed': '请先验证邮箱',
    'User already registered': '该邮箱已注册',
    'Password should be at least 6 characters': '密码至少需要6位字符',
    'Invalid email': '邮箱格式不正确',
    'Network error': '网络连接错误',
    'Too many requests': '请求过于频繁，请稍后再试',
    'Email already in use': '该邮箱已被使用',
    'Weak password': '密码强度不够',
    'Invalid password': '密码不正确'
  };

  // 检查是否有匹配的错误消息
  for (const [key, value] of Object.entries(errorMappings)) {
    if (message.includes(key)) {
      return value;
    }
  }

  return message;
};

// 网络状态监听
const isOnline = () => navigator.onLine;

const createNetworkStatusListener = (callback: (online: boolean) => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNetworkOnline, setIsNetworkOnline] = useState(isOnline());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 清除错误
  const clearError = () => setError(null);

  // 邮箱密码登录
  const login = async (email: string, password: string) => {
    try {
      clearError();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      console.log('登录成功:', data.user?.email);
    } catch (err) {
      const message = getLocalizedErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  // 邮箱密码注册
  const register = async (email: string, password: string) => {
    try {
      clearError();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            // 用户元数据，会传递到邮件模板
            app_name: '江江的网站',
            welcome_message: '你好呀！欢迎使用江江的网站，点击下面的链接确认注册哦。祝您使用愉快！',
            site_url: window.location.origin
          }
        }
      });

      if (error) throw error;
      
      console.log('注册成功，请检查邮箱验证:', data.user?.email);
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
      if (currentUser && !currentUser.email_confirmed_at) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: currentUser.email!,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;
        console.log('验证邮件已发送');
      }
    } catch (err) {
      const message = getLocalizedErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  // 重新加载用户信息
  const reloadUser = async () => {
    try {
      clearError();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      setCurrentUser(user);
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (err) {
      const message = getLocalizedErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  };

  // 登出
  const logout = async () => {
    try {
      clearError();
      
      // 检查当前是否有有效会话
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('用户已经登出，无需重复登出');
        // 确保本地状态也清除
        setSession(null);
        setCurrentUser(null);
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // 如果是会话缺失错误，不视为真正的错误
        if (error.message?.includes('Auth session missing') || error.message?.includes('session missing')) {
          console.log('会话已过期，清除本地状态');
          setSession(null);
          setCurrentUser(null);
          return;
        }
        throw error;
      }
      
      console.log('✅ 登出成功');
    } catch (err) {
      console.error('登出失败:', err);
      // 即使登出失败，也清除本地状态
      setSession(null);
      setCurrentUser(null);
      
      // 只有在非会话相关错误时才显示错误信息
      const errorMessage = (err as Error).message;
      if (!errorMessage?.includes('Auth session missing') && !errorMessage?.includes('session missing')) {
        const message = getLocalizedErrorMessage(err);
        setError(message);
      }
    }
  };

  useEffect(() => {
    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);

      // 处理认证事件
      switch (event) {
        case 'SIGNED_IN':
          setError(null);
          break;
        case 'SIGNED_OUT':
          setError(null);
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          break;
        case 'USER_UPDATED':
          console.log('User updated');
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 检测邮箱确认成功
  useEffect(() => {
    const checkEmailConfirmation = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      
      if (params.get('type') === 'signup' && params.get('access_token')) {
        // 邮箱确认成功
        console.log('✅ 邮箱确认成功！');
        // 清除URL中的hash参数
        window.history.replaceState({}, document.title, window.location.pathname);
        // 显示成功消息
        setTimeout(() => {
          setSuccessMessage('🎉 邮箱确认成功！欢迎使用江江的网站！');
          // 3秒后清除消息
          setTimeout(() => setSuccessMessage(null), 3000);
        }, 1000);
      }
    };

    checkEmailConfirmation();
  }, []);

  // Supabase连接状态监听
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('user_profiles').select('id').limit(1);
        setIsSupabaseConnected(!error);
        
        if (error && error.message?.includes('网络')) {
          setError('Supabase服务暂时不可用，部分功能可能受限');
        } else if (error?.message?.includes('Supabase') && isSupabaseConnected) {
          setError(null);
        }
      } catch (error) {
        setIsSupabaseConnected(false);
        setError('Supabase服务暂时不可用，部分功能可能受限');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // 每30秒检查一次

    return () => clearInterval(interval);
  }, [isSupabaseConnected]);

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
    session,
    login,
    register,
    loginWithGoogle,
    logout,
    sendVerificationEmail,
    reloadUser,
    loading,
    isNetworkOnline,
    isSupabaseConnected,
    error,
    successMessage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
