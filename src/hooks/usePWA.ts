import { useState, useEffect } from 'react';
import { CACHE_NAMES } from '../lib/swConfig';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface OfflineCapabilities {
  isOfflineReady: boolean;
  hasServiceWorker: boolean;
  cacheStatus: 'loading' | 'ready' | 'error';
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
      });
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听网络变化
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}

export function useOfflineCapabilities(): OfflineCapabilities {
  const [capabilities, setCapabilities] = useState<OfflineCapabilities>({
    isOfflineReady: false,
    hasServiceWorker: 'serviceWorker' in navigator,
    cacheStatus: 'loading',
  });

  useEffect(() => {
    const checkOfflineReadiness = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          // 使用统一配置的缓存名
          const hasCache = await caches.has(CACHE_NAMES.STATIC);

          setCapabilities((prev) => ({
            ...prev,
            isOfflineReady: !!registration && hasCache,
            cacheStatus: hasCache ? 'ready' : 'loading',
          }));
        } else {
          setCapabilities((prev) => ({
            ...prev,
            cacheStatus: 'error',
          }));
        }
      } catch (error) {
        console.error('检查离线能力失败:', error);
        setCapabilities((prev) => ({
          ...prev,
          cacheStatus: 'error',
        }));
      }
    };

    checkOfflineReadiness();
  }, []);

  return capabilities;
}

interface PWAInstallPrompt {
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
}

export function usePWAInstall(): PWAInstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已安装
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSStandalone = (window.navigator as any).standalone === true;

      setIsInstalled(isStandalone || (isIOS && isIOSStandalone));
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    checkInstalled();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('安装提示失败:', error);
      return false;
    }
  };

  const dismissPrompt = () => {
    setIsInstallable(false);
    setDeferredPrompt(null);
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
  };
}

interface AdaptiveLoadingConfig {
  enableImageOptimization: boolean;
  enablePrefetch: boolean;
  batchSize: number;
  delay: number;
}

export function useAdaptiveLoading(): AdaptiveLoadingConfig {
  const networkStatus = useNetworkStatus();
  const [config, setConfig] = useState<AdaptiveLoadingConfig>({
    enableImageOptimization: true,
    enablePrefetch: true,
    batchSize: 5,
    delay: 0,
  });

  useEffect(() => {
    const { effectiveType, downlink, isOnline } = networkStatus;

    if (!isOnline) {
      setConfig({
        enableImageOptimization: true,
        enablePrefetch: false,
        batchSize: 1,
        delay: 0,
      });
      return;
    }

    // 根据网络状况调整加载策略
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      setConfig({
        enableImageOptimization: true,
        enablePrefetch: false,
        batchSize: 1,
        delay: 1000,
      });
    } else if (effectiveType === '3g' || downlink < 1.5) {
      setConfig({
        enableImageOptimization: true,
        enablePrefetch: false,
        batchSize: 3,
        delay: 500,
      });
    } else if (effectiveType === '4g' || downlink >= 1.5) {
      setConfig({
        enableImageOptimization: false,
        enablePrefetch: true,
        batchSize: 5,
        delay: 200,
      });
    } else {
      // 高速网络
      setConfig({
        enableImageOptimization: false,
        enablePrefetch: true,
        batchSize: 10,
        delay: 0,
      });
    }
  }, [networkStatus]);

  return config;
}
