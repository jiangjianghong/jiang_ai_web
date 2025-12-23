import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface HourlyData {
    hour: number;
    count: number;
}

interface SearchKeyword {
    keyword: string;
    count: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminAnalytics() {
    const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
    const [popularSearches, setPopularSearches] = useState<SearchKeyword[]>([]);
    const [userDistribution, setUserDistribution] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dayRange, setDayRange] = useState(7);

    useEffect(() => {
        loadAnalytics();
    }, [dayRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load hourly activity distribution
            await loadHourlyActivity();

            // Load popular searches
            await loadPopularSearches();

            // Load user role distribution
            await loadUserDistribution();

        } catch (err: any) {
            console.error('Failed to load analytics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadHourlyActivity = async () => {
        try {
            // Try to use RPC function if available
            const { data, error } = await supabase.rpc('get_hourly_activity', { p_days: dayRange });

            if (!error && data) {
                // 填充完整24小时数据
                const hourlyMap = new Map<number, number>(data.map((d: any) => [d.hour, Number(d.count) || 0]));
                const fullData: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
                    hour: i,
                    count: hourlyMap.get(i) ?? 0,
                }));
                setHourlyData(fullData);
            }
        } catch {
            // Fallback: Calculate from user_stats directly
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - dayRange);

            const { data: statsData } = await supabase
                .from('user_stats')
                .select('last_active_at')
                .gte('last_active_at', cutoffDate.toISOString());

            if (statsData) {
                const hourCounts: Record<number, number> = {};
                statsData.forEach((s) => {
                    if (s.last_active_at) {
                        const hour = new Date(s.last_active_at).getHours();
                        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                    }
                });

                const fullData = Array.from({ length: 24 }, (_, i) => ({
                    hour: i,
                    count: hourCounts[i] || 0,
                }));
                setHourlyData(fullData);
            }
        }
    };

    const loadPopularSearches = async () => {
        try {
            // Try RPC function
            const { data, error } = await supabase.rpc('get_popular_searches', {
                p_limit: 10,
                p_days: dayRange
            });

            if (!error && data) {
                setPopularSearches(data);
            }
        } catch {
            // Table might not exist
            console.log('search_logs not available');
            setPopularSearches([]);
        }
    };

    const loadUserDistribution = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('role');

            if (!error && data) {
                const roleCounts: Record<string, number> = {
                    'user': 0,
                    'admin': 0,
                    'super_admin': 0,
                };

                data.forEach((u) => {
                    const role = u.role || 'user';
                    roleCounts[role] = (roleCounts[role] || 0) + 1;
                });

                setUserDistribution([
                    { name: '普通用户', value: roleCounts['user'] },
                    { name: '管理员', value: roleCounts['admin'] },
                    { name: '超级管理员', value: roleCounts['super_admin'] },
                ].filter(d => d.value > 0));
            }
        } catch (err) {
            console.error('Failed to load user distribution:', err);
        }
    };

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">📊 行为分析</h2>
                <div className="flex gap-2">
                    {[7, 14, 30].map((days) => (
                        <button
                            key={days}
                            onClick={() => setDayRange(days)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${dayRange === days
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                        >
                            {days}天
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Activity */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">⏰ 活跃时段分布</h3>
                    {hourlyData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="hour"
                                        tickFormatter={formatHour}
                                        stroke="rgba(255,255,255,0.5)"
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                        interval={3}
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
                                        labelFormatter={(hour) => `${formatHour(hour as number)}`}
                                        formatter={(value) => [`${value} 次`, '活跃次数']}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#hourlyGradient)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <defs>
                                        <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-white/40">
                            暂无活跃数据
                        </div>
                    )}
                    <p className="text-white/40 text-xs mt-2 text-center">
                        基于最近 {dayRange} 天的用户活跃时间统计
                    </p>
                </div>

                {/* User Distribution */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">👥 用户角色分布</h3>
                    {userDistribution.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={userDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {userDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '8px',
                                        }}
                                        formatter={(value) => [`${value} 人`, '用户数']}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-white/40">
                            暂无用户数据
                        </div>
                    )}
                </div>
            </div>

            {/* Popular Searches */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">🔥 热门搜索词</h3>
                {popularSearches.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {popularSearches.map((item, index) => (
                            <div
                                key={item.keyword}
                                className="bg-white/5 rounded-lg p-3 flex items-center gap-2"
                            >
                                <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-gray-300' :
                                        index === 2 ? 'text-amber-600' :
                                            'text-white/40'
                                    }`}>
                                    #{index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{item.keyword}</p>
                                    <p className="text-white/40 text-xs">{item.count} 次</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-white/40">
                        <p>暂无搜索记录</p>
                        <p className="text-xs mt-1">需要先运行数据库迁移并开始记录搜索日志</p>
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-300 text-sm">
                💡 <strong>提示：</strong>
                热门搜索词功能需要在前端搜索时记录到 search_logs 表。
                活跃时段分布基于用户最后活跃时间计算。
            </div>
        </div>
    );
}
