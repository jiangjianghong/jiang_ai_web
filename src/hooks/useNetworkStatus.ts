import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const online = navigator.onLine;
      let isSlowConnection = false;
      let connectionType = 'unknown';

      // 检测连接类型和速度
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connectionType = connection.effectiveType || connection.type || 'unknown';
          // 判断是否为慢速连接
          isSlowConnection = ['slow-2g', '2g'].includes(connection.effectiveType);
        }
      }

      setNetworkStatus({
        isOnline: online,
        isSlowConnection,
        connectionType,
      });
    };

    const handleOnline = () => {
      console.log('📡 网络已连接');
      updateNetworkStatus();
    };

    const handleOffline = () => {
      console.log('📡 网络已断开');
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // 初始检测
    updateNetworkStatus();

    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听连接类型变化
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}
