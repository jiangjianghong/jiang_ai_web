import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import AdminUserList from '@/components/Admin/AdminUserList';
import AdminAnnouncements from '@/components/Admin/AdminAnnouncements';
import AdminSystem from '@/components/Admin/AdminSystem';
import AdminAnalytics from '@/components/Admin/AdminAnalytics';
import AdminRealtime from '@/components/Admin/AdminRealtime';
import AdminLogs from '@/components/Admin/AdminLogs';

type TabType = 'dashboard' | 'users' | 'analytics' | 'realtime' | 'content' | 'logs' | 'system';

interface TabConfig {
    id: TabType;
    label: string;
    icon: string;
}

const TABS: TabConfig[] = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'analytics', label: '行为分析', icon: '📈' },
    { id: 'realtime', label: '实时监控', icon: '⚡' },
    { id: 'content', label: '公告管理', icon: '📢' },
    { id: 'logs', label: '操作日志', icon: '📋' },
    { id: 'system', label: '系统监控', icon: '⚙️' },
];

export default function Admin() {
    const navigate = useNavigate();
    const { currentUser, loading: authLoading } = useAuth();
    const { isAdmin, adminLoading } = useAdmin();
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');

    // 检查权限，非管理员重定向到首页
    useEffect(() => {
        if (!authLoading && !adminLoading) {
            if (!currentUser) {
                navigate('/');
                return;
            }
            if (!isAdmin) {
                navigate('/');
                return;
            }
        }
    }, [currentUser, isAdmin, authLoading, adminLoading, navigate]);

    // 加载中状态
    if (authLoading || adminLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white/80">验证管理员权限...</p>
                </div>
            </div>
        );
    }

    // 未授权
    if (!isAdmin) {
        return null;
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'users':
                return <AdminUserList />;
            case 'analytics':
                return <AdminAnalytics />;
            case 'realtime':
                return <AdminRealtime />;
            case 'content':
                return <AdminAnnouncements />;
            case 'logs':
                return <AdminLogs />;
            case 'system':
                return <AdminSystem />;
            default:
                return <AdminDashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                ← 返回首页
                            </button>
                            <span className="text-white/40">|</span>
                            <h1 className="text-xl font-semibold text-white">🍅 管理后台</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-white/60 text-sm">
                                {currentUser?.email}
                            </span>
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                                管理员
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-64 flex-shrink-0">
                        <nav className="space-y-1">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className="text-lg">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </main>
                </div>
            </div>
        </div>
    );
}
