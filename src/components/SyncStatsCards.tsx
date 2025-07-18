import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function SyncStatsCards() {
  const { currentUser } = useAuth();

  // 如果用户未登录，不显示
  if (!currentUser) return null;

  // 暂时不显示任何统计卡片
  return null;
}
