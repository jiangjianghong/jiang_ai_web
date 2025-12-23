import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'update' | 'maintenance';
    created_at: string;
}

const TYPE_CONFIG = {
    info: {
        icon: '📢',
        label: '通知',
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
    },
    update: {
        icon: '🆕',
        label: '更新',
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
        icon: '⚠️',
        label: '警告',
        bg: 'bg-yellow-50 dark:bg-yellow-900/30',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-600 dark:text-yellow-400',
    },
    maintenance: {
        icon: '🔧',
        label: '维护',
        bg: 'bg-red-50 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-600 dark:text-red-400',
    },
};

interface AnnouncementCenterProps {
    isVisible?: boolean;
}

export default function AnnouncementCenter({ isVisible = true }: AnnouncementCenterProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            // 获取有效公告
            const { data, error } = await supabase
                .from('announcements')
                .select('id, title, content, type, created_at')
                .eq('is_active', true)
                .or('expires_at.is.null,expires_at.gt.now()')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            setAnnouncements(data || []);

            // 检查是否有未读公告
            const lastReadTime = localStorage.getItem('last_read_announcements');
            if (data && data.length > 0) {
                if (!lastReadTime) {
                    setHasUnread(true);
                } else {
                    const hasNew = data.some(a => new Date(a.created_at) > new Date(lastReadTime));
                    setHasUnread(hasNew);
                }
            }
        } catch (err) {
            console.error('Failed to load announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        setHasUnread(false);
        // 记录阅读时间
        localStorage.setItem('last_read_announcements', new Date().toISOString());
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    };

    if (!isVisible || loading) return null;

    return (
        <>
            {/* 公告入口按钮 - 左下角 */}
            <motion.div
                className="fixed bottom-4 left-4 z-40"
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.5 }}
            >
                <button
                    onClick={handleOpen}
                    className="relative p-2 hover:scale-110 transition-all duration-300 group"
                    title="查看公告"
                >
                    <i className="fa-solid fa-bullhorn text-white/70 group-hover:text-white transition-colors"></i>

                    {/* 未读红点 */}
                    {hasUnread && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                    )}
                </button>
            </motion.div>

            {/* 公告列表弹窗 */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* 背景遮罩 */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* 公告面板 - 居中显示 */}
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                        >
                            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl max-h-[70vh] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
                                {/* 头部 */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <i className="fa-solid fa-bullhorn text-gray-500 dark:text-gray-400"></i>
                                        系统公告
                                    </h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* 公告列表 */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {announcements.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <i className="fa-solid fa-inbox text-4xl mb-3"></i>
                                            <p>暂无公告</p>
                                        </div>
                                    ) : (
                                        announcements.map((announcement) => {
                                            const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.info;
                                            return (
                                                <div
                                                    key={announcement.id}
                                                    className={`${config.bg} ${config.border} border rounded-xl p-4`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-xl">{config.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className={`font-medium ${config.text}`}>
                                                                    {announcement.title}
                                                                </h3>
                                                                <span className="text-gray-400 dark:text-gray-500 text-xs">
                                                                    {formatDate(announcement.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-600 dark:text-gray-300 text-sm">{announcement.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
