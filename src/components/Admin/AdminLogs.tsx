import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminLog {
    id: string;
    admin_id: string;
    action_type: string;
    target_id: string | null;
    target_type: string | null;
    details: any;
    created_at: string;
    admin_email?: string;
}

const ACTION_TYPES = [
    { value: 'all', label: '全部操作' },
    { value: 'ban_user', label: '🚫 禁用用户' },
    { value: 'unban_user', label: '✅ 解禁用户' },
    { value: 'create_announcement', label: '📢 创建公告' },
    { value: 'update_announcement', label: '✏️ 更新公告' },
    { value: 'delete_announcement', label: '🗑️ 删除公告' },
    { value: 'toggle_announcement', label: '🔄 切换公告状态' },
];

export default function AdminLogs() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState('all');
    const [page, setPage] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        loadLogs();
    }, [filterType, page]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (filterType !== 'all') {
                query = query.eq('action_type', filterType);
            }

            const { data, error: logsError } = await query;

            if (logsError) {
                // 表可能不存在
                if (logsError.code === '42P01' || logsError.message.includes('does not exist')) {
                    setError('日志表尚未创建，请确保已运行数据库迁移脚本 (supabase_deploy.sql)');
                } else {
                    throw logsError;
                }
                return;
            }

            // 获取管理员邮箱信息
            if (data && data.length > 0) {
                const adminIds = [...new Set(data.map(log => log.admin_id).filter(Boolean))];

                if (adminIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('user_profiles')
                        .select('id, email')
                        .in('id', adminIds);

                    const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

                    setLogs(data.map(log => ({
                        ...log,
                        admin_email: emailMap.get(log.admin_id) || '未知',
                    })));
                } else {
                    setLogs(data);
                }
            } else {
                setLogs([]);
            }

        } catch (err: any) {
            console.error('Failed to load logs:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getActionLabel = (type: string) => {
        const action = ACTION_TYPES.find(a => a.value === type);
        return action?.label || type;
    };

    const getActionColor = (type: string) => {
        if (type.includes('ban')) return 'text-red-400';
        if (type.includes('unban')) return 'text-green-400';
        if (type.includes('create')) return 'text-blue-400';
        if (type.includes('update')) return 'text-yellow-400';
        if (type.includes('delete')) return 'text-red-400';
        return 'text-white/80';
    };

    const renderDetails = (details: any) => {
        if (!details || Object.keys(details).length === 0) return '-';

        const entries = Object.entries(details).slice(0, 3);
        return entries.map(([key, value]) => (
            <span key={key} className="inline-block mr-2 text-xs text-white/40">
                {key}: {String(value).slice(0, 30)}{String(value).length > 30 ? '...' : ''}
            </span>
        ));
    };

    if (loading && logs.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">📋 操作日志</h2>
                <button
                    onClick={() => loadLogs()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                    刷新
                </button>
            </div>

            {error && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-300">
                    ⚠️ {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {ACTION_TYPES.map((type) => (
                    <button
                        key={type.value}
                        onClick={() => { setFilterType(type.value); setPage(0); }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterType === type.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Logs Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {logs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-white/60 border-b border-white/10 bg-white/5">
                                    <th className="text-left py-3 px-4">时间</th>
                                    <th className="text-left py-3 px-4">操作者</th>
                                    <th className="text-left py-3 px-4">操作类型</th>
                                    <th className="text-left py-3 px-4">目标</th>
                                    <th className="text-left py-3 px-4">详情</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 text-white/60 whitespace-nowrap">
                                            {formatTime(log.created_at)}
                                        </td>
                                        <td className="py-3 px-4 text-white/80">
                                            {log.admin_email || '-'}
                                        </td>
                                        <td className={`py-3 px-4 font-medium ${getActionColor(log.action_type)}`}>
                                            {getActionLabel(log.action_type)}
                                        </td>
                                        <td className="py-3 px-4 text-white/60">
                                            <span className="text-xs bg-white/10 px-2 py-1 rounded">
                                                {log.target_type || '-'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {renderDetails(log.details)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-white/40">
                        {error ? '无法加载日志' : '暂无操作日志'}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {logs.length > 0 && (
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        上一页
                    </button>
                    <span className="text-white/60 text-sm">第 {page + 1} 页</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={logs.length < pageSize}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        下一页
                    </button>
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-300 text-sm">
                💡 <strong>说明：</strong> 此页面记录所有管理员操作，包括用户禁用/解禁、公告管理等。日志会自动记录操作者和操作时间。
            </div>
        </div>
    );
}
