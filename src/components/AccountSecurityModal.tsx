import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface AccountSecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountSecurityModal({ isOpen, onClose }: AccountSecurityModalProps) {
    const { currentUser, updatePassword, linkWithGoogle, linkWithGithub, linkWithNotion, unlinkIdentity, deleteAccount } = useAuth();
    const { displayName, updateDisplayName } = useUserProfile();

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

    // 重置表单状态
    const resetFormState = () => {
        setIsEditingName(false);
        setNewName(displayName || '');
        setNameError('');
        setShowChangePassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };

    // 关闭弹窗
    const handleClose = () => {
        resetFormState();
        onClose();
    };

    // ESC键关闭弹窗
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

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

    if (!isOpen || !currentUser) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
                <motion.div
                    className="w-full max-w-2xl bg-white rounded-xl shadow-2xl z-50 max-h-[90vh] flex flex-col mx-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                    {/* 头部 */}
                    <div className="p-6 pb-0">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-shield-halved text-blue-600 text-2xl"></i>
                                <h2 className="text-2xl font-bold text-gray-800">账号与安全</h2>
                            </div>
                            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-xl">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
                        {/* User Profile Edit */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-user text-emerald-500"></i>
                                个人资料
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                                    <i className="fa-solid fa-cat text-white text-xl"></i>
                                </div>
                                <div className="flex-1">
                                    {isEditingName ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                                                    className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    {nameLoading ? '保存中...' : '保存'}
                                                </button>
                                                <button
                                                    onClick={handleCancelName}
                                                    disabled={nameLoading}
                                                    className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-medium text-gray-800 text-lg">{displayName || '用户'}</span>
                                                <p className="text-sm text-gray-500">{currentUser.email}</p>
                                            </div>
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className="text-blue-500 hover:text-blue-600 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                修改
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-key text-blue-600"></i>
                                安全设置
                            </h3>

                            {!showChangePassword ? (
                                <button
                                    onClick={() => setShowChangePassword(true)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-gray-50 transition-colors group text-left border border-gray-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <i className="fa-solid fa-lock text-sm"></i>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">修改登录密码</span>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-gray-400 group-hover:text-gray-600 transition-colors text-xs"></i>
                                </button>
                            ) : (
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">修改密码</span>
                                        <button onClick={handleCancelChangePassword} className="text-gray-400 hover:text-gray-600">
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>

                                    {passwordError && (
                                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
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
                        <div className="bg-purple-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-link text-purple-600"></i>
                                关联账号
                            </h3>
                            {currentUser.identities?.some(id => id.provider === 'google') ? (
                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Google</span>
                                            <p className="text-xs text-green-600">已绑定</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('确定要解绑 Google 账号吗？')) {
                                                unlinkIdentity('google');
                                            }
                                        }}
                                        className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        解除绑定
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={async () => {
                                        try {
                                            await linkWithGoogle();
                                        } catch (error: any) {
                                            alert('绑定失败: ' + (error.message || '未知错误'));
                                            console.error('Google linking error:', error);
                                        }
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">绑定 Google 账号</span>
                                    </div>
                                    <i className="fa-solid fa-plus text-blue-500 text-sm"></i>
                                </button>
                            )}

                            {/* GitHub Account */}
                            {currentUser.identities?.some(id => id.provider === 'github') ? (
                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 mt-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                            <i className="fa-brands fa-github text-xl"></i>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">GitHub</span>
                                            <p className="text-xs text-green-600">已绑定</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('确定要解绑 GitHub 账号吗？')) {
                                                unlinkIdentity('github');
                                            }
                                        }}
                                        className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        解除绑定
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={async () => {
                                        try {
                                            await linkWithGithub();
                                        } catch (error: any) {
                                            alert('绑定失败: ' + (error.message || '未知错误'));
                                            console.error('GitHub linking error:', error);
                                        }
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all group mt-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                            <i className="fa-brands fa-github text-xl"></i>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">绑定 GitHub 账号</span>
                                    </div>
                                    <i className="fa-solid fa-plus text-gray-500 text-sm"></i>
                                </button>
                            )}

                            {/* Notion Account */}
                            {currentUser.identities?.some(id => id.provider === 'notion') ? (
                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 mt-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                            <img src="https://www.notion.so/images/favicon.ico" alt="Notion" className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Notion</span>
                                            <p className="text-xs text-green-600">已绑定</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('确定要解绑 Notion 账号吗？')) {
                                                unlinkIdentity('notion');
                                            }
                                        }}
                                        className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        解除绑定
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={async () => {
                                        try {
                                            await linkWithNotion();
                                        } catch (error: any) {
                                            alert('绑定失败: ' + (error.message || '未知错误'));
                                            console.error('Notion linking error:', error);
                                        }
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all group mt-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                            <img src="https://www.notion.so/images/favicon.ico" alt="Notion" className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">绑定 Notion 账号</span>
                                    </div>
                                    <i className="fa-solid fa-plus text-gray-500 text-sm"></i>
                                </button>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                                危险区域
                            </h3>
                            <div className="bg-white rounded-xl p-4 border border-red-200">
                                <h5 className="text-sm font-medium text-red-700 mb-1">注销账号</h5>
                                <p className="text-xs text-red-500 mb-3">此操作不可逆，将永久删除您的所有数据</p>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('警告：此操作将永久删除您的账号和所有数据！确定要继续吗？')) {
                                            const input = window.prompt('请在下方输入 "DELETE" 以确认删除账号');
                                            if (input === 'DELETE') {
                                                await deleteAccount();
                                                handleClose();
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

                    {/* 底部 */}
                    <div className="p-6 pt-4 border-t border-gray-100">
                        <button
                            onClick={handleClose}
                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            关闭
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
