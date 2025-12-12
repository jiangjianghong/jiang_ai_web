import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 处理 Supabase OAuth 回调
        const handleAuthCallback = async () => {
            try {
                // 检查 URL hash 中是否有 access_token (默认 implicit flow)
                // 或者 query param 中是否有 code (PKCE flow)

                // Supabase JS 客户端会自动检测 URL params 并建立 session
                // 我们只需要确保它有机会运行，然后重定向回主页

                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                if (session) {
                    // 登录成功，重定向到主页
                    // 使用 replace 防止用户点后退再次触发认证流程
                    navigate('/', { replace: true });
                } else {
                    // 处理 hash 中可能存在的 token（有时 getSession 可能在 hash 被处理前返回 null）
                    // 实际上 supabase-js在初始化时会监听 URL。
                    // 如果这里没有 session，可能是因为还没有处理完。
                    // 我们可以给一点延迟或者监听 onAuthStateChange

                    // 监听一次状态变化
                    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                        if (event === 'SIGNED_IN' && session) {
                            navigate('/', { replace: true });
                        }
                    });

                    // 如果 3秒内没有反应，则报错或跳转
                    setTimeout(() => {
                        if (!session) {
                            navigate('/'); // 尝试直接跳回主页看看
                        }
                    }, 3000);

                    return () => {
                        subscription.unsubscribe();
                    };
                }
            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message || '认证失败');
                setTimeout(() => navigate('/'), 3000);
            }
        };

        handleAuthCallback();
    }, [navigate]);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <div className="text-red-500 text-5xl mb-4">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">登录出错了</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">正在返回主页...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-medium text-gray-700">正在验证登录...</h2>
                <p className="text-gray-500 mt-2">请稍候</p>
            </div>
        </div>
    );
}
