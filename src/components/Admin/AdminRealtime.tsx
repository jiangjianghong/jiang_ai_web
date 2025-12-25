import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/adminUtils';

interface OnlineUser {
    id: string;
    email: string;
    display_name: string | null;
    last_active_at: string;
}

export default function AdminRealtime() {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [recentlyActive, setRecentlyActive] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const loadRealtimeData = useCallback(async () => {
        try {
            const now = new Date();

            // 在线用户：5分钟内活跃
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            // 最近活跃：1小时内活跃
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            // Get user stats with recent activity
            const { data: statsData, error: statsError } = await supabase
                .from('user_stats')
                .select('id, last_active_at')
                .gte('last_active_at', oneHourAgo.toISOString())
                .order('last_active_at', { ascending: false });

            if (statsError) throw statsError;

            if (!statsData || statsData.length === 0) {
                setOnlineUsers([]);
                setRecentlyActive([]);
                setLastUpdate(now);
                setLoading(false);
                return;
            }

            // Get user profiles
            const userIds = statsData.map(s => s.id);
            const { data: profilesData, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, email, display_name')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);

            // Combine data
            const allUsers: OnlineUser[] = statsData.map(s => ({
                id: s.id,
                email: profileMap.get(s.id)?.email || '',
                display_name: profileMap.get(s.id)?.display_name || null,
                last_active_at: s.last_active_at,
            }));

            // Split into online (5 min) and recently active (1 hour)
            const online = allUsers.filter(u =>
                new Date(u.last_active_at) >= fiveMinutesAgo
            );
            const recent = allUsers.filter(u =>
                new Date(u.last_active_at) < fiveMinutesAgo
            );

            setOnlineUsers(online);
            setRecentlyActive(recent);
            setLastUpdate(now);

        } catch (err) {
            console.error('Failed to load realtime data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRealtimeData();
    }, [loadRealtimeData]);

    // 自动刷新
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            loadRealtimeData();
        }, 30000); // 30秒刷新一次

        return () => clearInterval(interval);
    }, [autoRefresh, loadRealtimeData]);

    // Supabase Realtime 订阅
    useEffect(() => {
        const channel = supabase
            .channel('user_stats_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_stats',
                },
                () => {
                    // 有用户活跃更新时刷新数据
                    loadRealtimeData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadRealtimeData]);

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
                <h2 className="text-2xl font-bold text-white">⚡ 实时监控</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded"
                        />
                        自动刷新
                    </label>
                    <button
                        onClick={loadRealtimeData}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                        <span>🔄</span> 刷新
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-3xl">🟢</span>
                        <span className="text-4xl font-bold text-white">{onlineUsers.length}</span>
                    </div>
                    <p className="text-white/60 mt-2 text-sm">当前在线（5分钟内）</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-3xl">🟡</span>
                        <span className="text-4xl font-bold text-white">{recentlyActive.length}</span>
                    </div>
                    <p className="text-white/60 mt-2 text-sm">最近活跃（1小时内）</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-3xl">👥</span>
                        <span className="text-4xl font-bold text-white">{onlineUsers.length + recentlyActive.length}</span>
                    </div>
                    <p className="text-white/60 mt-2 text-sm">活跃用户总计</p>
                </div>
            </div>

            {/* Online Users */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
                        当前在线用户
                    </h3>
                    {lastUpdate && (
                        <span className="text-white/40 text-xs">
                            更新时间: {lastUpdate.toLocaleTimeString('zh-CN')}
                        </span>
                    )}
                </div>

                {onlineUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {onlineUsers.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <span className="text-green-400">👤</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">
                                        {user.display_name || '未设置昵称'}
                                    </p>
                                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                                </div>
                                <span className="text-green-400 text-xs whitespace-nowrap">
                                    {formatRelativeTime(user.last_active_at)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-white/40">
                        当前没有在线用户
                    </div>
                )}
            </div>

            {/* Recently Active */}
            {recentlyActive.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>
                        最近活跃（5分钟-1小时）
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recentlyActive.slice(0, 12).map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <span className="text-yellow-400">👤</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">
                                        {user.display_name || '未设置昵称'}
                                    </p>
                                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                                </div>
                                <span className="text-yellow-400 text-xs whitespace-nowrap">
                                    {formatRelativeTime(user.last_active_at)}
                                </span>
                            </div>
                        ))}
                    </div>
                    {recentlyActive.length > 12 && (
                        <p className="text-center text-white/40 text-sm mt-4">
                            还有 {recentlyActive.length - 12} 位最近活跃用户
                        </p>
                    )}
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-300 text-sm">
                💡 <strong>说明：</strong>
                在线状态基于用户最后活跃时间判断。
                系统每30秒自动刷新，也会通过 Supabase Realtime 接收实时更新。
            </div>
        </div>
    );
}
