import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

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
    const [chartView, setChartView] = useState<'line' | 'bar'>('line');

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

            // 获取本地时区的今日日期字符串
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const { count: newUsersToday, error: newUsersError } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', `${today}T00:00:00`);

            if (newUsersError) throw newUsersError;

            // 获取统计汇总（聚合数据，不含个人信息）
            const { data: statsData, error: statsError } = await supabase
                .from('user_stats')
                .select('total_searches, total_site_visits, last_visit_date, last_active_at');

            if (statsError) throw statsError;

            // 今日活跃：判断 last_active_at 是否在今天（使用本地时区），或回退到 last_visit_date
            const activeUsersToday = statsData?.filter((s) => {
                if (s.last_active_at) {
                    // 将 ISO 时间转换为本地日期进行比较
                    const activeDate = new Date(s.last_active_at);
                    const activeLocalDate = `${activeDate.getFullYear()}-${String(activeDate.getMonth() + 1).padStart(2, '0')}-${String(activeDate.getDate()).padStart(2, '0')}`;
                    return activeLocalDate === today;
                }
                return s.last_visit_date === today;
            }).length || 0;

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
                .order('date', { ascending: true })
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

    // 格式化日期用于显示
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    // 准备图表数据
    const chartData = dailyData.map((row) => ({
        ...row,
        displayDate: formatDate(row.date),
    }));

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <StatCard
                    title="总访问次数"
                    value={stats?.totalSiteVisits || 0}
                    icon="📈"
                    color="indigo"
                />
            </div>

            {/* Charts Section */}
            {dailyData.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">📈 趋势图表（最近30天）</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartView('line')}
                                className={`px-3 py-1 rounded text-sm transition-colors ${chartView === 'line'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                            >
                                折线图
                            </button>
                            <button
                                onClick={() => setChartView('bar')}
                                className={`px-3 py-1 rounded text-sm transition-colors ${chartView === 'bar'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                            >
                                柱状图
                            </button>
                        </div>
                    </div>

                    {/* User Growth Chart */}
                    <div className="mb-6">
                        <h4 className="text-sm text-white/60 mb-3">用户增长</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                {chartView === 'line' ? (
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="displayDate"
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                        />
                                        <YAxis
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '8px',
                                            }}
                                            labelStyle={{ color: 'white' }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="total_users"
                                            name="总用户"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="new_users"
                                            name="新用户"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                                        />
                                    </LineChart>
                                ) : (
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="displayDate"
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                        />
                                        <YAxis
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '8px',
                                            }}
                                            labelStyle={{ color: 'white' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="new_users" name="新用户" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="active_users" name="活跃用户" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Active Users Chart */}
                    <div>
                        <h4 className="text-sm text-white/60 mb-3">活跃用户趋势</h4>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="displayDate"
                                        stroke="rgba(255,255,255,0.5)"
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.5)"
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '8px',
                                        }}
                                        labelStyle={{ color: 'white' }}
                                    />
                                    <Bar
                                        dataKey="active_users"
                                        name="活跃用户"
                                        fill="url(#colorActive)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <defs>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">📋 详细数据</h3>
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
                                {[...dailyData].reverse().slice(0, 10).map((row) => (
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
