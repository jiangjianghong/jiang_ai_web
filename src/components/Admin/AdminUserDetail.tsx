import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/adminUtils';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface UserDetailProps {
    userId: string;
    onClose: () => void;
}

interface UserProfile {
    id: string;
    email: string;
    display_name: string | null;
    role: string;
    created_at: string;
}

interface UserStats {
    total_searches: number;
    total_site_visits: number;
    app_opened: number;
    settings_opened: number;
    first_use_date: string;
    last_visit_date: string;
    last_active_at: string | null;
}

interface AdminLog {
    id: string;
    action_type: string;
    details: any;
    created_at: string;
    admin_email?: string;
}

export default function AdminUserDetail({ userId, onClose }: UserDetailProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUserData();
    }, [userId]);

    const loadUserData = async () => {
        try {
            setLoading(true);

            // Load user profile
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('id, email, display_name, role, created_at')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Load user stats
            const { data: statsData, error: statsError } = await supabase
                .from('user_stats')
                .select('total_searches, total_site_visits, app_opened, settings_opened, first_use_date, last_visit_date, last_active_at')
                .eq('id', userId)
                .single();

            if (!statsError && statsData) {
                setStats(statsData);
            }

            // Load admin logs for this user (if table exists)
            try {
                const { data: logsData, error: logsError } = await supabase
                    .from('admin_logs')
                    .select('id, action_type, details, created_at')
                    .eq('target_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (!logsError && logsData) {
                    setLogs(logsData);
                }
            } catch {
                // Table might not exist yet
                console.log('admin_logs table not found');
            }

        } catch (err: any) {
            console.error('Failed to load user data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-CN');
    };

    const getActionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'ban_user': '🚫 禁用用户',
            'unban_user': '✅ 解禁用户',
            'create_announcement': '📢 创建公告',
            'update_announcement': '✏️ 更新公告',
            'delete_announcement': '🗑️ 删除公告',
        };
        return labels[type] || type;
    };

    // Prepare chart data for user activity
    const activityData = stats ? [
        { name: '搜索', value: stats.total_searches },
        { name: '访问', value: stats.total_site_visits },
        { name: '打开应用', value: stats.app_opened },
        { name: '设置页面', value: stats.settings_opened },
    ] : [];

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-gray-900 rounded-xl p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">👤 用户详情</h2>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                            {error}
                        </div>
                    )}

                    {profile && (
                        <>
                            {/* Basic Info */}
                            <div className="bg-white/5 rounded-lg p-4">
                                <h3 className="text-sm text-white/60 mb-3">基本信息</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-white/40 text-xs">昵称</p>
                                        <p className="text-white font-medium">{profile.display_name || '未设置'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">邮箱</p>
                                        <p className="text-white font-medium">{profile.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">角色</p>
                                        <span className={`px-2 py-1 rounded-full text-xs ${profile.role === 'super_admin' ? 'bg-red-500/20 text-red-400' :
                                            profile.role === 'admin' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {profile.role === 'super_admin' ? '超管' : profile.role === 'admin' ? '管理员' : '用户'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">注册时间</p>
                                        <p className="text-white font-medium">{formatDate(profile.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            {stats && (
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h3 className="text-sm text-white/60 mb-3">使用统计</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-400">{stats.total_searches}</p>
                                            <p className="text-white/40 text-xs">搜索次数</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-400">{stats.total_site_visits}</p>
                                            <p className="text-white/40 text-xs">访问次数</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-yellow-400">{stats.app_opened}</p>
                                            <p className="text-white/40 text-xs">打开应用</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-purple-400">{stats.settings_opened}</p>
                                            <p className="text-white/40 text-xs">设置页面</p>
                                        </div>
                                    </div>

                                    {/* Activity Chart */}
                                    <div className="h-40 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={activityData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                                                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} width={60} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                                        <div>
                                            <p className="text-white/40 text-xs">首次使用</p>
                                            <p className="text-white">{stats.first_use_date || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-xs">最后活跃</p>
                                            <p className="text-white">{formatRelativeTime(stats.last_active_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admin Logs */}
                            {logs.length > 0 && (
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h3 className="text-sm text-white/60 mb-3">管理操作历史</h3>
                                    <div className="space-y-2">
                                        {logs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                                <span className="text-white text-sm">{getActionTypeLabel(log.action_type)}</span>
                                                <span className="text-white/40 text-xs">{formatRelativeTime(log.created_at)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
}
