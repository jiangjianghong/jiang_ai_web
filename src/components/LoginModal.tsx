import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const { login, register, loginWithGoogle, sendVerificationEmail, reloadUser, error: authError, isNetworkOnline } = useAuth();

  // 组合错误显示：优先显示本地验证错误，然后是认证错误
  const displayError = localError || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setLocalError('请填写完整信息');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    setLocalError('');

    try {
      if (isLogin) {
        await login(email, password);
        onClose();
      } else {
        await register(email, password);
        // 注册成功后显示验证邮件提示
        setShowVerificationMessage(true);
        setVerificationEmail(email);
      }
    } catch (error: any) {
      console.error('认证失败:', error);
      
      // 处理常见的 Firebase 错误
      // Supabase的错误处理已经在AuthContext中完成，这里不需要额外处理
      setLocalError(error.message || (isLogin ? '登录失败，请重试' : '注册失败，请重试'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLocalError('');
    
    try {
      await loginWithGoogle();
      onClose();
    } catch (error: any) {
      console.error('Google登录失败:', error);
      setLocalError('Google登录失败，请重试');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        className="w-96 bg-white rounded-xl shadow-2xl z-50 p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? '登录' : '注册'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
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
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入密码"
              disabled={loading}
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
            使用 Google 登录
          </button>
        </div>

        {/* 邮箱验证提示 */}
        {showVerificationMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-start space-x-2">
              <i className="fa-solid fa-envelope-circle-check text-green-600 mt-0.5"></i>
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  注册成功！请验证您的邮箱
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  我们已向 <strong>{verificationEmail}</strong> 发送了验证邮件。
                  请点击邮件中的链接完成验证后登录。
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
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                  >
                    返回登录
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:text-blue-600"
            disabled={loading}
          >
            {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
