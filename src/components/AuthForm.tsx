import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const { login, register, loginWithGoogle, loginWithGithub, loginWithNotion, sendVerificationEmail, resetPasswordForEmail, error: authError } = useAuth();

  // 倒计时效果
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 组合错误显示：优先显示本地验证错误，然后是认证错误
  const displayError = localError || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setLocalError('请填写完整信息');
      return;
    }

    if (!isLogin && !displayName.trim()) {
      setLocalError('请输入用户名');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('请输入有效的邮箱地址');
      return;
    }

    // 验证用户名格式（注册时）
    if (!isLogin) {
      if (displayName.length < 2 || displayName.length > 20) {
        setLocalError('用户名长度需在2-20个字符之间');
        return;
      }
      if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(displayName)) {
        setLocalError('用户名只能包含字母、数字、中文、下划线和短横线');
        return;
      }
    }

    setLoading(true);
    setLocalError('');

    try {
      if (isLogin) {
        await login(email, password);
        onSuccess();
      } else {
        // 注册流程
        await register(email, password);

        // 注册成功后显示验证邮件提示
        setShowVerificationMessage(true);
        setVerificationEmail(email);

        // 保存用户名到本地，验证邮箱后会同步到云端
        localStorage.setItem('pendingDisplayName', displayName);
      }
    } catch (error: any) {
      console.error('认证失败:', error);
      // 错误处理现在由AuthContext统一管理，这里不需要特殊处理
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (cooldown > 0) return;

    try {
      await sendVerificationEmail();
      setCooldown(60);
      alert('验证邮件已重新发送，请检查邮箱');
    } catch (error) {
      alert('发送验证邮件失败，请稍后重试');
    }
  };

  // 处理忘记密码
  const handleForgotPassword = async () => {
    if (cooldown > 0) return;

    setLocalError('');

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!resetEmail || !emailRegex.test(resetEmail)) {
      setLocalError('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);

    try {
      await resetPasswordForEmail(resetEmail);
      setCooldown(60);
      setShowForgotPassword(false);
      setResetEmail('');
      alert('✅ 密码重置邮件已发送，请检查您的邮箱！');
    } catch (error) {
      console.error('发送密码重置邮件失败:', error);
      setLocalError((error as Error).message || '发送失败，请重试');
    } finally {
      setLoading(false);
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
            <h4 className="text-sm font-medium text-green-800">注册成功！请验证您的邮箱</h4>
            <p className="text-sm text-green-700 mt-1">
              我们已向 <strong>{verificationEmail}</strong> 发送了验证邮件。
              请点击邮件中的链接完成验证后即可使用完整功能。
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleResendVerification}
                disabled={cooldown > 0}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `${cooldown}秒后重试` : '重新发送验证邮件'}
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {showForgotPassword ? '重置密码' : isLogin ? '登录账号' : '注册账号'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {showForgotPassword
            ? '请输入您的邮箱地址'
            : isLogin
              ? '使用邮箱登录您的账号'
              : '创建新账号并设置用户名'}
        </p>
      </div>

      {displayError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
          {displayError}
        </div>
      )}

      {showForgotPassword ? (
        /* 忘记密码表单 */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">邮箱 *</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入您的邮箱"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleForgotPassword}
            disabled={loading || !resetEmail || cooldown > 0}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors"
          >
            {loading ? '发送中...' : cooldown > 0 ? `${cooldown}秒后可重试` : '发送重置邮件'}
          </button>

          <div className="text-center">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setLocalError('');
              }}
              className="text-blue-500 hover:text-blue-600 text-sm"
              disabled={loading}
            >
              返回登录
            </button>
          </div>
        </div>
      ) : (
        /* 原来的登录/注册表单 */
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">用户名 *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入用户名（2-20个字符）"
                  disabled={loading}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">支持中文、英文、数字、下划线和短横线</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">邮箱 *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入邮箱"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">密码 *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>

            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setLocalError('');
                  }}
                  className="text-sm text-blue-500 hover:text-blue-600 hover:underline font-medium"
                >
                  忘记密码？
                </button>
              </div>
            )}
          </form>

          {!showForgotPassword && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">或者</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {/* Google */}
                <button
                  onClick={() => loginWithGoogle()}
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
                >
                  <img
                    className="h-5 w-5 mr-2"
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                  />
                  使用 Google 账号登录
                </button>

                {/* GitHub */}
                <button
                  onClick={() => loginWithGithub()}
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="fa-brands fa-github text-xl mr-2"></i>
                  使用 GitHub 账号登录
                </button>

                {/* Notion */}
                <button
                  onClick={() => loginWithNotion()}
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
                >
                  <img src="https://www.notion.so/images/favicon.ico" alt="Notion" className="h-5 w-5 mr-2" />
                  使用 Notion 账号登录
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
          )}
        </>
      )}
    </div>
  );
}
