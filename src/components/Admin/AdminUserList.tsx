import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction, formatRelativeTime } from '@/lib/adminUtils';
import ConfirmModal from '@/components/ConfirmModal';
import AdminUserDetail from './AdminUserDetail';

interface UserProfile {
    id: string;
    email: string;
    display_name: string | null;
    role: string;
    created_at: string;
}

interface UserWithStats extends UserProfile {
    last_visit_date: string | null;
    last_active_at: string | null;
    total_searches: number;
    total_site_visits: number;
    is_banned: boolean;
}

export default function AdminUserList() {
    const [users, setUsers] = useState<UserWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);

            // 获取用户基本信息（不包含个人数据如 user_websites）
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, email, display_name, role, created_at')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // 获取用户统计（聚合数据）
            const { data: stats, error: statsError } = await supabase
                .from('user_stats')
                .select('id, last_visit_date, last_active_at, total_searches, total_site_visits');

            if (statsError) throw statsError;

            // 获取禁用状态
            const { data: bans, error: bansError } = await supabase
                .from('user_bans')
                .select('user_id');

            if (bansError) console.warn('Failed to load bans:', bansError);

            const bannedIds = new Set((bans || []).map((b) => b.user_id));

            // 合并数据
            const usersWithStats: UserWithStats[] = (profiles || []).map((profile) => {
                const userStats = stats?.find((s) => s.id === profile.id);
                return {
                    ...profile,
                    last_visit_date: userStats?.last_visit_date || null,
                    last_active_at: userStats?.last_active_at || null,
                    total_searches: userStats?.total_searches || 0,
                    total_site_visits: userStats?.total_site_visits || 0,
                    is_banned: bannedIds.has(profile.id),
                };
            });

            setUsers(usersWithStats);
        } catch (err: any) {
            console.error('Failed to load users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (userId: string, currentlyBanned: boolean, userEmail: string) => {
        const action = currentlyBanned ? '解禁' : '禁用';

        setConfirmModal({
            isOpen: true,
            title: `确认${action}用户`,
            message: `确定要${action}此用户吗？${!currentlyBanned ? '禁用后该用户将无法登录。' : ''}`,
            onConfirm: async () => {
                try {
                    if (currentlyBanned) {
                        // 解禁
                        await supabase.from('user_bans').delete().eq('user_id', userId);
                        // 记录日志
                        await logAdminAction('unban_user', userId, 'user', { email: userEmail });
                    } else {
                        // 禁用
                        await supabase.from('user_bans').insert({
                            user_id: userId,
                            reason: '管理员手动禁用',
                        });
                        // 记录日志
                        await logAdminAction('ban_user', userId, 'user', { email: userEmail, reason: '管理员手动禁用' });
                    }
                    await loadUsers();
                } catch (err: any) {
                    console.error('Failed to ban/unban user:', err);
                    setError(err.message);
                }
                setConfirmModal(null);
            },
        });
    };

    const filteredUsers = users.filter(
        (user) =>
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                加载失败: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">👥 用户管理</h2>
                <div className="text-white/60 text-sm">
                    共 {users.length} 位用户
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="搜索邮箱或昵称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                    🔍
                </span>
            </div>

            {/* User Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-white/60 border-b border-white/10 bg-white/5">
                                <th className="text-left py-3 px-4">用户</th>
                                <th className="text-left py-3 px-4">角色</th>
                                <th className="text-right py-3 px-4">搜索次数</th>
                                <th className="text-right py-3 px-4">访问次数</th>
                                <th className="text-left py-3 px-4">最后活跃</th>
                                <th className="text-left py-3 px-4">注册时间</th>
                                <th className="text-center py-3 px-4">状态</th>
                                <th className="text-center py-3 px-4">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="text-white font-medium">
                                                {user.display_name || '未设置'}
                                            </div>
                                            <div className="text-white/40 text-xs">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'super_admin'
                                            ? 'bg-red-500/20 text-red-400'
                                            : user.role === 'admin'
                                                ? 'bg-orange-500/20 text-orange-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {user.role === 'super_admin' ? '超管' : user.role === 'admin' ? '管理员' : '用户'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right text-white/80">
                                        {user.total_searches.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-right text-white/80">
                                        {user.total_site_visits.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-white/60" title={user.last_active_at || user.last_visit_date || ''}>
                                        {formatRelativeTime(user.last_active_at) !== '-'
                                            ? formatRelativeTime(user.last_active_at)
                                            : user.last_visit_date || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-white/60">
                                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {user.is_banned ? (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                                                已禁用
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                                正常
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setSelectedUserId(user.id)}
                                                className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs transition-colors"
                                            >
                                                详情
                                            </button>
                                            <button
                                                onClick={() => handleBanUser(user.id, user.is_banned, user.email)}
                                                className={`px-3 py-1 rounded text-xs transition-colors ${user.is_banned
                                                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                                    }`}
                                            >
                                                {user.is_banned ? '解禁' : '禁用'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                        {searchTerm ? '未找到匹配的用户' : '暂无用户'}
                    </div>
                )}
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-300 text-sm">
                💡 <strong>隐私保护：</strong> 用户列表仅显示基本信息和聚合统计，不包含用户的网站列表、收藏夹等个人数据。
            </div>

            {/* User Detail Modal */}
            {selectedUserId && (
                <AdminUserDetail
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}

            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onClose={() => setConfirmModal(null)}
                />
            )}
        </div>
    );
}
