// 管理员操作日志工具函数
import { supabase } from '@/lib/supabase';

/**
 * 记录管理员操作日志
 * @param actionType 操作类型 (如 'ban_user', 'create_announcement' 等)
 * @param targetId 操作目标的 ID
 * @param targetType 目标类型 (如 'user', 'announcement' 等)
 * @param details 操作详情 (可选)
 */
export async function logAdminAction(
    actionType: string,
    targetId: string,
    targetType: string = 'user',
    details: Record<string, any> = {}
): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('logAdminAction: No authenticated user');
            return;
        }

        await supabase.from('admin_logs').insert({
            admin_id: user.id,
            action_type: actionType,
            target_id: targetId,
            target_type: targetType,
            details,
        });
    } catch (err) {
        console.warn('Failed to log admin action:', err);
    }
}
