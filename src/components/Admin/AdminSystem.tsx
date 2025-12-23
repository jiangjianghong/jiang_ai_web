import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface HealthCheck {
    name: string;
    status: 'checking' | 'healthy' | 'warning' | 'error';
    responseTime?: number;
    message?: string;
}

interface StorageInfo {
    bucketName: string;
    fileCount: number;
    totalSize: number;
}

export default function AdminSystem() {
    const [storageInfo, setStorageInfo] = useState<StorageInfo[]>([]);
    const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
        { name: '数据库连接', status: 'checking' },
        { name: '认证服务', status: 'checking' },
        { name: '存储服务', status: 'checking' },
        { name: 'Edge Functions', status: 'checking' },
    ]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

    const runHealthChecks = useCallback(async () => {
        const checks: HealthCheck[] = [];

        // 1. Database Connection Check
        const dbStart = performance.now();
        try {
            const { error } = await supabase
                .from('user_profiles')
                .select('id', { count: 'exact', head: true })
                .limit(1);
            const dbTime = Math.round(performance.now() - dbStart);

            if (error) {
                checks.push({
                    name: '数据库连接',
                    status: 'error',
                    responseTime: dbTime,
                    message: error.message
                });
            } else {
                checks.push({
                    name: '数据库连接',
                    status: dbTime > 1000 ? 'warning' : 'healthy',
                    responseTime: dbTime,
                    message: dbTime > 1000 ? '响应较慢' : '正常'
                });
            }
        } catch (err: any) {
            checks.push({
                name: '数据库连接',
                status: 'error',
                message: err.message
            });
        }

        // 2. Auth Service Check
        const authStart = performance.now();
        try {
            const { data, error } = await supabase.auth.getSession();
            const authTime = Math.round(performance.now() - authStart);

            if (error) {
                checks.push({
                    name: '认证服务',
                    status: 'error',
                    responseTime: authTime,
                    message: error.message
                });
            } else {
                checks.push({
                    name: '认证服务',
                    status: authTime > 1000 ? 'warning' : 'healthy',
                    responseTime: authTime,
                    message: data?.session ? '已登录' : '未登录状态'
                });
            }
        } catch (err: any) {
            checks.push({
                name: '认证服务',
                status: 'error',
                message: err.message
            });
        }

        // 3. Storage Service Check
        const storageStart = performance.now();
        try {
            const { data, error } = await supabase.storage.from('favicons').list('', { limit: 1 });
            const storageTime = Math.round(performance.now() - storageStart);

            if (error) {
                checks.push({
                    name: '存储服务',
                    status: 'error',
                    responseTime: storageTime,
                    message: error.message
                });
            } else {
                checks.push({
                    name: '存储服务',
                    status: storageTime > 2000 ? 'warning' : 'healthy',
                    responseTime: storageTime,
                    message: `${data?.length || 0} 文件可访问`
                });
            }
        } catch (err: any) {
            checks.push({
                name: '存储服务',
                status: 'error',
                message: err.message
            });
        }

        // 4. Edge Functions Check (通过访问壁纸函数测试)
        const funcStart = performance.now();
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/bing-wallpaper`, {
                method: 'HEAD',
            });
            const funcTime = Math.round(performance.now() - funcStart);

            if (response.ok || response.status === 401) {
                // 401 是正常的，因为我们没有带token
                checks.push({
                    name: 'Edge Functions',
                    status: funcTime > 3000 ? 'warning' : 'healthy',
                    responseTime: funcTime,
                    message: '服务可达'
                });
            } else {
                checks.push({
                    name: 'Edge Functions',
                    status: 'warning',
                    responseTime: funcTime,
                    message: `HTTP ${response.status}`
                });
            }
        } catch (err: any) {
            checks.push({
                name: 'Edge Functions',
                status: 'warning',
                message: '无法连接或未部署'
            });
        }

        setHealthChecks(checks);
        setLastCheckTime(new Date());
    }, []);

    useEffect(() => {
        loadStorageInfo();
        runHealthChecks();
    }, [runHealthChecks]);

    const loadStorageInfo = async () => {
        try {
            setLoading(true);

            // 获取存储桶信息
            const buckets = ['favicons', 'wallpapers'];
            const info: StorageInfo[] = [];

            for (const bucket of buckets) {
                try {
                    const { data, error } = await supabase.storage.from(bucket).list('', {
                        limit: 1000,
                    });

                    if (!error && data) {
                        const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
                        info.push({
                            bucketName: bucket,
                            fileCount: data.length,
                            totalSize,
                        });
                    }
                } catch (err) {
                    console.warn(`Failed to get info for bucket ${bucket}:`, err);
                    info.push({
                        bucketName: bucket,
                        fileCount: 0,
                        totalSize: 0,
                    });
                }
            }

            setStorageInfo(info);
        } catch (err: any) {
            console.error('Failed to load storage info:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusColor = (status: HealthCheck['status']) => {
        switch (status) {
            case 'healthy': return 'text-green-400';
            case 'warning': return 'text-yellow-400';
            case 'error': return 'text-red-400';
            default: return 'text-white/40';
        }
    };

    const getStatusDot = (status: HealthCheck['status']) => {
        switch (status) {
            case 'healthy': return 'bg-green-400';
            case 'warning': return 'bg-yellow-400';
            case 'error': return 'bg-red-400';
            default: return 'bg-white/40 animate-pulse';
        }
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
                <h2 className="text-2xl font-bold text-white">⚙️ 系统监控</h2>
                <button
                    onClick={runHealthChecks}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                    <span>🔄</span> 重新检测
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* Health Status */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">🏥 服务健康状态</h3>
                    {lastCheckTime && (
                        <span className="text-white/40 text-xs">
                            上次检测: {lastCheckTime.toLocaleTimeString('zh-CN')}
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {healthChecks.map((check) => (
                        <div key={check.name} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${getStatusDot(check.status)}`}></span>
                                <div>
                                    <span className="text-white font-medium">{check.name}</span>
                                    {check.message && (
                                        <p className="text-white/40 text-xs mt-0.5">{check.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                                    {check.status === 'checking' ? '检测中...' :
                                        check.status === 'healthy' ? '正常' :
                                            check.status === 'warning' ? '警告' : '异常'}
                                </span>
                                {check.responseTime !== undefined && (
                                    <p className="text-white/40 text-xs mt-0.5">{check.responseTime}ms</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Storage Info */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">📦 存储空间</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storageInfo.map((bucket) => (
                        <div key={bucket.bucketName} className="bg-white/5 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium capitalize">{bucket.bucketName}</span>
                                <span className="text-white/60 text-sm">{bucket.fileCount} 文件</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatSize(bucket.totalSize)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">🔗 快捷链接</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <span className="text-2xl">🌐</span>
                        <div>
                            <div className="text-white font-medium">Supabase Dashboard</div>
                            <div className="text-white/40 text-sm">数据库管理</div>
                        </div>
                    </a>
                    <a
                        href="https://supabase.com/dashboard/project/_/logs/explorer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <span className="text-2xl">📋</span>
                        <div>
                            <div className="text-white font-medium">日志查看器</div>
                            <div className="text-white/40 text-sm">Edge Function 日志</div>
                        </div>
                    </a>
                    <a
                        href="https://supabase.com/dashboard/project/_/functions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <span className="text-2xl">⚡</span>
                        <div>
                            <div className="text-white font-medium">Edge Functions</div>
                            <div className="text-white/40 text-sm">函数管理与部署</div>
                        </div>
                    </a>
                </div>
            </div>

            {/* Environment Info */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">🔧 环境信息</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                        <span className="text-white/60">Supabase URL</span>
                        <span className="text-white/80 font-mono text-xs">
                            {import.meta.env.VITE_SUPABASE_URL?.replace(/https?:\/\//, '').split('.')[0]}...
                        </span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                        <span className="text-white/60">Site URL</span>
                        <span className="text-white/80 font-mono text-xs">
                            {import.meta.env.VITE_SITE_URL || window.location.origin}
                        </span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 rounded">
                        <span className="text-white/60">当前时间</span>
                        <span className="text-white/80 font-mono text-xs">
                            {new Date().toLocaleString('zh-CN')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
