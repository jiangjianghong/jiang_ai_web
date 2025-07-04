import { useAuth } from '@/contexts/AuthContext';
import { firebaseConnectionManager } from '@/lib/firebaseConnectionManager';

export default function NetworkStatus() {
  const { isNetworkOnline, isFirebaseConnected, error } = useAuth();

  // 如果网络正常、Firebase连接正常且没有错误，不显示任何内容
  if (isNetworkOnline && isFirebaseConnected && !error) {
    return null;
  }

  const handleRetryConnection = () => {
    console.log('🔄 重置Firebase连接状态...');
    firebaseConnectionManager.reset();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {!isNetworkOnline && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg shadow-lg flex items-center space-x-2">
          <i className="fa-solid fa-wifi-slash"></i>
          <span className="text-sm">网络连接不可用</span>
        </div>
      )}
      
      {!isFirebaseConnected && isNetworkOnline && (
        <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg shadow-lg">
          <div className="flex items-start justify-between space-x-2">
            <div className="flex items-start space-x-2 flex-1">
              <i className="fa-solid fa-cloud-slash mt-0.5"></i>
              <div className="text-sm">
                <div className="font-medium">Firebase连接异常</div>
                <div className="text-xs mt-1">云同步功能可能受限</div>
                <button
                  onClick={handleRetryConnection}
                  className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  重试连接
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-lg">
          <div className="flex items-start space-x-2">
            <i className="fa-solid fa-exclamation-triangle mt-0.5"></i>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
