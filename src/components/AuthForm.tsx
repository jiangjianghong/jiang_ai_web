import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

// 网络状态检查器
const checkNetworkStatus = () => {
  return {
    isOnline: navigator.onLine,
    connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
    timestamp: new Date().toISOString()
  };
};

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const { login, register, loginWithGoogle, sendVerificationEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('请填写完整信息');
      return;
    }

    if (!isLogin && !displayName.trim()) {
      setError('请输入用户名');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    // 验证用户名格式（注册时）
    if (!isLogin) {
      if (displayName.length < 2 || displayName.length > 20) {
        setError('用户名长度需在2-20个字符之间');
        return;
      }
      if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(displayName)) {
        setError('用户名只能包含字母、数字、中文、下划线和短横线');
        return;
      }
    }

    setLoading(true);
    setError('');

    console.log('🔐 开始认证流程:', { isLogin, email: email.substring(0, 3) + '***' });

    try {
      if (isLogin) {
        console.log('🔑 执行登录操作');
        await login(email, password);
        console.log('✅ 登录流程完成');
        onSuccess();
      } else {
        // 注册流程
        console.log('📝 执行注册操作');
        await register(email, password);
        console.log('✅ 注册流程完成');
        
        // 注册成功后显示验证邮件提示
        setShowVerificationMessage(true);
        setVerificationEmail(email);
        
        // 保存用户名到本地，验证邮箱后会同步到云端
        localStorage.setItem('pendingDisplayName', displayName);
      }
    } catch (error: any) {
      console.error('❌ 认证失败详情:', {
        code: error.code,
        message: error.message,
        authErrorCode: error.code,
        networkStatus: checkNetworkStatus(),
        stack: error.stack
      });
      
      const errorCode = error.code;
      switch (errorCode) {
        case 'auth/user-not-found':
          setError('用户不存在，请检查邮箱或注册新账号');
          break;
        case 'auth/wrong-password':
          setError('密码错误，请重试');
          break;
        case 'auth/email-already-in-use':
          setError('邮箱已被注册，请登录或使用其他邮箱');
          break;
        case 'auth/weak-password':
          setError('密码强度不够，至少需要6位字符');
          break;
        case 'auth/invalid-email':
          setError('邮箱格式不正确');
          break;
        case 'auth/network-request-failed':
          setError('网络连接失败，请检查网络连接后重试。如果问题持续，可能是防火墙阻止了 Firebase 服务。');
          break;
        case 'auth/too-many-requests':
          setError('请求过于频繁，请稍后再试');
          break;
        case 'auth/invalid-credential':
          setError('登录凭据无效，请检查邮箱和密码');
          break;
        default:
          setError(isLogin ? '登录失败，请重试' : '注册失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    console.log('🔑 开始 Google 登录流程');
    
    try {
      await loginWithGoogle();
      console.log('✅ Google 登录流程完成');
      onSuccess();
    } catch (error: any) {
      console.error('❌ Google 登录失败详情:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setError('Google登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      alert('验证邮件已重新发送，请检查邮箱');
    } catch (error) {
      alert('发送验证邮件失败，请稍后重试');
    }
  };

  if (showVerificationMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-green-50 border border-green-200 rounded-lg"
      >
        <div className="flex items-start space-x-2">
          <i className="fa-solid fa-envelope-circle-check text-green-600 mt-0.5"></i>
          <div>
            <h4 className="text-sm font-medium text-green-800">
              注册成功！请验证您的邮箱
            </h4>
            <p className="text-sm text-green-700 mt-1">
              我们已向 <strong>{verificationEmail}</strong> 发送了验证邮件。
              请点击邮件中的链接完成验证后即可使用完整功能。
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleResendVerification}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
              >
                重新发送验证邮件
              </button>
              <button
                onClick={() => {
                  setShowVerificationMessage(false);
                  setIsLogin(true);
                  setEmail('');
                  setPassword('');
                  setDisplayName('');
                }}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
              >
                返回登录
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {isLogin ? '登录账号' : '注册账号'}
        </h3>
        <p className="text-sm text-gray-600">
          {isLogin ? '使用邮箱登录您的账号' : '创建新账号并设置用户名'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名 *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入用户名（2-20个字符）"
              disabled={loading}
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              支持中文、英文、数字、下划线和短横线
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            邮箱 *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入邮箱"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            密码 *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入密码（至少6位）"
            disabled={loading}
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors"
        >
          {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
        </button>
      </form>

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">或</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          <i className="fab fa-google mr-2"></i>
          使用 Google {isLogin ? '登录' : '注册'}
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-500 hover:text-blue-600"
          disabled={loading}
        >
          {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
        </button>
      </div>
    </div>
  );
}
