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

/**
 * 格式化相对时间（如"刚刚"、"5分钟前"、"2小时前"等）
 * @param isoString ISO 格式的时间字符串
 * @returns 格式化后的相对时间字符串
 */
export function formatRelativeTime(isoString: string | null): string {
    if (!isoString) return '-';

    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return '刚刚';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
    return `${Math.floor(diffDays / 365)}年前`;
}

/**
 * 检查用户是否被禁用
 * @param userId 用户 ID
 * @returns 是否被禁用
 */
export async function checkUserBanned(userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('user_bans')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            // 表可能不存在，安全地返回 false
            console.warn('checkUserBanned error:', error.message);
            return false;
        }

        return data !== null;
    } catch (err) {
        console.warn('Failed to check user ban status:', err);
        return false;
    }
}
