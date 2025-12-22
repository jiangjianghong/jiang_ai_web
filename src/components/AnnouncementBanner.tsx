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
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
    },
    update: {
        icon: '🆕',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
    },
    warning: {
        icon: '⚠️',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
    },
    maintenance: {
        icon: '🔧',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
    },
};

export default function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            // 获取已关闭的公告ID
            const dismissedIds = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
            setDismissed(new Set(dismissedIds));

            // 获取有效公告
            const { data, error } = await supabase
                .from('announcements')
                .select('id, title, content, type, created_at')
                .eq('is_active', true)
                .or('expires_at.is.null,expires_at.gt.now()')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            // 过滤掉已关闭的公告
            const filtered = (data || []).filter(a => !dismissedIds.includes(a.id));
            setAnnouncements(filtered);
        } catch (err) {
            console.error('Failed to load announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = (id: string) => {
        // 保存到 localStorage
        const newDismissed = [...Array.from(dismissed), id];
        localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
        setDismissed(new Set(newDismissed));

        // 从列表中移除
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev + 1) % announcements.length);
    };

    const handlePrev = () => {
        setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length);
    };

    if (loading || announcements.length === 0) {
        return null;
    }

    const current = announcements[currentIndex];
    const config = TYPE_CONFIG[current.type] || TYPE_CONFIG.info;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[calc(100%-2rem)] ${config.bg} ${config.border} border rounded-xl backdrop-blur-xl shadow-lg`}
            >
                <div className="p-4 flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-xl flex-shrink-0">{config.icon}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className={`font-medium ${config.text}`}>{current.title}</div>
                        <p className="text-white/70 text-sm mt-1 line-clamp-2">{current.content}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Navigation */}
                        {announcements.length > 1 && (
                            <div className="flex items-center gap-1 mr-2">
                                <button
                                    onClick={handlePrev}
                                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center text-xs"
                                >
                                    ‹
                                </button>
                                <span className="text-white/40 text-xs px-1">
                                    {currentIndex + 1}/{announcements.length}
                                </span>
                                <button
                                    onClick={handleNext}
                                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center text-xs"
                                >
                                    ›
                                </button>
                            </div>
                        )}

                        {/* Dismiss */}
                        <button
                            onClick={() => handleDismiss(current.id)}
                            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center text-sm"
                            title="关闭此公告"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
