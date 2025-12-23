import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNetworkStatus, usePWAInstall, useOfflineCapabilities } from '@/hooks/usePWA';
import { SuccessFeedback } from '@/components/MicroInteractions';

export function PWAPrompt() {
  const { isInstallable, promptInstall, dismissPrompt } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [installResult, setInstallResult] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({
    show: false,
    success: false,
    message: '',
  });

  useEffect(() => {
    if (isInstallable) {
      // 延迟显示，避免打扰用户
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const success = await promptInstall();
    setShowPrompt(false);

    setInstallResult({
      show: true,
      success,
      message: success ? '应用安装成功！' : '安装已取消',
    });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    dismissPrompt();
  };

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 dark:border-gray-700 p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-2xl">📱</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">安装到主屏幕</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">获得更好的体验，支持离线使用</p>
                </div>
              </div>

              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors"
                >
                  安装
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium py-2 px-3 rounded-md transition-colors"
                >
                  稍后
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuccessFeedback
        message={installResult.message}
        isVisible={installResult.show}
        type={installResult.success ? 'success' : 'info'}
        onComplete={() => setInstallResult((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}

export function NetworkStatusIndicator() {
  const networkStatus = useNetworkStatus();
  const offlineCapabilities = useOfflineCapabilities();
  const [showDetails, setShowDetails] = useState(false);

  if (networkStatus.isOnline) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="bg-yellow-500/95 backdrop-blur-sm text-white px-4 py-2">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-wifi-slash text-sm"></i>
            <span className="text-sm font-medium">
              {offlineCapabilities.isOfflineReady ? '离线模式 - 基本功能可用' : '网络连接已断开'}
            </span>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs underline hover:no-underline"
          >
            {showDetails ? '收起' : '详情'}
          </button>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              className="mt-2 pt-2 border-t border-white/20 max-w-6xl mx-auto"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xs space-y-1">
                <p>离线功能状态：{offlineCapabilities.isOfflineReady ? '✅ 可用' : '❌ 不可用'}</p>
                <p>本地数据：{typeof Storage !== 'undefined' ? '✅ 可访问' : '❌ 不可访问'}</p>
                <p>缓存状态：{offlineCapabilities.cacheStatus}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function AdaptiveImageLoader({
  src,
  alt,
  className = '',
  placeholder = '',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  priority?: boolean;
}) {
  const networkStatus = useNetworkStatus();
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const shouldOptimize =
      !networkStatus.isOnline ||
      networkStatus.effectiveType === 'slow-2g' ||
      networkStatus.effectiveType === '2g' ||
      networkStatus.downlink < 0.5;

    let finalSrc = src;

    // 如果是弱网环境，尝试加载优化版本
    if (shouldOptimize && !priority) {
      // 这里可以实现图片压缩或使用不同分辨率
      finalSrc = src.includes('?') ? `${src}&q=50` : `${src}?q=50`;
    }

    const img = new Image();
    img.onload = () => {
      setImageSrc(finalSrc);
      setIsLoading(false);
      setError(false);
    };

    img.onerror = () => {
      if (placeholder) {
        setImageSrc(placeholder);
      }
      setIsLoading(false);
      setError(true);
    };

    // 弱网环境下延迟加载
    const delay = shouldOptimize && !priority ? 500 : 0;
    const timer = setTimeout(() => {
      img.src = finalSrc;
    }, delay);

    return () => clearTimeout(timer);
  }, [src, placeholder, priority, networkStatus]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        loading={priority ? 'eager' : 'lazy'}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && !placeholder && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <i className="fa-solid fa-image text-gray-400 dark:text-gray-500 text-2xl"></i>
        </div>
      )}

      {/* 网络状态指示器 */}
      {!networkStatus.isOnline && (
        <div
          className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"
          title="离线模式"
        ></div>
      )}
    </div>
  );
}
