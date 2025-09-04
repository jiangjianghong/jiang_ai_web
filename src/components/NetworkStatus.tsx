import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function NetworkStatus() {
  const { error } = useAuth();

  // 检查网络状态
  const isOnline = navigator.onLine;

  // 如果网络正常且没有错误，不显示任何内容
  if (isOnline && !error) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {!isOnline && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg shadow-lg flex items-center space-x-2">
          <i className="fa-solid fa-wifi-slash"></i>
          <span className="text-sm">网络连接不可用</span>
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
