import { useSyncStatus } from '@/contexts/SyncContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function SyncStatsCards() {
  const { syncStatus } = useSyncStatus();
  const { currentUser } = useAuth();

  // 如果用户未登录，不显示
  if (!currentUser) return null;

  const getSyncStatusText = () => {
    if (syncStatus.syncInProgress) return '同步中...';
    if (syncStatus.syncError) return '同步失败';
    if (syncStatus.pendingChanges > 0) return '待同步';
    return '已同步';
  };

  const getSyncStatusColor = () => {
    if (syncStatus.syncInProgress) return 'blue';
    if (syncStatus.syncError) return 'red';
    if (syncStatus.pendingChanges > 0) return 'yellow';
    return 'green';
  };

  const getDebounceText = () => {
    if (syncStatus.syncInProgress) return '处理中...';
    if (syncStatus.pendingChanges > 0) return '5秒防抖';
    return '45秒强制';
  };

  const statusColor = getSyncStatusColor();

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className={`bg-${statusColor}-50 rounded p-2 text-center`}>
        <div className={`font-medium text-${statusColor}-700`}>云端备份</div>
        <div className={`text-${statusColor}-600`}>
          {currentUser.email_confirmed_at ? getSyncStatusText() : '邮箱未验证'}
        </div>
      </div>
      <div className="bg-blue-50 rounded p-2 text-center">
        <div className="font-medium text-blue-700">智能同步</div>
        <div className="text-blue-600">
          {getDebounceText()}
        </div>
      </div>
    </div>
  );
}
