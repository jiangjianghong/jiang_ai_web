import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from './SupabaseAuthContext';

// 从环境变量读取管理员邮箱列表
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

interface AdminContextType {
    isAdmin: boolean;
    isSuperAdmin: boolean;
    adminLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}

interface AdminProviderProps {
    children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
    const { currentUser, loading: authLoading } = useAuth();
    const [adminLoading, setAdminLoading] = useState(true);

    // 判断当前用户是否为管理员
    const isAdmin = useMemo(() => {
        if (!currentUser?.email) return false;
        return ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
    }, [currentUser?.email]);

    // 超级管理员（第一个邮箱为超级管理员）
    const isSuperAdmin = useMemo(() => {
        if (!currentUser?.email || ADMIN_EMAILS.length === 0) return false;
        return currentUser.email.toLowerCase() === ADMIN_EMAILS[0];
    }, [currentUser?.email]);

    useEffect(() => {
        if (!authLoading) {
            setAdminLoading(false);
        }
    }, [authLoading]);

    const value = useMemo<AdminContextType>(() => ({
        isAdmin,
        isSuperAdmin,
        adminLoading,
    }), [isAdmin, isSuperAdmin, adminLoading]);

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
