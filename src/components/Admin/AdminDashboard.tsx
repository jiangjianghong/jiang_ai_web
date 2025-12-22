import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Stats {
    totalUsers: number;
    newUsersToday: number;
    activeUsersToday: number;
    totalSearches: number;
    totalSiteVisits: number;
}

interface DailyData {
    date: string;
    total_users: number;
    new_users: number;
    active_users: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
        loadDailyAnalytics();
    }, []);

    const loadStats = async () => {
        try {
            // 获取用户总数
            const { count: totalUsers, error: usersError } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            if (usersError) throw usersError;

            // 获取今日新用户
            const today = new Date().toISOString().split('T')[0];
            const { count: newUsersToday, error: newUsersError } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', `${today}T00:00:00`);

            if (newUsersError) throw newUsersError;

            // 获取统计汇总（聚合数据，不含个人信息）
            const { data: statsData, error: statsError } = await supabase
                .from('user_stats')
                .select('total_searches, total_site_visits, last_visit_date');

            if (statsError) throw statsError;

            const activeUsersToday = statsData?.filter(
                (s) => s.last_visit_date === today
            ).length || 0;

            const totalSearches = statsData?.reduce(
                (sum, s) => sum + (s.total_searches || 0),
                0
            ) || 0;

            const totalSiteVisits = statsData?.reduce(
                (sum, s) => sum + (s.total_site_visits || 0),
                0
            ) || 0;

            setStats({
                totalUsers: totalUsers || 0,
                newUsersToday: newUsersToday || 0,
                activeUsersToday,
                totalSearches,
                totalSiteVisits,
            });
        } catch (err: any) {
            console.error('Failed to load stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadDailyAnalytics = async () => {
        try {
            const { data, error } = await supabase
                .from('analytics_daily')
                .select('date, total_users, new_users, active_users')
                .order('date', { ascending: false })
                .limit(30);

            if (error) throw error;
            setDailyData(data || []);
        } catch (err: any) {
            console.error('Failed to load daily analytics:', err);
        }
    };

    // 触发聚合统计
    const handleAggregateStats = async () => {
        try {
            const { error } = await supabase.rpc('aggregate_daily_stats');
            if (error) throw error;
            await loadDailyAnalytics();
        } catch (err: any) {
            console.error('Failed to aggregate stats:', err);
            setError(err.message);
        }
    };

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
                <h2 className="text-2xl font-bold text-white">📊 仪表盘</h2>
                <button
                    onClick={handleAggregateStats}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                    更新统计数据
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="总用户数"
                    value={stats?.totalUsers || 0}
                    icon="👥"
                    color="blue"
                />
                <StatCard
                    title="今日新用户"
                    value={stats?.newUsersToday || 0}
                    icon="🆕"
                    color="green"
                />
                <StatCard
                    title="今日活跃"
                    value={stats?.activeUsersToday || 0}
                    icon="⚡"
                    color="yellow"
                />
                <StatCard
                    title="总搜索次数"
                    value={stats?.totalSearches || 0}
                    icon="🔍"
                    color="purple"
                />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                    title="总访问次数"
                    value={stats?.totalSiteVisits || 0}
                    icon="📈"
                    color="indigo"
                />
            </div>

            {/* Daily Trend */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">📈 每日趋势（最近30天）</h3>
                {dailyData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-white/60 border-b border-white/10">
                                    <th className="text-left py-2 px-3">日期</th>
                                    <th className="text-right py-2 px-3">总用户</th>
                                    <th className="text-right py-2 px-3">新用户</th>
                                    <th className="text-right py-2 px-3">活跃用户</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyData.map((row) => (
                                    <tr key={row.date} className="border-b border-white/5 text-white/80">
                                        <td className="py-2 px-3">{row.date}</td>
                                        <td className="text-right py-2 px-3">{row.total_users}</td>
                                        <td className="text-right py-2 px-3 text-green-400">+{row.new_users}</td>
                                        <td className="text-right py-2 px-3">{row.active_users}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-white/40 text-center py-8">
                        暂无历史数据，请点击"更新统计数据"生成
                    </p>
                )}
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-300 text-sm">
                💡 <strong>隐私说明：</strong> 此页面仅显示聚合统计数据，管理员无法查看用户的具体网站列表、收藏夹等个人数据。
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number;
    icon: string;
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
    const colorClasses = {
        blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/30',
        green: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/30',
        yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/30',
        purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30',
        indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/30',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-5`}>
            <div className="flex items-center justify-between">
                <span className="text-3xl">{icon}</span>
                <span className="text-3xl font-bold text-white">{value.toLocaleString()}</span>
            </div>
            <p className="text-white/60 mt-2 text-sm">{title}</p>
        </div>
    );
}
