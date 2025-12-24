import { supabase } from '@/lib/supabase';

/**
 * 从 Supabase session 中获取 Notion OAuth access token
 * @returns Notion OAuth token 或 null
 */
export async function getNotionOAuthToken(): Promise<string | null> {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('获取 session 失败:', error);
            return null;
        }

        if (!session) {
            console.warn('用户未登录');
            return null;
        }

        // 检查是否使用 Notion 登录
        const isNotionAuth = session.user?.identities?.some(
            (identity) => identity.provider === 'notion'
        );

        if (!isNotionAuth) {
            console.warn('用户未使用 Notion 登录');
            return null;
        }

        // 获取 provider token (Notion OAuth access token)
        const token = session.provider_token;

        if (!token) {
            console.warn('未找到 Notion OAuth token，可能需要重新登录');
            return null;
        }

        console.log('✅ 成功获取 Notion OAuth token');
        return token;
    } catch (error) {
        console.error('获取 Notion OAuth token 失败:', error);
        return null;
    }
}

/**
 * 检查用户是否已使用 Notion 登录
 * @returns 是否有 Notion 认证
 */
export async function hasNotionAuth(): Promise<boolean> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return false;
        }

        const isNotionAuth = session.user?.identities?.some(
            (identity) => identity.provider === 'notion'
        );

        return !!isNotionAuth && !!session.provider_token;
    } catch (error) {
        console.error('检查 Notion 认证状态失败:', error);
        return false;
    }
}

/**
 * 获取 Notion OAuth token 的详细信息（用于调试）
 * @returns Token 信息对象
 */
export async function getNotionOAuthInfo(): Promise<{
    hasToken: boolean;
    isNotionAuth: boolean;
    userId?: string;
    email?: string;
} | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return {
                hasToken: false,
                isNotionAuth: false,
            };
        }

        const isNotionAuth = session.user?.identities?.some(
            (identity) => identity.provider === 'notion'
        );

        return {
            hasToken: !!session.provider_token,
            isNotionAuth: !!isNotionAuth,
            userId: session.user?.id,
            email: session.user?.email,
        };
    } catch (error) {
        console.error('获取 Notion OAuth 信息失败:', error);
        return null;
    }
}

/**
 * 测试 Notion OAuth token 是否有效
 * 通过调用 Notion API 的 /users/me 端点验证
 * @returns Token 是否有效
 */
export async function validateNotionOAuthToken(): Promise<boolean> {
    try {
        const token = await getNotionOAuthToken();

        if (!token) {
            return false;
        }

        // 使用 Supabase Edge Function 代理测试连接
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
            console.error('未配置 VITE_SUPABASE_URL');
            return false;
        }

        const proxyUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/notion-proxy/users/me`;

        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
            },
        });

        if (response.ok) {
            console.log('✅ Notion OAuth token 验证成功');
            return true;
        } else {
            console.error('❌ Notion OAuth token 验证失败:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('验证 Notion OAuth token 时出错:', error);
        return false;
    }
}
