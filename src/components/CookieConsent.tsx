import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
  onCustomize?: () => void;
}

export default function CookieConsent({ onAccept, onDecline, onCustomize }: CookieConsentProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查用户是否已经做出选择
    const consentStatus = localStorage.getItem('cookie-consent');
    if (!consentStatus) {
      // 延迟显示，避免影响首屏加载
      const timer = setTimeout(() => {
        setShowConsent(true);
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setIsVisible(false);

    // 延迟隐藏组件，等待动画完成
    setTimeout(() => {
      setShowConsent(false);
      onAccept?.();
    }, 300);

    // 在用户同意后，可以启用所有存储功能
    console.log('✅ 用户已同意Cookie使用');
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setIsVisible(false);

    // 清除可能已存在的非必要数据
    try {
      // 保留必要的功能性数据，清除其他数据
      const essentialKeys = ['cookie-consent', 'cookie-consent-date'];
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !essentialKeys.includes(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('清理存储数据失败:', error);
    }

    setTimeout(() => {
      setShowConsent(false);
      onDecline?.();
    }, 300);

    console.log('❌ 用户拒绝了Cookie使用');
  };

  const handleCustomize = () => {
    // 调用父组件传入的自定义设置回调
    onCustomize?.();
  };

  if (!showConsent) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-[9998] pointer-events-none"
          />

          {/* Cookie同意横幅 */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl"
            role="dialog"
            aria-label="Cookie consent banner"
            data-nosnippet
            data-noindex
          >
            <div className="max-w-7xl mx-auto p-4 sm:p-6" data-nosnippet>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <i className="fa-solid fa-cookie-bite text-amber-500 text-xl"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        🍪 Cookie使用说明
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        我们使用Cookie和本地存储来提供更好的用户体验，包括：
                        <br />
                        <span className="inline-flex items-center gap-4 mt-1 text-xs">
                          <span>📱 保存您的网站收藏</span>
                          <span>🎨 记住界面设置</span>
                          <span>☁️ 同步云端数据</span>
                          <span>📊 性能分析</span>
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        您可以随时在浏览器设置中管理这些Cookie。了解更多请查看我们的
                        <button
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline mx-1"
                          onClick={() =>
                            window.open('https://github.com/jiangjianghong/tomato-tab#privacy', '_blank')
                          }
                        >
                          隐私政策
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCustomize}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <i className="fa-solid fa-cog mr-2"></i>
                    自定义设置
                  </button>
                  <button
                    onClick={handleDecline}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <i className="fa-solid fa-times mr-2"></i>
                    拒绝
                  </button>
                  <button
                    onClick={handleAccept}
                    className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <i className="fa-solid fa-check mr-2"></i>
                    接受并继续
                  </button>
                </div>
              </div>
            </div>

            {/* 进度指示器 */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
