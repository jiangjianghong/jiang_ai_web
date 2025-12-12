
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface AccountSettingsSectionProps {
    onClose: () => void;
}

export default function AccountSettingsSection({ onClose }: AccountSettingsSectionProps) {
    const { currentUser, logout, updatePassword, linkWithGoogle, unlinkIdentity, deleteAccount } = useAuth();
    const { displayName, updateDisplayName } = useUserProfile();

    // 账号管理二级菜单状态 'overview' | 'security'
    const [accountSubMenu, setAccountSubMenu] = useState<'overview' | 'security'>('overview');

    // 用户名编辑状态
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [nameError, setNameError] = useState('');
    const [nameLoading, setNameLoading] = useState(false);

    // 密码修改状态
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // 当 displayName 更新时，同步更新 newName
    useEffect(() => {
        setNewName(displayName || '');
    }, [displayName]);

    // 处理用户名保存
    const handleSaveName = async () => {
        if (!newName.trim()) {
            setNameError('用户名不能为空');
            return;
        }

        if (newName.length < 2 || newName.length > 20) {
            setNameError('用户名长度需在2-20个字符之间');
            return;
        }

        if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(newName)) {
            setNameError('用户名只能包含字母、数字、中文、下划线和短横线');
            return;
        }

        setNameLoading(true);
        setNameError('');

        try {
            const success = await updateDisplayName(newName);
            if (success) {
                setIsEditingName(false);
                alert('用户名更新成功！');
            } else {
                setNameError('更新失败，请重试');
            }
        } catch (error) {
            setNameError('更新失败，请重试');
            console.error('更新用户名失败:', error);
        } finally {
            setNameLoading(false);
        }
    };

    // 处理用户名取消编辑
    const handleCancelName = () => {
        setNewName(displayName || '');
        setIsEditingName(false);
        setNameError('');
    };

    // 处理密码修改
    const handleChangePassword = async () => {
        setPasswordError('');

        // 验证密码
        if (!newPassword || !confirmPassword) {
            setPasswordError('请填写完整密码信息');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('密码至少需要6位字符');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('两次输入的密码不一致');
            return;
        }

        setPasswordLoading(true);

        try {
            await updatePassword(newPassword);
            // 成功后重置表单
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePassword(false);
            alert('✅ 密码修改成功！');
        } catch (error) {
            console.error('修改密码失败:', error);
            setPasswordError((error as Error).message || '修改密码失败，请重试');
        } finally {
            setPasswordLoading(false);
        }
    };

    // 取消密码修改
    const handleCancelChangePassword = () => {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setShowChangePassword(false);
    };

    if (!currentUser) return null;

    return (
        <>
            {accountSubMenu === 'overview' ? (
                // Level 1: Overview
                <div className="space-y-4">
                    {/* User Info Card - Snapshot */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                    <i className="fa-solid fa-cat text-white text-2xl"></i>
                                </div>
                                {currentUser.email_confirmed_at && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                        <i className="fa-solid fa-envelope-circle-check text-emerald-500 text-xs"></i>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-800 mb-1 select-none">{displayName || '用户'}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 select-none">
                                    <i className="fa-solid fa-envelope text-xs"></i>
                                    <span>{currentUser.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation to Security Menu */}
                        <div className="mt-6 pt-4 border-t border-gray-100 select-none">
                            <button
                                onClick={() => setAccountSubMenu('security')}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <i className="fa-solid fa-shield-halved text-sm"></i>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-800">账号与安全</div>
                                        <div className="text-xs text-gray-400">修改资料、密码、绑定账号、注销</div>
                                    </div>
                                </div>
                                <i className="fa-solid fa-chevron-right text-gray-400 group-hover:text-gray-600 transition-colors"></i>
                            </button>
                        </div>
                    </div>

                    {/* 优雅的退出登录 */}
                    <div className="mt-4 pt-4 border-t border-blue-200/50 select-none">
                        <button
                            onClick={async () => {
                                try {
                                    await logout();
                                    onClose(); // 登出后关闭设置面板
                                } catch (error) {
                                    console.error('登出失败:', error);
                                }
                            }}
                            className="group flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-all duration-200 select-none w-full justify-center py-2 hover:bg-red-50 hover:text-red-600 rounded-xl"
                        >
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                            <span className="font-medium">退出登录</span>
                        </button>
                    </div>
                </div>
            ) : (
                // Level 2: Security Menu
                <div className="space-y-4">
                    {/* Header with Back Button */}
                    <div className="flex items-center gap-3 mb-2 px-1 select-none">
                        <button
                            onClick={() => setAccountSubMenu('overview')}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-600 hover:text-gray-900"
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <h3 className="text-lg font-medium text-gray-800">账号与安全</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                        {/* User Profile Edit */}
                        <div className="mb-6">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block select-none">个人资料</label>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                                    <i className="fa-solid fa-cat text-white text-lg"></i>
                                </div>
                                <div className="flex-1">
                                    {isEditingName ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full px-2 py-1 text-sm font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                placeholder="请输入用户名"
                                                maxLength={20}
                                                disabled={nameLoading}
                                                autoFocus
                                            />

                                            {nameError && (
                                                <p className="text-xs text-red-600 select-none">{nameError}</p>
                                            )}

                                            <div className="flex space-x-2 select-none">
                                                <button
                                                    onClick={handleSaveName}
                                                    disabled={nameLoading || !newName.trim()}
                                                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    {nameLoading ? '保存中...' : '保存'}
                                                </button>
                                                <button
                                                    onClick={handleCancelName}
                                                    disabled={nameLoading}
                                                    className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between group">
                                            <span className="font-medium text-gray-800">{displayName || '用户'}</span>
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className="text-blue-500 hover:text-blue-600 chat-bubble text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                            >
                                                修改
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="mb-6 pt-6 border-t border-gray-100 select-none">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">安全设置</label>

                            {!showChangePassword ? (
                                <button
                                    onClick={() => setShowChangePassword(true)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                            <i className="fa-solid fa-key text-xs"></i>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">修改登录密码</span>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-gray-400 group-hover:text-gray-600 transition-colors text-xs"></i>
                                </button>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">修改密码</span>
                                        <button onClick={handleCancelChangePassword} className="text-gray-400 hover:text-gray-600">
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>

                                    {passwordError && (
                                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                                            {passwordError}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            placeholder="新密码（至少6位）"
                                        />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            placeholder="确认新密码"
                                        />
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={passwordLoading || !newPassword || !confirmPassword}
                                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm transition-colors"
                                        >
                                            {passwordLoading ? '修改中...' : '确认修改'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Linked Accounts */}
                        <div className="mb-6 pt-6 border-t border-gray-100 select-none">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">关联账号</label>
                            {currentUser.identities?.some(id => id.provider === 'google') ? (
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Google 已绑定</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('确定要解绑 Google 账号吗？')) {
                                                unlinkIdentity('google');
                                            }
                                        }}
                                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                                    >
                                        解除绑定
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={linkWithGoogle}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                        <span className="text-sm font-medium text-gray-700">绑定 Google 账号</span>
                                    </div>
                                    <i className="fa-solid fa-plus text-blue-500 text-xs"></i>
                                </button>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-6 border-t border-red-50 select-none">
                            <label className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 block">危险区域</label>
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <h5 className="text-sm font-medium text-red-700 mb-1">注销账号</h5>
                                <p className="text-xs text-red-500 mb-3">此操作不可逆，将永久删除您的所有数据</p>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('警告：此操作将永久删除您的账号和所有数据！确定要继续吗？')) {
                                            // 二次确认
                                            const input = window.prompt('请在下方输入 "DELETE" 以确认删除账号');
                                            if (input === 'DELETE') {
                                                await deleteAccount();
                                            }
                                        }
                                    }}
                                    className="w-full py-2 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-sm transition-colors"
                                >
                                    注销账号
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
