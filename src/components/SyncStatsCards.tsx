import { useSyncStatus } from '@/contexts/SyncContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SyncStatsCards() {
  const { syncStatus } = useSyncStatus();
  const { currentUser } = useAuth();

  // 如果用户未登录，不显示
  if (!currentUser) return null;

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="bg-blue-50 rounded p-2 text-center">
        <div className="font-medium text-blue-700">云端备份</div>
        <div className="text-blue-600">
          {currentUser ? '已启用' : '未启用'}
        </div>
      </div>
      <div className="bg-green-50 rounded p-2 text-center">
        <div className="font-medium text-green-700">智能同步</div>
        <div className="text-green-600">
          {syncStatus.pendingChanges > 0 ? '3秒防抖' : '30秒强制'}
        </div>
      </div>
    </div>
  );
}
