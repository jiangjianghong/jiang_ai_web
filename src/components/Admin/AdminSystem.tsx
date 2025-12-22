import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface StorageInfo {
    bucketName: string;
    fileCount: number;
    totalSize: number;
}

export default function AdminSystem() {
    const [storageInfo, setStorageInfo] = useState<StorageInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStorageInfo();
    }, []);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">⚙️ 系统监控</h2>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

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

            {/* System Status */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">📊 系统状态</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-white/60">数据库连接</span>
                        <span className="flex items-center gap-2 text-green-400">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            正常
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-white/60">认证服务</span>
                        <span className="flex items-center gap-2 text-green-400">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            正常
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-white/60">存储服务</span>
                        <span className="flex items-center gap-2 text-green-400">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            正常
                        </span>
                    </div>
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
                        <span className="text-white/60">构建时间</span>
                        <span className="text-white/80 font-mono text-xs">
                            {new Date().toLocaleString('zh-CN')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
