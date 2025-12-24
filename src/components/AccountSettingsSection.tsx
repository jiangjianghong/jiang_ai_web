import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface AccountSettingsSectionProps {
    onClose: () => void;
    onOpenSecurityModal: () => void;
}

export default function AccountSettingsSection({ onClose, onOpenSecurityModal }: AccountSettingsSectionProps) {
    const { currentUser, logout, getPrimaryEmail } = useAuth();
    const { displayName, avatarUrl } = useUserProfile();

    if (!currentUser) return null;

    // 使用 getPrimaryEmail 确保绑定 OAuth 后显示的主邮箱不变
    const primaryEmail = getPrimaryEmail();

    return (
        <div className="space-y-4">
            {/* User Info Card - Snapshot */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-gray-100"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <i className="fa-solid fa-cat text-white text-2xl"></i>
                            </div>
                        )}
                        {currentUser.email_confirmed_at && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <i className="fa-solid fa-envelope-circle-check text-emerald-500 text-xs"></i>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-1 select-none">{displayName || '用户'}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 select-none">
                            <i className="fa-solid fa-envelope text-xs"></i>
                            <span>{primaryEmail}</span>
                        </div>
                    </div>
                </div>

                {/* Navigation to Security Menu */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 select-none">
                    <button
                        onClick={onOpenSecurityModal}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <i className="fa-solid fa-shield-halved text-sm"></i>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">账号与安全</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">修改资料、密码、绑定账号、注销</div>
                            </div>
                        </div>
                        <i className="fa-solid fa-chevron-right text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"></i>
                    </button>
                </div>

                {/* 退出登录 */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 select-none">
                    <button
                        onClick={async () => {
                            try {
                                await logout();
                                onClose(); // 登出后关闭设置面板
                            } catch (error) {
                                console.error('登出失败:', error);
                            }
                        }}
                        className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
                        <span>退出登录</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
