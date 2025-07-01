import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailVerificationBanner() {
  const { currentUser, sendVerificationEmail, reloadUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // 如果用户未登录或邮箱已验证，不显示横幅
  if (!currentUser || currentUser.emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      alert('✅ 验证邮件已发送！请检查您的邮箱（包括垃圾邮件文件夹）');
    } catch (error) {
      alert('❌ 发送失败，请稍后重试');
      console.error('发送验证邮件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    try {
      await reloadUser();
      // 刷新页面以更新状态
      window.location.reload();
    } catch (error) {
      console.error('检查验证状态失败:', error);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('确定要登出吗？您可以稍后验证邮箱后重新登录。')) {
      await logout();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white shadow-lg"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-envelope-open-text text-xl"></i>
            <div>
              <p className="font-medium">
                请验证您的邮箱地址
              </p>
              <p className="text-sm text-orange-100">
                我们已向 <strong>{currentUser.email}</strong> 发送了验证链接
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 px-3 py-1 rounded text-sm transition-colors"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                  发送中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane mr-1"></i>
                  重新发送
                </>
              )}
            </button>
            
            <button
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 px-3 py-1 rounded text-sm transition-colors"
            >
              {isCheckingVerification ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                  检查中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check-circle mr-1"></i>
                  已验证
                </>
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition-colors"
            >
              <i className="fa-solid fa-sign-out-alt mr-1"></i>
              登出
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
